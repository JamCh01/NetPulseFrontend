import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { agentKeys, taskKeys } from './keys'
import {
  adminRequest,
  normalizeTask,
  type AdminAgent,
  type AdminTask,
} from './admin-api'

export interface AgentTaskAssign {
  agent_uuids: string[]
}

export function useAgentTasks(agentUuid: string) {
  return useQuery({
    queryKey: agentKeys.tasks(agentUuid),
    queryFn: async () => {
      const tasks = await adminRequest<AdminTask[]>(`/api/v1/agents/${agentUuid}/tasks`)
      return tasks.map(normalizeTask)
    },
    enabled: !!agentUuid,
  })
}

export function useAssignTasksFromAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      taskUuid,
      data: body,
    }: {
      taskUuid: string
      agentUuid: string
      data: AgentTaskAssign
    }) => {
      return adminRequest<AdminAgent[]>(`/api/v1/tasks/${taskUuid}/assign`, {
        method: 'POST',
        body: JSON.stringify(body),
      })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.agents(variables.taskUuid) })
      queryClient.invalidateQueries({ queryKey: agentKeys.tasks(variables.agentUuid) })
    },
  })
}

export function useUnassignTaskFromAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskUuid, agentUuid }: { taskUuid: string; agentUuid: string }) => {
      return adminRequest<void>(`/api/v1/tasks/${taskUuid}/agents/${agentUuid}`, { method: 'DELETE' })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.agents(variables.taskUuid) })
      queryClient.invalidateQueries({ queryKey: agentKeys.tasks(variables.agentUuid) })
    },
  })
}
