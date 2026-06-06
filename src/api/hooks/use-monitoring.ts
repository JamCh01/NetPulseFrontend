import { keepPreviousData, useQuery, useQueries } from '@tanstack/react-query'
import { monitoringKeys } from './keys'
import { buildApiUrl } from '@/api/base-url'
import type { MonitoringTask } from '@/features/monitoring/lib/monitoring-models'
import type { MonitoringDataPoint, MonitoringGranularity, MonitoringMetricProtocol } from '@/features/monitoring/lib/monitoring-data-point'
import { buildMetricsParam, normalizeMetricSeries } from '@/features/monitoring/lib/protocol-metrics'

interface TimeRange {
  start: number
  end: number
  stepSec?: number
}

interface GranularityConfig {
  granularity: MonitoringGranularity
  staleTime: number
  stepSec: number
}

function getGranularityConfig(timeRange: TimeRange): GranularityConfig {
  const spanMs = timeRange.end - timeRange.start
  const spanHours = spanMs / (1000 * 60 * 60)
  const spanDays = spanHours / 24

  if (spanHours <= 24) {
    return {
      granularity: 'raw',
      staleTime: 30 * 1000,
      stepSec: timeRange.stepSec ?? 60,
    }
  }

  if (spanDays <= 30) {
    return {
      granularity: 'hourly',
      staleTime: 5 * 60 * 1000,
      stepSec: timeRange.stepSec ?? 3600,
    }
  }

  return {
    granularity: 'daily',
    staleTime: 30 * 60 * 1000,
    stepSec: timeRange.stepSec ?? 86400,
  }
}

type MetricsEnvelope = {
  data?: {
    series?: Array<{
      metric: string
      points: Array<{
        timestamp: string
        value: number
      }>
    }>
  }
}

interface AgentMonitoringSeries {
  agentUuid: string
  agentName: string
  ipFamily?: string | null
  data: MonitoringDataPoint[]
}

interface MonitoringSeriesResult {
  agentSeries: AgentMonitoringSeries[]
  isLoading: boolean
  isFetching: boolean
  isUpdating: boolean
  error: Error | null
}

export function monitoringTaskAgentDisplayName(task: MonitoringTask): string {
  return task.agent?.name || task.name
}

export function useMonitoringData(
  taskUuid: string,
  agentUuid: string | undefined,
  timeRange: TimeRange,
  protocol?: MonitoringMetricProtocol,
) {
  const config = getGranularityConfig(timeRange)
  const metrics = buildMetricsParam(protocol)

  // Convert ms timestamps to seconds for the API
  const startSec = Math.floor(timeRange.start / 1000)
  const endSec = Math.floor(timeRange.end / 1000)

  return useQuery({
    queryKey: monitoringKeys.query({
      task_uuid: taskUuid,
      agent_uuid: agentUuid,
      start: startSec,
      end: endSec,
      granularity: config.granularity,
      step_sec: config.stepSec,
      metrics,
    }),
    queryFn: async () => {
      const startIso = new Date(startSec * 1000).toISOString()
      const endIso = new Date(endSec * 1000).toISOString()
      const params = new URLSearchParams({
        start: startIso,
        end: endIso,
        step_sec: String(config.stepSec),
      })
      if (metrics) params.set('metrics', metrics)
      if (agentUuid) params.set('agent_uuid', agentUuid)
      const res = await fetch(buildApiUrl(`/api/v1/monitoring/tasks/${taskUuid}/metrics?${params.toString()}`))
      if (!res.ok) {
        throw new Error(`Failed to load monitoring metrics: ${res.status}`)
      }
      const body = (await res.json()) as MetricsEnvelope
      return { data: normalizeMetricSeries(protocol, body.data?.series) }
    },
    enabled: !!taskUuid,
    placeholderData: keepPreviousData,
    staleTime: config.staleTime,
  })
}

/**
 * Fetch monitoring data for multiple agents in parallel.
 * Returns an array of { agentUuid, agentName, data } for each agent.
 */
