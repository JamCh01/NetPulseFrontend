import { useQuery, useQueries } from '@tanstack/react-query'
import { monitoringKeys } from './keys'
import { monitoringQueryApiV1MonitoringQueryGet } from '@/api/generated/sdk.gen'
import type { GranularityEnum, AgentResponse } from '@/api/generated/types.gen'

interface TimeRange {
  start: number
  end: number
}

interface GranularityConfig {
  granularity: GranularityEnum
  staleTime: number
  refetchInterval: number | false
}

function getGranularityConfig(timeRange: TimeRange): GranularityConfig {
  const spanMs = timeRange.end - timeRange.start
  const spanHours = spanMs / (1000 * 60 * 60)
  const spanDays = spanHours / 24

  if (spanHours <= 24) {
    return {
      granularity: 'raw',
      staleTime: 30 * 1000,
      refetchInterval: 60 * 1000,
    }
  }

  if (spanDays <= 30) {
    return {
      granularity: 'hourly',
      staleTime: 5 * 60 * 1000,
      refetchInterval: false,
    }
  }

  return {
    granularity: 'daily',
    staleTime: 30 * 60 * 1000,
    refetchInterval: false,
  }
}

export function useMonitoringData(
  taskUuid: string,
  agentUuid: string | undefined,
  timeRange: TimeRange
) {
  const config = getGranularityConfig(timeRange)

  // Convert ms timestamps to seconds for the API
  const startSec = Math.floor(timeRange.start / 1000)
  const endSec = Math.floor(timeRange.end / 1000)

  console.debug('[useMonitoringData]', {
    taskUuid,
    agentUuid,
    spanHours: (timeRange.end - timeRange.start) / (1000 * 60 * 60),
    granularity: config.granularity,
    refetchInterval: config.refetchInterval,
  })

  return useQuery({
    queryKey: monitoringKeys.query({
      task_uuid: taskUuid,
      agent_uuid: agentUuid,
      start: startSec,
      end: endSec,
      granularity: config.granularity,
    }),
    queryFn: async () => {
      console.debug('[useMonitoringData] Fetching from API...')
      const { data, error } = await monitoringQueryApiV1MonitoringQueryGet({
        query: {
          task_uuid: taskUuid,
          agent_uuid: agentUuid ?? undefined,
          start: startSec,
          end: endSec,
          granularity: config.granularity,
        },
      })
      if (error) {
        console.error('[useMonitoringData] API error:', error)
        throw error
      }
      console.debug('[useMonitoringData] API response:', {
        dataPoints: data?.data?.length,
      })
      return data
    },
    enabled: !!taskUuid,
    staleTime: config.staleTime,
    refetchInterval: config.refetchInterval,
  })
}

/**
 * Fetch monitoring data for multiple agents in parallel.
 * Returns an array of { agentUuid, agentName, data } for each agent.
 */
export function useMultiAgentMonitoringData(
  taskUuid: string,
  agents: AgentResponse[],
  timeRange: TimeRange,
) {
  const config = getGranularityConfig(timeRange)
  const startSec = Math.floor(timeRange.start / 1000)
  const endSec = Math.floor(timeRange.end / 1000)

  const results = useQueries({
    queries: agents.map((agent) => ({
      queryKey: monitoringKeys.query({
        task_uuid: taskUuid,
        agent_uuid: agent.agent_uuid,
        start: startSec,
        end: endSec,
        granularity: config.granularity,
      }),
      queryFn: async () => {
        const { data, error } = await monitoringQueryApiV1MonitoringQueryGet({
          query: {
            task_uuid: taskUuid,
            agent_uuid: agent.agent_uuid,
            start: startSec,
            end: endSec,
            granularity: config.granularity,
          },
        })
        if (error) throw error
        return { agentUuid: agent.agent_uuid, agentName: agent.agent_name, data: data?.data ?? [] }
      },
      enabled: !!taskUuid && agents.length > 0,
      staleTime: config.staleTime,
      refetchInterval: config.refetchInterval,
    })),
  })

  const isLoading = results.some((r) => r.isLoading)
  const error = results.find((r) => r.error)?.error as Error | null
  const agentSeries = results
    .filter((r) => r.data)
    .map((r) => r.data!)

  return { agentSeries, isLoading, error }
}
