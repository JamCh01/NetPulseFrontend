import { useQuery } from '@tanstack/react-query'
import { healthKeys } from './keys'
import { healthHealthGet } from '@/api/generated/sdk.gen'

export function useHealth() {
  return useQuery({
    queryKey: healthKeys.status(),
    queryFn: async () => {
      const { data, error } = await healthHealthGet()
      if (error) throw error
      return data
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}
