import { client } from '@/api/generated/client.gen'
import { useAuthStore } from '@/stores/auth-store'
import { postV1AuthRefreshApiV1AuthRefreshPost } from '@/api/generated/sdk.gen'

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

function extractTokens(data: unknown): { accessToken: string; refreshToken: string } | null {
  if (typeof data !== 'object' || data === null) return null
  const root = data as Record<string, unknown>
  const nested = typeof root.data === 'object' && root.data !== null
    ? (root.data as Record<string, unknown>)
    : null
  const source = nested ?? root
  const accessToken = typeof source.access_token === 'string' ? source.access_token : null
  if (!accessToken) return null
  const refreshToken = accessToken
  return { accessToken, refreshToken }
}

async function doRefresh(): Promise<boolean> {
  const state = useAuthStore.getState()
  const refreshToken = state.refreshToken
  const accessToken = state.accessToken
  const currentToken = accessToken ?? refreshToken
  if (!currentToken) return false

  try {
    const { data, error } = await postV1AuthRefreshApiV1AuthRefreshPost({
      headers: { authorization: `Bearer ${currentToken}` },
    })
    if (error) {
      return false
    }
    const tokens = extractTokens(data)
    if (tokens) {
      useAuthStore.getState().setTokens(tokens.accessToken, tokens.refreshToken)
      return true
    }
    return false
  } catch {
    return false
  }
}

export function configureApiClient() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
  const baseUrl = configuredBaseUrl || window.location.origin

  client.setConfig({ baseUrl })

  // Request interceptor: inject auth token
  client.interceptors.request.use((request) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }
    return request
  })

  // Response interceptor: handle 429 rate limiting and 401 with token refresh
  client.interceptors.response.use(async (response, request) => {
    // Handle 429 rate limiting
    if (response.status === 429) {
      const url = new URL(request.url, window.location.origin)
      if (url.pathname.includes('/auth/refresh')) {
        const retryCount = (request as Request & { _retryCount?: number })._retryCount ?? 0
        if (retryCount < 2) {
          await new Promise((resolve) => setTimeout(resolve, 5000))
          const retryRequest = request.clone() as Request & { _retryCount?: number }
          retryRequest._retryCount = retryCount + 1
          return fetch(retryRequest)
        }
        // All retries exhausted — fall through to 401 handler below
      } else {
        return response
      }
    }

    if (response.status !== 401) return response

    // Don't try to refresh on auth endpoints
    const url = new URL(request.url, window.location.origin)
    if (url.pathname.includes('/auth/')) return response

    // Check for revoked token — don't attempt refresh
    try {
      const body = await response.clone().json()
      if (body?.detail === 'Token has been revoked') {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return response
      }
    } catch {
      // If we can't parse the body, proceed with normal refresh flow
    }

    // Use mutex to prevent concurrent refresh attempts
    if (!isRefreshing) {
      isRefreshing = true
      refreshPromise = doRefresh().finally(() => {
        isRefreshing = false
      })
    }

    const refreshed = await refreshPromise
    if (!refreshed) {
      // Only redirect to login if the user had a session (token existed).
      // Public pages (e.g. /monitoring) may trigger 401 without any session — don't redirect.
      const hadSession = useAuthStore.getState().accessToken !== null || useAuthStore.getState().refreshToken !== null
      useAuthStore.getState().logout()
      if (hadSession) {
        window.location.href = '/login'
      }
      return response
    }

    // Retry original request with new token
    const newToken = useAuthStore.getState().accessToken
    if (newToken) {
      request.headers.set('Authorization', `Bearer ${newToken}`)
    }
    return fetch(request)
  })
}
