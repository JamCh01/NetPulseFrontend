import { useQuery, useQueries } from '@tanstack/react-query'
import { monitoringKeys } from './keys'
import { buildApiUrl } from '@/api/base-url'
import type { GranularityEnum, MonitoringDataPoint } from '@/api/generated/types.gen'

interface TimeRange {
  start: number
  end: number
}

interface GranularityConfig {
  granularity: GranularityEnum
  staleTime: number
  refetchInterval: number | false
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
      refetchInterval: 60 * 1000,
      stepSec: 60,
    }
  }

  if (spanDays <= 30) {
    return {
      granularity: 'hourly',
      staleTime: 5 * 60 * 1000,
      refetchInterval: false,
      stepSec: 3600,
    }
  }

  return {
    granularity: 'daily',
    staleTime: 30 * 60 * 1000,
    refetchInterval: false,
    stepSec: 86400,
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

function seriesToMonitoringPoints(series: NonNullable<MetricsEnvelope['data']>['series'] | undefined): MonitoringDataPoint[] {
  const byTs = new Map<number, Partial<MonitoringDataPoint>>()

  const upsert = (ts: number): Partial<MonitoringDataPoint> => {
    const existing = byTs.get(ts)
    if (existing) return existing
    const next: Partial<MonitoringDataPoint> = { timestamp: ts }
    byTs.set(ts, next)
    return next
  }

  for (const s of series ?? []) {
    for (const p of s.points ?? []) {
      const ts = Math.floor(new Date(p.timestamp).getTime() / 1000)
      const row = upsert(ts)
      switch (s.metric) {
        case 'latency_avg_ms':
          row.avg_rtt = p.value
          row.median_rtt = p.value
          row.p95_rtt = p.value
          row.p99_rtt = p.value
          break
        case 'latency_min_ms':
          row.min_rtt = p.value
          break
        case 'latency_max_ms':
          row.max_rtt = p.value
          break
        case 'packet_loss_pct':
          row.packet_loss_pct = p.value
          break
        case 'connect_latency_avg_ms':
          row.avg_rtt = p.value
          row.median_rtt = p.value
          row.p95_rtt = p.value
          row.p99_rtt = p.value
          break
        case 'connect_latency_min_ms':
          row.min_rtt = p.value
          break
        case 'connect_latency_max_ms':
          row.max_rtt = p.value
          break
        case 'connect_failure_pct':
          row.packet_loss_pct = p.value
          break
        case 'final_hop_avg_ms':
          row.avg_rtt = p.value
          row.median_rtt = p.value
          row.p95_rtt = p.value
          row.p99_rtt = p.value
          break
        case 'final_hop_best_ms':
          row.min_rtt = p.value
          break
        case 'final_hop_worst_ms':
          row.max_rtt = p.value
          break
        case 'final_hop_loss_pct':
          row.packet_loss_pct = p.value
          break
        default:
          break
      }
    }
  }

  return Array.from(byTs.values())
    .map((row) => ({
      timestamp: row.timestamp ?? 0,
      median_rtt: row.median_rtt ?? row.avg_rtt ?? 0,
      avg_rtt: row.avg_rtt ?? row.median_rtt ?? 0,
      min_rtt: row.min_rtt ?? row.avg_rtt ?? 0,
      max_rtt: row.max_rtt ?? row.avg_rtt ?? 0,
      p95_rtt: row.p95_rtt ?? row.avg_rtt ?? 0,
      p99_rtt: row.p99_rtt ?? row.avg_rtt ?? 0,
      packet_loss_pct: row.packet_loss_pct ?? 0,
    }))
    .sort((a, b) => a.timestamp - b.timestamp)
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

  return useQuery({
    queryKey: monitoringKeys.query({
      task_uuid: taskUuid,
      agent_uuid: agentUuid,
      start: startSec,
      end: endSec,
      granularity: config.granularity,
    }),
    queryFn: async () => {
      const startIso = new Date(startSec * 1000).toISOString()
      const endIso = new Date(endSec * 1000).toISOString()
      const params = new URLSearchParams({
        start: startIso,
        end: endIso,
        step_sec: String(config.stepSec),
      })
      const res = await fetch(buildApiUrl(`/api/v1/monitoring/tasks/${taskUuid}/metrics?${params.toString()}`))
      if (!res.ok) {
        throw new Error(`Failed to load monitoring metrics: ${res.status}`)
      }
      const body = (await res.json()) as MetricsEnvelope
      return { data: seriesToMonitoringPoints(body.data?.series) }
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
  agents: Array<{ agent_uuid: string; agent_name: string }>,
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
        const startIso = new Date(startSec * 1000).toISOString()
        const endIso = new Date(endSec * 1000).toISOString()
        const params = new URLSearchParams({
          start: startIso,
          end: endIso,
          step_sec: String(config.stepSec),
        })
        const res = await fetch(buildApiUrl(`/api/v1/monitoring/tasks/${taskUuid}/metrics?${params.toString()}`))
        if (!res.ok) throw new Error(`Failed to load monitoring metrics: ${res.status}`)
        const body = (await res.json()) as MetricsEnvelope
        return { agentUuid: agent.agent_uuid, agentName: agent.agent_name, data: seriesToMonitoringPoints(body.data?.series) }
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
