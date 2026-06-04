import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { agentUpdateKeys } from './keys'
import {
  dispatchAgentUpdatePolicyApiV1AgentUpdatePoliciesPolicyUuidDispatchPost,
  getAgentUpdateAssignmentsApiV1AgentUpdateAssignmentsGet,
  getAgentUpdatePoliciesApiV1AgentUpdatePoliciesGet,
  postAgentUpdatePolicyApiV1AgentUpdatePoliciesPost,
} from '@/api/generated/sdk.gen'
import type {
  AgentUpdateAssignmentListEnvelope,
  AgentUpdatePolicyCreate,
  AgentUpdatePolicyListEnvelope,
} from '@/api/generated/types.gen'

export interface AgentUpdateAssignmentFilters {
  agent_uuid?: string
  policy_uuid?: string
  state?: string
}

function cleanAssignmentFilters(filters: AgentUpdateAssignmentFilters = {}) {
  return {
    agent_uuid: filters.agent_uuid?.trim() || undefined,
    policy_uuid: filters.policy_uuid?.trim() || undefined,
    state: filters.state?.trim() || undefined,
  }
}

export function useAgentUpdatePolicies() {
  return useQuery({
    queryKey: agentUpdateKeys.policies(),
    queryFn: async () => {
      const { data, error } = await getAgentUpdatePoliciesApiV1AgentUpdatePoliciesGet()
      if (error) throw error
      return data as AgentUpdatePolicyListEnvelope
    },
  })
}

export function useAgentUpdateAssignments(filters: AgentUpdateAssignmentFilters = {}) {
  const query = cleanAssignmentFilters(filters)
  return useQuery({
    queryKey: agentUpdateKeys.assignments(query),
    queryFn: async () => {
      const { data, error } = await getAgentUpdateAssignmentsApiV1AgentUpdateAssignmentsGet({ query })
      if (error) throw error
      return data as AgentUpdateAssignmentListEnvelope
    },
  })
}

export function useCreateAgentUpdatePolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: AgentUpdatePolicyCreate) => {
      const { data, error } = await postAgentUpdatePolicyApiV1AgentUpdatePoliciesPost({ body })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentUpdateKeys.all })
    },
  })
}

export function useDispatchAgentUpdatePolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (policyUuid: string) => {
      const { data, error } = await dispatchAgentUpdatePolicyApiV1AgentUpdatePoliciesPolicyUuidDispatchPost({
        path: { policy_uuid: policyUuid },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentUpdateKeys.all })
    },
  })
}

