import { useQuery } from '@tanstack/react-query'
import { buildApiUrl } from '@/api/base-url'

export interface MonitoringTaskDetailView {
  task_uuid: string
  task_name: string
  protocol: string
  target: string
  port: number | null
}

export interface MonitoringTaskAgentView {
  agent_uuid: string
  agent_name: string
}

interface MonitoringTaskDetailEnvelope {
  data?: {
    task_uuid: string
    name?: string
    task_type?: string
    probe_config?: {
      port?: number | null
    } | null
    target?: {
      target?: string
      name?: string
    } | null
    agent?: {
      agent_uuid: string
      name?: string
    } | null
  }
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

      const targetLabel = item.target?.target || item.target?.name || '-'
      const task: MonitoringTaskDetailView = {
        task_uuid: item.task_uuid,
        task_name: item.name ?? item.task_uuid,
        protocol: (item.task_type ?? 'icmp').toLowerCase(),
        target: targetLabel,
        port: item.probe_config?.port ?? null,
      }

      const taskAgents: MonitoringTaskAgentView[] = item.agent
        ? [{ agent_uuid: item.agent.agent_uuid, agent_name: item.agent.name ?? item.agent.agent_uuid }]
        : []

      return { task, taskAgents }
    },
    enabled: !!taskUuid,
  })
}
