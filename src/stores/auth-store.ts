import { create } from 'zustand'
import { decodeJwt, isJwtToken, isTokenExpired } from '@/lib/jwt'
import { buildApiUrl } from '@/api/base-url'

interface AuthUser {
  uuid: string
  username: string
  role: 'admin' | 'subscriber'
}

function parseAuthUser(json: string): AuthUser | null {
  try {
    const parsed: unknown = JSON.parse(json)
    if (
      typeof parsed === 'object' && parsed !== null &&
      'uuid' in parsed && typeof (parsed as Record<string, unknown>).uuid === 'string' &&
      'username' in parsed && typeof (parsed as Record<string, unknown>).username === 'string' &&
      'role' in parsed && ((parsed as Record<string, unknown>).role === 'admin' || (parsed as Record<string, unknown>).role === 'subscriber')
    ) {
      return parsed as AuthUser
    }
    return null
  } catch {
    return null
  }
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  initialized: boolean
  setTokens: (access: string, refresh: string) => void
  setUser: (user: AuthUser | null) => void
  logout: () => void
  isAuthenticated: () => boolean
  isAdmin: () => boolean
  initFromStorage: () => Promise<void>
}

const REFRESH_TOKEN_KEY = 'netpulse_refresh_token'
const ACCESS_TOKEN_KEY = 'netpulse_access_token'
const USER_KEY = 'netpulse_user'
let initPromise: Promise<void> | null = null
let hasInitializedOnce = false

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  user: null,
  initialized: false,

  setTokens: (access, refresh) => {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    set({ accessToken: access, refreshToken: refresh })
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_KEY)
    }
    set({ user })
  },

  logout: () => {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    set({ accessToken: null, refreshToken: null, user: null })
  },

  isAuthenticated: () => {
    const state = get()
    return state.accessToken !== null && state.user !== null
  },

  isAdmin: () => {
    const state = get()
    return state.user?.role === 'admin'
  },

  /**
   * Restore session from localStorage on app startup.
   * If accessToken is still valid, use it directly.
   * If expired but refreshToken exists, attempt a refresh.
   */
  initFromStorage: async () => {
    if (hasInitializedOnce || get().initialized) {
      return
    }
    if (initPromise) {
      return initPromise
    }
    initPromise = (async () => {
    const storedAccess = localStorage.getItem(ACCESS_TOKEN_KEY)
    const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)

    // Try to restore from stored access token.
    // Opaque (non-JWT) tokens are considered valid here and validated by backend on request.
    if (storedAccess && storedUser && (!isJwtToken(storedAccess) || !isTokenExpired(storedAccess))) {
      const user = parseAuthUser(storedUser)
      if (user) {
        set({ accessToken: storedAccess, refreshToken: storedRefresh, user, initialized: true })
        return
      }
    }

    // Access token expired or missing — try refresh
    if (storedRefresh) {
      try {
        const res = await fetch(buildApiUrl('/api/v1/auth/refresh'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${storedRefresh}` },
        })
        if (res.ok) {
          const body = await res.json()
          const data = body?.data ?? body
          const accessToken = data.access_token
          const payload = decodeJwt(accessToken)
          if (payload) {
            const user: AuthUser = {
              uuid: payload.sub,
              username: storedUser ? (parseAuthUser(storedUser)?.username ?? 'user') : 'user',
              role: payload.role,
            }
            localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
            localStorage.setItem(REFRESH_TOKEN_KEY, accessToken)
            localStorage.setItem(USER_KEY, JSON.stringify(user))
            set({
              accessToken,
              refreshToken: accessToken,
              user,
              initialized: true,
            })
            return
          }
        }
      } catch {
        // refresh failed, fall through to logout
      }
    }

    // Nothing worked — clear everything
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    set({ accessToken: null, refreshToken: null, user: null, initialized: true })
    })().finally(() => {
      hasInitializedOnce = true
      initPromise = null
    })
    return initPromise
  },
}))
