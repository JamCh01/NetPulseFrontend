import { useQuery } from '@tanstack/react-query'
import { alertEventKeys } from './keys'
import {
  listEventsEndpointApiV1AlertsEventsGet,
  getEventEndpointApiV1AlertsEventsEventUuidGet,
} from '@/api/generated/sdk.gen'

interface AlertEventParams {
  skip?: number
  limit?: number
  rule_uuid?: string | null
  task_uuid?: string | null
  status?: string | null
}

export function useAlertEvents(params?: AlertEventParams) {
  return useQuery({
    queryKey: alertEventKeys.list(params),
    queryFn: async () => {
      const { data, error } = await listEventsEndpointApiV1AlertsEventsGet({ query: params })
      if (error) throw error
      return data
    },
  })
}

export function useAlertEvent(uuid: string) {
  return useQuery({
    queryKey: alertEventKeys.detail(uuid),
    queryFn: async () => {
      const { data, error } = await getEventEndpointApiV1AlertsEventsEventUuidGet({ path: { event_uuid: uuid } })
      if (error) throw error
      return data
    },
    enabled: !!uuid,
  })
}
