import { useQuery } from '@tanstack/react-query'
import { dashboardKeys } from './keys'
import { reportMissingApi } from '@/lib/api-compat'
import { adminRequest } from './admin-api'
import type { DashboardStats } from '@/api/types'

let dashboardStatsUnsupported = false

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
      if (dashboardStatsUnsupported) {
        return { __unsupported: true } as const
      }
      try {
        return await adminRequest<DashboardStats>('/api/v1/dashboard/stats')
      } catch (error) {
        if (isNotFoundError(error)) {
          dashboardStatsUnsupported = true
          reportMissingApi('/api/v1/dashboard/stats')
          return { __unsupported: true } as const
        }
        throw error
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (isNotFoundError(error)) return false
      return failureCount < 2
    },
  })
}
