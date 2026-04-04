import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { agentKeys, taskKeys } from './keys'
import {
  getAgentTasksApiV1AgentsAgentUuidTasksGet,
  assignTaskEndpointApiV1TasksTaskUuidAssignPost,
  unassignTaskEndpointApiV1TasksTaskUuidAgentsAgentUuidDelete,
} from '@/api/generated/sdk.gen'
import type { AgentTaskAssign } from '@/api/generated/types.gen'

export function useAgentTasks(agentUuid: string) {
  return useQuery({
    queryKey: agentKeys.tasks(agentUuid),
    queryFn: async () => {
      const { data, error } = await getAgentTasksApiV1AgentsAgentUuidTasksGet({
        path: { agent_uuid: agentUuid },
      })
      if (error) throw error
      return data
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
      const { data, error } = await assignTaskEndpointApiV1TasksTaskUuidAssignPost({
        path: { task_uuid: taskUuid },
        body,
      })
      if (error) throw error
      return data
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
      const { data, error } = await unassignTaskEndpointApiV1TasksTaskUuidAgentsAgentUuidDelete({
        path: { task_uuid: taskUuid, agent_uuid: agentUuid },
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.agents(variables.taskUuid) })
      queryClient.invalidateQueries({ queryKey: agentKeys.tasks(variables.agentUuid) })
    },
  })
}
