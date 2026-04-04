import { useMutation } from '@tanstack/react-query'
import {
  loginRouteApiV1AuthLoginPost,
  registerRouteApiV1AuthRegisterPost,
} from '@/api/generated/sdk.gen'
import { useAuthStore } from '@/stores/auth-store'
import { decodeJwt } from '@/lib/jwt'
import type { LoginRequest, UserCreate } from '@/api/generated/types.gen'

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
      return { tokenResponse: data, username: credentials.username }
    },
    onSuccess: ({ tokenResponse, username }) => {
      setTokens(tokenResponse.access_token, tokenResponse.refresh_token)
      const payload = decodeJwt(tokenResponse.access_token)
      if (payload) {
        setUser({
          uuid: payload.sub,
          username,
          role: payload.role,
        })
      }
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
