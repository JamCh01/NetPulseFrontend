import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { alertKeys } from './keys'
import {
  listRulesEndpointApiV1AlertsRulesGet,
  getRuleEndpointApiV1AlertsRulesRuleUuidGet,
  createRuleEndpointApiV1AlertsRulesPost,
  updateRuleEndpointApiV1AlertsRulesRuleUuidPatch,
  deleteRuleEndpointApiV1AlertsRulesRuleUuidDelete,
} from '@/api/generated/sdk.gen'
import type { AlertRuleCreate, AlertRuleUpdate } from '@/api/generated/types.gen'

export function useAlertRules(params?: { skip?: number; limit?: number }) {
  return useQuery({
    queryKey: alertKeys.ruleList(params),
    queryFn: async () => {
      const { data, error } = await listRulesEndpointApiV1AlertsRulesGet({ query: params })
      if (error) throw error
      return data
    },
  })
}

export function useAlertRule(uuid: string) {
  return useQuery({
    queryKey: alertKeys.ruleDetail(uuid),
    queryFn: async () => {
      const { data, error } = await getRuleEndpointApiV1AlertsRulesRuleUuidGet({ path: { rule_uuid: uuid } })
      if (error) throw error
      return data
    },
    enabled: !!uuid,
  })
}

export function useCreateAlertRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: AlertRuleCreate) => {
      const { data, error } = await createRuleEndpointApiV1AlertsRulesPost({ body })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all })
    },
  })
}

export function useUpdateAlertRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ uuid, data: body }: { uuid: string; data: AlertRuleUpdate }) => {
      const { data, error } = await updateRuleEndpointApiV1AlertsRulesRuleUuidPatch({
        path: { rule_uuid: uuid },
        body,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all })
    },
  })
}

export function useDisableAlertRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (uuid: string) => {
      const { data, error } = await deleteRuleEndpointApiV1AlertsRulesRuleUuidDelete({ path: { rule_uuid: uuid } })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all })
    },
  })
}
