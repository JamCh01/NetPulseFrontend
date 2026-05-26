import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { settingsKeys } from './keys'
import {
  getSystemSettingsApiV1SettingsGet,
  patchSystemSettingsApiV1SettingsPatch,
} from '@/api/generated/sdk.gen'
import type { AppSettingsEnvelope, AppSettingsUpdate } from '@/api/generated/types.gen'

export function useSystemSettings() {
  return useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: async () => {
      const { data, error } = await getSystemSettingsApiV1SettingsGet()
      if (error) throw error
      return data as AppSettingsEnvelope
    },
  })
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: AppSettingsUpdate) => {
      const { data, error } = await patchSystemSettingsApiV1SettingsPatch({ body })
      if (error) throw error
      return data as AppSettingsEnvelope
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
    },
  })
}
