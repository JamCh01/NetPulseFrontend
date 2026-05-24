import { useMutation } from '@tanstack/react-query'

import { changePasswordRouteApiV1UsersUserUuidPasswordPut } from '@/api/generated/sdk.gen'

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