export function useMultiAgentMonitoringData(
  taskUuid: string,
  agents: Array<{ agent_uuid: string; agent_name: string }>,
  timeRange: TimeRange,
  protocol?: MonitoringMetricProtocol,
) {
  const config = getGranularityConfig(timeRange)
  const metrics = buildMetricsParam(protocol)
  const startSec = Math.floor(timeRange.start / 1000)
  const endSec = Math.floor(timeRange.end / 1000)

  return useQueries({
    queries: agents.map((agent) => ({
      queryKey: monitoringKeys.query({
        task_uuid: taskUuid,
        agent_uuid: agent.agent_uuid,
        start: startSec,
        end: endSec,
        granularity: config.granularity,
        step_sec: config.stepSec,
        metrics,
      }),
      queryFn: async () => {
        const startIso = new Date(startSec * 1000).toISOString()
        const endIso = new Date(endSec * 1000).toISOString()
        const params = new URLSearchParams({
          start: startIso,
          end: endIso,
          step_sec: String(config.stepSec),
        })
        if (metrics) params.set('metrics', metrics)
        params.set('agent_uuid', agent.agent_uuid)
        const res = await fetch(buildApiUrl(`/api/v1/monitoring/tasks/${taskUuid}/metrics?${params.toString()}`))
        if (!res.ok) throw new Error(`Failed to load monitoring metrics: ${res.status}`)
        const body = (await res.json()) as MetricsEnvelope
        return { agentUuid: agent.agent_uuid, agentName: agent.agent_name, data: normalizeMetricSeries(protocol, body.data?.series) }
      },
      enabled: !!taskUuid && agents.length > 0,
      placeholderData: keepPreviousData,
      staleTime: config.staleTime,
    })),
    combine: (results): MonitoringSeriesResult => ({
      isLoading: results.some((result) => result.isLoading),
      isFetching: results.some((result) => result.isFetching),
      isUpdating: results.some((result) => result.isFetching && !result.isLoading),
      error: results.find((result) => result.error)?.error as Error | null,
      agentSeries: results
        .filter((result) => result.data)
        .map((result) => result.data!),
    }),
  })
}

export function useTaskMonitoringSeries(tasks: MonitoringTask[], timeRange: TimeRange) {
  const config = getGranularityConfig(timeRange)
  const startSec = Math.floor(timeRange.start / 1000)
  const endSec = Math.floor(timeRange.end / 1000)

  return useQueries({
    queries: tasks.map((task) => {
      const metrics = buildMetricsParam(task.task_type)
      return {
        queryKey: monitoringKeys.query({
          task_uuid: task.task_uuid,
          agent_uuid: task.agent?.agent_uuid,
          start: startSec,
          end: endSec,
          granularity: config.granularity,
          step_sec: config.stepSec,
          metrics,
        }),
        queryFn: async () => {
          const startIso = new Date(startSec * 1000).toISOString()
          const endIso = new Date(endSec * 1000).toISOString()
          const params = new URLSearchParams({
            start: startIso,
            end: endIso,
            step_sec: String(config.stepSec),
          })
          if (metrics) params.set('metrics', metrics)
          if (task.agent?.agent_uuid) params.set('agent_uuid', task.agent.agent_uuid)
          const res = await fetch(buildApiUrl(`/api/v1/monitoring/tasks/${task.task_uuid}/metrics?${params.toString()}`))
          if (!res.ok) throw new Error(`Failed to load monitoring metrics: ${res.status}`)
          const body = (await res.json()) as MetricsEnvelope
          return {
            agentUuid: task.agent?.agent_uuid ?? task.task_uuid,
            agentName: monitoringTaskAgentDisplayName(task),
            ipFamily: task.ip_family,
            data: normalizeMetricSeries(task.task_type, body.data?.series),
          }
        },
        enabled: !!task.task_uuid,
        placeholderData: keepPreviousData,
        staleTime: config.staleTime,
      }
    }),
    combine: (results): MonitoringSeriesResult => ({
      isLoading: results.some((result) => result.isLoading),
      isFetching: results.some((result) => result.isFetching),
      isUpdating: results.some((result) => result.isFetching && !result.isLoading),
      error: results.find((result) => result.error)?.error as Error | null,
      agentSeries: results
        .filter((result) => result.data)
        .map((result) => result.data!),
    }),
  })
}
