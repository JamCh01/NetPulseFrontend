import { useQuery } from '@tanstack/react-query'
import { buildApiUrl } from '@/api/base-url'
import { monitoringKeys } from './keys'
import type { TargetGeoTreeData } from '@/features/monitoring/lib/target-geo-tree'

interface TargetGeoTreeEnvelope {
  data?: TargetGeoTreeData
}

export function useTargetGeoTree() {
  return useQuery({
    queryKey: monitoringKeys.targetGeoTree(),
    queryFn: async (): Promise<TargetGeoTreeData> => {
      const res = await fetch(buildApiUrl('/api/v1/monitoring/target-geo-tree'))
      if (!res.ok) {
        throw new Error(`Failed to load target geo tree: ${res.status}`)
      }
      const body = (await res.json()) as TargetGeoTreeEnvelope
      return body.data ?? { tree: [], anycast: { target_count: 0, targets: [] }, total_target_count: 0, anycast_target_count: 0 }
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  })
}
