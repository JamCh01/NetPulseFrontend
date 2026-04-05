import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { webhookKeys } from './keys'
import {
  listWebhooksEndpointApiV1WebhooksGet,
  getWebhookEndpointApiV1WebhooksWebhookUuidGet,
  createWebhookEndpointApiV1WebhooksPost,
  updateWebhookEndpointApiV1WebhooksWebhookUuidPatch,
  deleteWebhookEndpointApiV1WebhooksWebhookUuidDelete,
  testWebhookEndpointApiV1WebhooksWebhookUuidTestPost,
  rotateSecretEndpointApiV1WebhooksWebhookUuidRotateSecretPost,
  listDeliveriesEndpointApiV1WebhooksWebhookUuidDeliveriesGet,
  retryDeliveryEndpointApiV1WebhooksWebhookUuidDeliveriesDeliveryUuidRetryPost,
} from '@/api/generated/sdk.gen'
import type { WebhookCreate, WebhookUpdate } from '@/api/generated/types.gen'

export function useWebhooks(params?: { skip?: number; limit?: number }) {
  return useQuery({
    queryKey: webhookKeys.list(params),
    queryFn: async () => {
      const { data, error } = await listWebhooksEndpointApiV1WebhooksGet({ query: params })
      if (error) throw error
      return data
    },
  })
}

export function useWebhook(uuid: string) {
  return useQuery({
    queryKey: webhookKeys.detail(uuid),
    queryFn: async () => {
      const { data, error } = await getWebhookEndpointApiV1WebhooksWebhookUuidGet({ path: { webhook_uuid: uuid } })
      if (error) throw error
      return data
    },
    enabled: !!uuid,
  })
}

export function useCreateWebhook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: WebhookCreate) => {
      const { data, error } = await createWebhookEndpointApiV1WebhooksPost({ body })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.all })
    },
  })
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ uuid, data: body }: { uuid: string; data: WebhookUpdate }) => {
      const { data, error } = await updateWebhookEndpointApiV1WebhooksWebhookUuidPatch({ path: { webhook_uuid: uuid }, body })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.all })
    },
  })
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (uuid: string) => {
      const { data, error } = await deleteWebhookEndpointApiV1WebhooksWebhookUuidDelete({ path: { webhook_uuid: uuid } })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.all })
    },
  })
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: async (uuid: string) => {
      const { data, error } = await testWebhookEndpointApiV1WebhooksWebhookUuidTestPost({ path: { webhook_uuid: uuid } })
      if (error) throw error
      return data
    },
  })
}

export function useRotateSecret() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (uuid: string) => {
      const { data, error } = await rotateSecretEndpointApiV1WebhooksWebhookUuidRotateSecretPost({ path: { webhook_uuid: uuid } })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.all })
    },
  })
}

export function useWebhookDeliveries(webhookUuid: string, params?: { skip?: number; limit?: number }) {
  return useQuery({
    queryKey: [...webhookKeys.detail(webhookUuid), 'deliveries', params] as const,
    queryFn: async () => {
      const { data, error } = await listDeliveriesEndpointApiV1WebhooksWebhookUuidDeliveriesGet({ path: { webhook_uuid: webhookUuid }, query: params })
      if (error) throw error
      return data
    },
    enabled: !!webhookUuid,
  })
}

export function useRetryDelivery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ webhookUuid, deliveryUuid }: { webhookUuid: string; deliveryUuid: string }) => {
      const { data, error } = await retryDeliveryEndpointApiV1WebhooksWebhookUuidDeliveriesDeliveryUuidRetryPost({
        path: { webhook_uuid: webhookUuid, delivery_uuid: deliveryUuid },
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...webhookKeys.detail(variables.webhookUuid), 'deliveries'] })
    },
  })
}
