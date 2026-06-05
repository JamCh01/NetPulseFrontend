import type { AgentSeriesData } from './build-multi-agent-option'
import type { MonitoringDataPoint, MonitoringMetricProtocol } from './monitoring-data-point'

export interface MetricSeriesPoint {
  timestamp: string
  value: number
}

export interface MetricSeries {
  metric: string
  points: MetricSeriesPoint[]
}

export type MetricValueKind = 'ms' | 'percent' | 'count'
export type MetricLabelKey =
  | 'monitoring.metrics.latency_avg_ms'
  | 'monitoring.metrics.latency_min_ms'
  | 'monitoring.metrics.latency_max_ms'
  | 'monitoring.metrics.latency_stddev_ms'
  | 'monitoring.metrics.latency_jitter_ms'
  | 'monitoring.metrics.packet_loss_pct'
  | 'monitoring.metrics.packets_sent'
  | 'monitoring.metrics.packets_received'
  | 'monitoring.metrics.connect_latency_avg_ms'
  | 'monitoring.metrics.connect_latency_min_ms'
  | 'monitoring.metrics.connect_latency_max_ms'
  | 'monitoring.metrics.connect_latency_stddev_ms'
  | 'monitoring.metrics.connect_jitter_ms'
  | 'monitoring.metrics.connect_failure_pct'
  | 'monitoring.metrics.connect_attempts'
  | 'monitoring.metrics.connect_successes'
  | 'monitoring.metrics.connect_failures'

export interface MetricColumn {
  key: keyof MonitoringDataPoint
  label: string
  labelKey: MetricLabelKey
  shortLabel: string
  kind: MetricValueKind
}

export interface AgentMetricRow {
  agentUuid: string
  agentName: string
  timestamp: number
  point: MonitoringDataPoint
}

export const ICMP_METRICS = [
  'latency_avg_ms',
  'latency_min_ms',
  'latency_max_ms',
  'latency_stddev_ms',
  'latency_jitter_ms',
  'packet_loss_pct',
  'packets_sent',
  'packets_received',
] as const

export const TCP_METRICS = [
  'connect_latency_avg_ms',
  'connect_latency_min_ms',
  'connect_latency_max_ms',
  'connect_latency_stddev_ms',
  'connect_jitter_ms',
  'connect_failure_pct',
  'connect_attempts',
  'connect_successes',
  'connect_failures',
] as const

const ICMP_COLUMNS: MetricColumn[] = [
  { key: 'latency_avg_ms', label: 'latency_avg_ms', labelKey: 'monitoring.metrics.latency_avg_ms', shortLabel: 'Avg', kind: 'ms' },
  { key: 'latency_min_ms', label: 'latency_min_ms', labelKey: 'monitoring.metrics.latency_min_ms', shortLabel: 'Min', kind: 'ms' },
  { key: 'latency_max_ms', label: 'latency_max_ms', labelKey: 'monitoring.metrics.latency_max_ms', shortLabel: 'Max', kind: 'ms' },
  { key: 'latency_stddev_ms', label: 'latency_stddev_ms', labelKey: 'monitoring.metrics.latency_stddev_ms', shortLabel: 'Stddev', kind: 'ms' },
  { key: 'latency_jitter_ms', label: 'latency_jitter_ms', labelKey: 'monitoring.metrics.latency_jitter_ms', shortLabel: 'Jitter', kind: 'ms' },
  { key: 'packet_loss_pct', label: 'packet_loss_pct', labelKey: 'monitoring.metrics.packet_loss_pct', shortLabel: 'Loss', kind: 'percent' },
  { key: 'packets_sent', label: 'packets_sent', labelKey: 'monitoring.metrics.packets_sent', shortLabel: 'Sent', kind: 'count' },
  { key: 'packets_received', label: 'packets_received', labelKey: 'monitoring.metrics.packets_received', shortLabel: 'Recv', kind: 'count' },
]

const TCP_COLUMNS: MetricColumn[] = [
  { key: 'connect_latency_avg_ms', label: 'connect_latency_avg_ms', labelKey: 'monitoring.metrics.connect_latency_avg_ms', shortLabel: 'Avg', kind: 'ms' },
  { key: 'connect_latency_min_ms', label: 'connect_latency_min_ms', labelKey: 'monitoring.metrics.connect_latency_min_ms', shortLabel: 'Min', kind: 'ms' },
  { key: 'connect_latency_max_ms', label: 'connect_latency_max_ms', labelKey: 'monitoring.metrics.connect_latency_max_ms', shortLabel: 'Max', kind: 'ms' },
  { key: 'connect_latency_stddev_ms', label: 'connect_latency_stddev_ms', labelKey: 'monitoring.metrics.connect_latency_stddev_ms', shortLabel: 'Stddev', kind: 'ms' },
  { key: 'connect_jitter_ms', label: 'connect_jitter_ms', labelKey: 'monitoring.metrics.connect_jitter_ms', shortLabel: 'Jitter', kind: 'ms' },
  { key: 'connect_failure_pct', label: 'connect_failure_pct', labelKey: 'monitoring.metrics.connect_failure_pct', shortLabel: 'Failure', kind: 'percent' },
  { key: 'connect_attempts', label: 'connect_attempts', labelKey: 'monitoring.metrics.connect_attempts', shortLabel: 'Attempts', kind: 'count' },
  { key: 'connect_successes', label: 'connect_successes', labelKey: 'monitoring.metrics.connect_successes', shortLabel: 'OK', kind: 'count' },
  { key: 'connect_failures', label: 'connect_failures', labelKey: 'monitoring.metrics.connect_failures', shortLabel: 'Fail', kind: 'count' },
]

