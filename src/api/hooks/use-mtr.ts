import { useQuery } from '@tanstack/react-query'
import { monitoringKeys } from './keys'
import {
  mtrListResultsApiV1MonitoringMtrGet,
  mtrGetResultApiV1MonitoringMtrResultUuidGet,
} from '@/api/generated/sdk.gen'
import type {
  MtrResultListResponse,
  MtrResultDetail,
} from '@/api/generated/types.gen'

interface TimeRange {
  start: number
  end: number
}

export function useMtrList(
  taskUuid: string,
  agentUuid: string | undefined,
  timeRange: TimeRange
) {
  // Convert ms timestamps to seconds for the API
  const startSec = Math.floor(timeRange.start / 1000)
  const endSec = Math.floor(timeRange.end / 1000)

  return useQuery({
    queryKey: monitoringKeys.mtrList({
      task_uuid: taskUuid,
      agent_uuid: agentUuid ?? null,
      start: startSec,
      end: endSec,
    }),
    queryFn: async (): Promise<MtrResultListResponse> => {
      const { data, error } = await mtrListResultsApiV1MonitoringMtrGet({
        query: {
          task_uuid: taskUuid,
          agent_uuid: agentUuid ?? null,
          start: startSec,
          end: endSec,
        },
      })
      if (error) {
        throw error
      }
      if (!data) {
        throw new Error('No data returned')
      }
      return data
    },
    enabled: !!taskUuid,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}

export function useMtrDetail(resultUuid: string) {
  return useQuery({
    queryKey: monitoringKeys.mtrDetail(resultUuid),
    queryFn: async (): Promise<MtrResultDetail> => {
      const { data, error } = await mtrGetResultApiV1MonitoringMtrResultUuidGet({
        path: {
          result_uuid: resultUuid,
        },
      })
      if (error) {
        throw error
      }
      if (!data) {
        throw new Error('No data returned')
      }
      return data
    },
    enabled: !!resultUuid,
    staleTime: 5 * 60 * 1000,
  })
}
