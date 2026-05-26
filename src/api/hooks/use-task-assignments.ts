import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { taskKeys, agentKeys } from './keys'
import {
  adminRequest,
  normalizeAgent,
  type AdminAgent,
} from './admin-api'

export interface AgentTaskAssign {
  agent_uuids: string[]
}

export function useTaskAgents(taskUuid: string) {
  return useQuery({
    queryKey: taskKeys.agents(taskUuid),
    queryFn: async () => {
      const agents = await adminRequest<AdminAgent[]>(`/api/v1/tasks/${taskUuid}/agents`)
      return agents.map(normalizeAgent)
    },
    enabled: !!taskUuid,
  })
}

export function useAssignAgents() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskUuid, data: body }: { taskUuid: string; data: AgentTaskAssign }) => {
      return adminRequest<AdminAgent[]>(`/api/v1/tasks/${taskUuid}/assign`, {
        method: 'POST',
        body: JSON.stringify(body),
      })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.agents(variables.taskUuid) })
      queryClient.invalidateQueries({ queryKey: agentKeys.all })
    },
  })
}

export function useUnassignAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskUuid, agentUuid }: { taskUuid: string; agentUuid: string }) => {
      return adminRequest<void>(`/api/v1/tasks/${taskUuid}/agents/${agentUuid}`, { method: 'DELETE' })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.agents(variables.taskUuid) })
      queryClient.invalidateQueries({ queryKey: agentKeys.all })
    },
  })
}