export function normalizeProtocol(protocol?: MonitoringMetricProtocol): 'icmp' | 'tcp' | string {
  return String(protocol ?? 'icmp').toLowerCase()
}

export function getMetricNames(protocol?: MonitoringMetricProtocol): string[] {
  const normalized = normalizeProtocol(protocol)
  if (normalized === 'tcp') return [...TCP_METRICS]
  if (normalized === 'icmp') return [...ICMP_METRICS]
  return []
}

export function buildMetricsParam(protocol?: MonitoringMetricProtocol): string {
  return getMetricNames(protocol).join(',')
}

export function getMetricColumns(protocol?: MonitoringMetricProtocol): MetricColumn[] {
  const normalized = normalizeProtocol(protocol)
  if (normalized === 'tcp') return TCP_COLUMNS
  return ICMP_COLUMNS
}

export function formatMetricValue(value: unknown, kind: MetricValueKind): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-'
  if (kind === 'count') return Number.isInteger(value) ? String(value) : value.toFixed(0)
  if (kind === 'percent') return `${value.toFixed(1)}%`
  return `${value.toFixed(1)}ms`
}

export function normalizeMetricSeries(
  protocol: MonitoringMetricProtocol | undefined,
  series: MetricSeries[] | undefined,
): MonitoringDataPoint[] {
  const normalized = normalizeProtocol(protocol)
  const byTs = new Map<number, Partial<MonitoringDataPoint>>()

  const upsert = (ts: number): Partial<MonitoringDataPoint> => {
    const existing = byTs.get(ts)
    if (existing) return existing
    const next: Partial<MonitoringDataPoint> = { timestamp: ts, protocol: normalized }
    byTs.set(ts, next)
    return next
  }

  for (const s of series ?? []) {
    for (const p of s.points ?? []) {
      const ts = Math.floor(new Date(p.timestamp).getTime() / 1000)
      if (!Number.isFinite(ts)) continue
      const row = upsert(ts)
      assignMetric(row, s.metric, p.value)
    }
  }

  return Array.from(byTs.values())
    .map((row) => finalizePoint(row, normalized))
    .sort((a, b) => a.timestamp - b.timestamp)
}

export function flattenAgentMetricRows(
  agentSeries: AgentSeriesData[],
  protocol?: MonitoringMetricProtocol,
): AgentMetricRow[] {
  const normalized = normalizeProtocol(protocol)
  return agentSeries
    .flatMap((series) => series.data.map((point) => ({
      agentUuid: series.agentUuid,
      agentName: series.agentName,
      timestamp: point.timestamp,
      point: { ...point, protocol: point.protocol ?? normalized },
    })))
    .sort((a, b) => {
      if (a.timestamp !== b.timestamp) return b.timestamp - a.timestamp
      return a.agentName.localeCompare(b.agentName)
    })
}

function assignMetric(row: Partial<MonitoringDataPoint>, metric: string, value: number) {
  switch (metric) {
    case 'latency_avg_ms':
      row.latency_avg_ms = value
      row.avg_rtt = value
      row.median_rtt = value
      row.p95_rtt = value
      row.p99_rtt = value
      break
    case 'latency_min_ms':
      row.latency_min_ms = value
      row.min_rtt = value
      break
    case 'latency_max_ms':
      row.latency_max_ms = value
      row.max_rtt = value
      break
    case 'latency_stddev_ms':
      row.latency_stddev_ms = value
      break
    case 'latency_jitter_ms':
    case 'jitter_ms':
    case 'jitter_avg_ms':
      row.latency_jitter_ms = value
      break
    case 'packet_loss_pct':
      row.packet_loss_pct = value
      break
    case 'packets_sent':
      row.packets_sent = value
      break
    case 'packets_received':
      row.packets_received = value
      break
    case 'connect_latency_avg_ms':
      row.connect_latency_avg_ms = value
      row.avg_rtt = value
      row.median_rtt = value
      row.p95_rtt = value
      row.p99_rtt = value
      break
    case 'connect_latency_min_ms':
      row.connect_latency_min_ms = value
      row.min_rtt = value
      break
    case 'connect_latency_max_ms':
      row.connect_latency_max_ms = value
      row.max_rtt = value
      break
    case 'connect_latency_stddev_ms':
      row.connect_latency_stddev_ms = value
      break
    case 'connect_jitter_ms':
      row.connect_jitter_ms = value
      break
    case 'connect_failure_pct':
      row.connect_failure_pct = value
      row.packet_loss_pct = value
      break
    case 'connect_attempts':
      row.connect_attempts = value
      break
    case 'connect_successes':
      row.connect_successes = value
      break
    case 'connect_failures':
      row.connect_failures = value
      break
    default:
      break
  }
}

function finalizePoint(row: Partial<MonitoringDataPoint>, protocol: string): MonitoringDataPoint {
  const avg = row.avg_rtt ?? row.latency_avg_ms ?? row.connect_latency_avg_ms ?? 0
  const min = row.min_rtt ?? row.latency_min_ms ?? row.connect_latency_min_ms ?? avg
  const max = row.max_rtt ?? row.latency_max_ms ?? row.connect_latency_max_ms ?? avg
  const loss = protocol === 'tcp'
    ? row.connect_failure_pct ?? row.packet_loss_pct ?? 0
    : row.packet_loss_pct ?? 0

  return {
    ...row,
    timestamp: row.timestamp ?? 0,
    protocol: row.protocol ?? protocol,
    median_rtt: row.median_rtt ?? avg,
    avg_rtt: avg,
    min_rtt: min,
    max_rtt: max,
    p95_rtt: row.p95_rtt ?? avg,
    p99_rtt: row.p99_rtt ?? avg,
    packet_loss_pct: loss,
  }
}
