import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { taskKeys } from './keys'
import {
  getTaskAgentsEndpointApiV1TasksTaskUuidAgentsGet,
  assignTaskEndpointApiV1TasksTaskUuidAssignPost,
  unassignTaskEndpointApiV1TasksTaskUuidAgentsAgentUuidDelete,
} from '@/api/generated/sdk.gen'
import type { AgentTaskAssign } from '@/api/generated/types.gen'

export function useTaskAgents(taskUuid: string) {
  return useQuery({
    queryKey: taskKeys.agents(taskUuid),
    queryFn: async () => {
      const { data, error } = await getTaskAgentsEndpointApiV1TasksTaskUuidAgentsGet({ path: { task_uuid: taskUuid } })
      if (error) throw error
      return data
    },
    enabled: !!taskUuid,
  })
}

export function useAssignAgents() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskUuid, data: body }: { taskUuid: string; data: AgentTaskAssign }) => {
      const { data, error } = await assignTaskEndpointApiV1TasksTaskUuidAssignPost({
        path: { task_uuid: taskUuid },
        body,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.agents(variables.taskUuid) })
    },
  })
}

export function useUnassignAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskUuid, agentUuid }: { taskUuid: string; agentUuid: string }) => {
      const { data, error } = await unassignTaskEndpointApiV1TasksTaskUuidAgentsAgentUuidDelete({
        path: { task_uuid: taskUuid, agent_uuid: agentUuid },
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.agents(variables.taskUuid) })
    },
  })
}
