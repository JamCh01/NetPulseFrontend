import { client } from '@/api/generated/client.gen'
import { useAuthStore } from '@/stores/auth-store'
import { refreshRouteApiV1AuthRefreshPost } from '@/api/generated/sdk.gen'

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function doRefresh(): Promise<boolean> {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) return false

  try {
    const { data } = await refreshRouteApiV1AuthRefreshPost({
      body: { refresh_token: refreshToken },
    })
    if (data) {
      useAuthStore.getState().setTokens(data.access_token, data.refresh_token)
      return true
    }
    return false
  } catch {
    return false
  }
}

export function configureApiClient() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''

  client.setConfig({ baseUrl })

  // Request interceptor: inject auth token
  client.interceptors.request.use((request) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }
    return request
  })

  // Response interceptor: handle 401 with token refresh
  client.interceptors.response.use(async (response, request) => {
    if (response.status !== 401) return response

    // Don't try to refresh on auth endpoints
    const url = new URL(request.url, window.location.origin)
    if (url.pathname.includes('/auth/')) return response

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
