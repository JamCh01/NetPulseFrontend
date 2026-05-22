import { useQuery } from '@tanstack/react-query'
import { buildApiUrl } from '@/api/base-url'
import { normalizeMonitoringTask, type MonitoringTask } from '@/features/monitoring/lib/monitoring-models'

interface MonitoringTaskDetailEnvelope {
  data?: unknown
}

export function useMonitoringTaskDetail(taskUuid: string) {
  return useQuery({
    queryKey: ['monitoring', 'task-detail', taskUuid],
    queryFn: async () => {
      const res = await fetch(buildApiUrl(`/api/v1/monitoring/tasks/${taskUuid}`))
      if (!res.ok) {
        throw new Error(`Failed to load monitoring task detail: ${res.status}`)
      }
      const body = (await res.json()) as MonitoringTaskDetailEnvelope
      const item = body.data
      if (!item) {
        throw new Error('No monitoring task detail data returned')
      }
      const task = normalizeMonitoringTask(item)
      const taskAgents = task.agent
        ? [{ agent_uuid: task.agent.agent_uuid, agent_name: task.agent.name, agent: task.agent }]
        : []

      return { task, taskAgents }
    },
    enabled: !!taskUuid,
  })
}

export type MonitoringTaskDetailView = MonitoringTask
