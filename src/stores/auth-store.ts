import { create } from 'zustand'

interface AuthUser {
  uuid: string
  username: string
  role: 'admin' | 'subscriber'
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  setTokens: (access: string, refresh: string) => void
  setUser: (user: AuthUser | null) => void
  logout: () => void
  isAuthenticated: () => boolean
  isAdmin: () => boolean
}

const REFRESH_TOKEN_KEY = 'netpulse_refresh_token'

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  user: null,

  setTokens: (access, refresh) => {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
    set({ accessToken: access, refreshToken: refresh })
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
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
}))
