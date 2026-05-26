import { useMutation } from '@tanstack/react-query'

import { adminRequest } from './admin-api'

export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ uuid, newPassword }: { uuid: string; newPassword: string }) => {
      return adminRequest<unknown>(`/api/v1/users/${uuid}/password`, {
        method: 'PUT',
        body: JSON.stringify({ new_password: newPassword }),
      })
    },
  })
}
