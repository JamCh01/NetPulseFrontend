import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { agentKeys } from './keys'
import {
  listAgentsApiV1AgentsGet,
  getAgentApiV1AgentsAgentUuidGet,
  createAgentApiV1AgentsPost,
  updateAgentApiV1AgentsAgentUuidPatch,
  disableAgentApiV1AgentsAgentUuidDelete,
} from '@/api/generated/sdk.gen'
import type { AgentCreate, AgentUpdate } from '@/api/generated/types.gen'

export function useAgents(params?: { skip?: number; limit?: number; tags?: string[] }) {
  return useQuery({
    queryKey: agentKeys.list(params),
    queryFn: async () => {
      const { data, error } = await listAgentsApiV1AgentsGet({ query: params })
      if (error) throw error
      return data
    },
  })
}

export function useAgent(uuid: string) {
  return useQuery({
    queryKey: agentKeys.detail(uuid),
    queryFn: async () => {
      const { data, error } = await getAgentApiV1AgentsAgentUuidGet({ path: { agent_uuid: uuid } })
      if (error) throw error
      return data
    },
    enabled: !!uuid,
  })
}

export function useCreateAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: AgentCreate) => {
      const { data, error } = await createAgentApiV1AgentsPost({ body })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all })
    },
  })
}

export function useUpdateAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ uuid, data: body }: { uuid: string; data: AgentUpdate }) => {
      const { data, error } = await updateAgentApiV1AgentsAgentUuidPatch({ path: { agent_uuid: uuid }, body })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all })
    },
  })
}

export function useDisableAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (uuid: string) => {
      const { data, error } = await disableAgentApiV1AgentsAgentUuidDelete({ path: { agent_uuid: uuid } })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all })
    },
  })
}
