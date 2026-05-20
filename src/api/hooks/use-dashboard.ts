import { useQuery } from '@tanstack/react-query'
import { dashboardKeys } from './keys'
import { dashboardStatsApiV1DashboardStatsGet } from '@/api/generated/sdk.gen'
import { reportMissingApi } from '@/lib/api-compat'

function isNotFoundError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'status' in error &&
    (error as { status?: unknown }).status === 404,
  )
}

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const { data, error } = await dashboardStatsApiV1DashboardStatsGet()
      if (error) {
        if (isNotFoundError(error)) {
          reportMissingApi('/api/v1/dashboard/stats')
          return { __unsupported: true } as const
        }
        throw error
      }
      return data
    },
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (isNotFoundError(error)) return false
      return failureCount < 2
    },
  })
}
