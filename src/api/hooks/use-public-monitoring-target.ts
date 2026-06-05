import { useQuery } from '@tanstack/react-query'
import { buildApiUrl } from '@/api/base-url'
import { monitoringKeys } from './keys'
import {
  normalizeMonitoringTarget,
  type MonitoringTarget,
} from '@/features/monitoring/lib/monitoring-models'

type MonitoringTargetEnvelope = {
  data?: unknown
}

export function usePublicMonitoringTarget(targetUuid: string | null | undefined) {
  return useQuery({
    queryKey: monitoringKeys.target(targetUuid ?? ''),
    queryFn: async (): Promise<MonitoringTarget> => {
      const res = await fetch(buildApiUrl(`/api/v1/monitoring/targets/${encodeURIComponent(targetUuid ?? '')}`))
      if (!res.ok) throw new Error(`Failed to load monitoring target: ${res.status}`)
      const body = (await res.json()) as MonitoringTargetEnvelope
      return normalizeMonitoringTarget(body.data)
    },
    enabled: Boolean(targetUuid),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}
