import { useQuery } from '@tanstack/react-query'
import { buildApiUrl } from '@/api/base-url'
import { monitoringKeys } from './keys'
import {
  groupMonitoringTasksByTarget,
  normalizeMonitoringTask,
  type MonitoringTargetGroup,
  type MonitoringTask,
} from '@/features/monitoring/lib/monitoring-models'

type MonitoringEnvelope = {
  data?: {
    items?: unknown[]
  }
}

export interface MonitoringTasksView {
  tasks: MonitoringTask[]
  groups: MonitoringTargetGroup[]
}

interface UsePublicMonitoringTasksOptions {
  pageSize?: number
  targetUuid?: string | null
  enabled?: boolean
}

export function usePublicMonitoringTasks(options: number | UsePublicMonitoringTasksOptions = 200) {
  const resolvedOptions = typeof options === 'number' ? { pageSize: options } : options
  const pageSize = resolvedOptions.pageSize ?? 200
  const targetUuid = resolvedOptions.targetUuid ?? null
  const enabled = resolvedOptions.enabled ?? true
  const normalizedPageSize = Math.min(Math.max(pageSize, 1), 100)

  return useQuery({
    queryKey: monitoringKeys.tasks({ page: 1, page_size: normalizedPageSize, target_uuid: targetUuid ?? undefined }),
    queryFn: async (): Promise<MonitoringTasksView> => {
      const params = new URLSearchParams({
        page: '1',
        page_size: String(normalizedPageSize),
      })
      if (targetUuid) params.set('target_uuid', targetUuid)

      const res = await fetch(buildApiUrl(`/api/v1/monitoring/tasks?${params.toString()}`))
      if (!res.ok) throw new Error(`Failed to load monitoring tasks: ${res.status}`)
      const body = (await res.json()) as MonitoringEnvelope
      const items = body?.data?.items ?? []
      const tasks = items.map(normalizeMonitoringTask).filter((task) => task.task_uuid)
      return {
        tasks,
        groups: groupMonitoringTasksByTarget(tasks),
      }
    },
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}
