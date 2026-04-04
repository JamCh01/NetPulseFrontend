import { useQuery } from '@tanstack/react-query'
import { dashboardKeys } from './keys'
import { dashboardStatsApiV1DashboardStatsGet } from '@/api/generated/sdk.gen'

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const { data, error } = await dashboardStatsApiV1DashboardStatsGet()
      if (error) {
        throw error
      }
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}
