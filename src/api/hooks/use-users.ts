import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { userKeys } from './keys'
import {
  listUsersRouteApiV1UsersGet,
  getUserRouteApiV1UsersUserUuidGet,
  updateUserRouteApiV1UsersUserUuidPatch,
  disableUserRouteApiV1UsersUserUuidDelete,
  changePasswordRouteApiV1UsersUserUuidPasswordPut,
} from '@/api/generated/sdk.gen'
import type { UserUpdate } from '@/api/generated/types.gen'

export function useUsers(params?: { skip?: number; limit?: number; role?: string }) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: async () => {
      const { data, error } = await listUsersRouteApiV1UsersGet({ query: params })
      if (error) throw error
      return data
    },
  })
}

export function useUser(uuid: string) {
  return useQuery({
    queryKey: userKeys.detail(uuid),
    queryFn: async () => {
      const { data, error } = await getUserRouteApiV1UsersUserUuidGet({ path: { user_uuid: uuid } })
      if (error) throw error
      return data
    },
    enabled: !!uuid,
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ uuid, data: body }: { uuid: string; data: UserUpdate }) => {
      const { data, error } = await updateUserRouteApiV1UsersUserUuidPatch({ path: { user_uuid: uuid }, body })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

export function useDisableUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (uuid: string) => {
      const { data, error } = await disableUserRouteApiV1UsersUserUuidDelete({ path: { user_uuid: uuid } })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ uuid, newPassword }: { uuid: string; newPassword: string }) => {
      const { data, error } = await changePasswordRouteApiV1UsersUserUuidPasswordPut({
        path: { user_uuid: uuid },
        body: { new_password: newPassword },
      })
      if (error) throw error
      return data
    },
  })
}
