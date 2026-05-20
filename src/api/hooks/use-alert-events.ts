import { useQuery } from '@tanstack/react-query'
import { alertEventKeys } from './keys'
import {
  listEventsEndpointApiV1AlertsEventsGet,
  getEventEndpointApiV1AlertsEventsEventUuidGet,
} from '@/api/generated/sdk.gen'
import { reportMissingApi } from '@/lib/api-compat'

interface AlertEventParams {
  skip?: number
  limit?: number
  rule_uuid?: string | null
  task_uuid?: string | null
  status?: string | null
}

function isNotFoundError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'status' in error &&
    (error as { status?: unknown }).status === 404,
  )
}

export function useAlertEvents(params?: AlertEventParams) {
  return useQuery({
    queryKey: alertEventKeys.list(params),
    queryFn: async () => {
      const { data, error } = await listEventsEndpointApiV1AlertsEventsGet({ query: params })
      if (error) {
        if (isNotFoundError(error)) {
          reportMissingApi('/api/v1/alerts/events/')
          return { items: [], total: 0, skip: params?.skip ?? 0, limit: params?.limit ?? 50, __unsupported: true }
        }
        throw error
      }
      return data
    },
    retry: (failureCount, error) => {
      if (isNotFoundError(error)) return false
      return failureCount < 2
    },
  })
}

export function useAlertEvent(uuid: string) {
  return useQuery({
    queryKey: alertEventKeys.detail(uuid),
    queryFn: async () => {
      const { data, error } = await getEventEndpointApiV1AlertsEventsEventUuidGet({ path: { event_uuid: uuid } })
      if (error) {
        if (isNotFoundError(error)) return undefined
        throw error
      }
      return data
    },
    enabled: !!uuid,
    retry: (failureCount, error) => {
      if (isNotFoundError(error)) return false
      return failureCount < 2
    },
  })
}
