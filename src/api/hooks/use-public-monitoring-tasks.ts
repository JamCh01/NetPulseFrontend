import { useQuery } from '@tanstack/react-query'
import { buildApiUrl } from '@/api/base-url'

type PublicMonitoringTask = {
  task_uuid: string
  task_name: string
  protocol: string
  target: string
  port?: number | null
  interval?: number
}

type MonitoringTaskItem = {
  task_uuid: string
  name?: string
  task_type?: string
  target?: string | {
    target?: string
    name?: string
  } | null
  interval?: number
  probe_config?: {
    port?: number | null
  } | null
}

type MonitoringEnvelope = {
  data?: {
    items?: MonitoringTaskItem[]
  }
}

function readTargetLabel(target: MonitoringTaskItem['target']): string {
  if (typeof target === 'string') return target
  if (target && typeof target === 'object') {
    if (typeof target.target === 'string' && target.target.length > 0) return target.target
    if (typeof target.name === 'string' && target.name.length > 0) return target.name
  }
  return '-'
}

export function usePublicMonitoringTasks(pageSize = 200) {
  return useQuery({
    queryKey: ['public-monitoring-tasks', pageSize],
    queryFn: async (): Promise<PublicMonitoringTask[]> => {
      const normalizedPageSize = Math.min(Math.max(pageSize, 1), 100)
      const res = await fetch(buildApiUrl(`/api/v1/monitoring/tasks?page=1&page_size=${normalizedPageSize}`))
      if (!res.ok) throw new Error(`Failed to load monitoring tasks: ${res.status}`)
      const body = (await res.json()) as MonitoringEnvelope
      const items = body?.data?.items ?? []

      return items.map((item) => ({
        task_uuid: item.task_uuid,
        task_name: item.name ?? item.task_uuid,
        protocol: (item.task_type ?? 'icmp').toLowerCase(),
        target: readTargetLabel(item.target),
        port: item.probe_config?.port ?? null,
        interval: item.interval ?? 60,
      }))
    },
  })
}
