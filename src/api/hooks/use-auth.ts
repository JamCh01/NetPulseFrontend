import { useMutation } from '@tanstack/react-query'
import {
  loginRouteApiV1AuthLoginPost,
  logoutRouteApiV1AuthLogoutPost,
  refreshRouteApiV1AuthRefreshPost,
  registerRouteApiV1AuthRegisterPost,
} from '@/api/generated/sdk.gen'
import { useAuthStore } from '@/stores/auth-store'
import { decodeJwt } from '@/lib/jwt'
import type { LoginRequest, UserCreate } from '@/api/generated/types.gen'

interface NormalizedAuthResponse {
  accessToken: string
  refreshToken: string
  username: string
}

function normalizeAuthResponse(data: unknown, fallbackUsername: string): NormalizedAuthResponse {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid auth response')
  }
  const root = data as Record<string, unknown>
  const nested = typeof root.data === 'object' && root.data !== null
    ? (root.data as Record<string, unknown>)
    : null

  const source = nested ?? root
  const accessToken = typeof source.access_token === 'string' ? source.access_token : null
  if (!accessToken) {
    throw new Error('Invalid auth response')
  }
  const refreshToken = typeof source.refresh_token === 'string' ? source.refresh_token : accessToken
  const admin = typeof source.admin === 'object' && source.admin !== null
    ? (source.admin as Record<string, unknown>)
    : null
  const username = typeof admin?.username === 'string' ? admin.username : fallbackUsername

  return { accessToken, refreshToken, username }
}

export function useLogin() {
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const { data, error } = await loginRouteApiV1AuthLoginPost({
        body: credentials,
      })
      if (error) {
        throw error
      }
      return normalizeAuthResponse(data, credentials.username)
    },
    onSuccess: ({ accessToken, refreshToken, username }) => {
      setTokens(accessToken, refreshToken)
      const payload = decodeJwt(accessToken)
      if (payload) {
        setUser({
          uuid: payload.sub,
          username,
          role: payload.role,
        })
      } else {
        setUser({
          uuid: `admin:${username}`,
          username,
          role: 'admin',
        })
      }
    },
  })
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout)

  return useMutation({
    mutationFn: async () => {
      const refreshToken = useAuthStore.getState().refreshToken
      try {
        await logoutRouteApiV1AuthLogoutPost({
          body: refreshToken ? { refresh_token: refreshToken } : undefined,
        })
      } catch {
        // Ignore errors — we always clear local state
      }
    },
    onSettled: () => {
      logout()
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: async (userData: UserCreate) => {
      const { data, error } = await registerRouteApiV1AuthRegisterPost({
        body: userData,
      })
      if (error) {
        throw error
      }
      return data
    },
  })
}

export function useRefreshSession() {
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: async () => {
      const state = useAuthStore.getState()
      const currentToken = state.accessToken ?? state.refreshToken
      if (!currentToken) {
        throw new Error('No token available')
      }
      const { data, error } = await refreshRouteApiV1AuthRefreshPost({
        body: { refresh_token: state.refreshToken ?? currentToken },
        headers: { authorization: `Bearer ${currentToken}` },
      })
      if (error) {
        throw error
      }
      const fallbackUsername = state.user?.username ?? 'admin'
      return normalizeAuthResponse(data, fallbackUsername)
    },
    onSuccess: ({ accessToken, refreshToken, username }) => {
      setTokens(accessToken, refreshToken)
      const payload = decodeJwt(accessToken)
      if (payload) {
        setUser({
          uuid: payload.sub,
          username,
          role: payload.role,
        })
      } else {
        setUser({
          uuid: `admin:${username}`,
          username,
          role: 'admin',
        })
      }
    },
  })
}
