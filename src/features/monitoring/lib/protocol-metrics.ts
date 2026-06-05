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

export function summarizeAgentMetricRows(
  agentSeries: AgentSeriesData[],
  protocol?: MonitoringMetricProtocol,
): AgentMetricRow[] {
  const normalized = normalizeProtocol(protocol)
  return agentSeries
    .map((series) => {
      if (series.data.length === 0) return null
      const point = normalized === 'tcp'
        ? summarizeTcpWindow(series.data, normalized)
        : summarizeIcmpWindow(series.data, normalized)

      return {
        agentUuid: series.agentUuid,
        agentName: series.agentName,
        timestamp: latestTimestamp(series.data),
        point,
      }
    })
    .filter((row): row is AgentMetricRow => row !== null)
    .sort((a, b) => a.agentName.localeCompare(b.agentName))
}

function summarizeIcmpWindow(points: MonitoringDataPoint[], protocol: string): MonitoringDataPoint {
  const packetsSent = sumMetric(points, 'packets_sent')
  const packetsReceived = sumMetric(points, 'packets_received')
  const lossPct = packetsSent > 0
    ? Math.max(0, ((packetsSent - packetsReceived) / packetsSent) * 100)
    : weightedAverage(points, 'packet_loss_pct', 'packets_sent')
  const avg = weightedAverage(points, 'latency_avg_ms', 'packets_received')
  const min = minMetric(points, 'latency_min_ms') ?? avg
  const max = maxMetric(points, 'latency_max_ms') ?? avg
  const stddev = weightedAverage(points, 'latency_stddev_ms', 'packets_received')
  const jitter = weightedAverage(points, 'latency_jitter_ms', 'packets_received')

  return finalizePoint({
    timestamp: latestTimestamp(points),
    protocol,
    avg_rtt: avg,
    min_rtt: min,
    max_rtt: max,
    latency_avg_ms: avg,
    latency_min_ms: min,
    latency_max_ms: max,
    latency_stddev_ms: stddev,
    latency_jitter_ms: jitter,
    packet_loss_pct: lossPct,
    packets_sent: packetsSent,
    packets_received: packetsReceived,
  }, protocol)
}

function summarizeTcpWindow(points: MonitoringDataPoint[], protocol: string): MonitoringDataPoint {
  const attempts = sumMetric(points, 'connect_attempts')
  const successes = sumMetric(points, 'connect_successes')
  const failures = sumMetric(points, 'connect_failures')
  const failurePct = attempts > 0
    ? Math.max(0, (failures / attempts) * 100)
    : weightedAverage(points, 'connect_failure_pct', 'connect_attempts')
  const avg = weightedAverage(points, 'connect_latency_avg_ms', 'connect_successes')
  const min = minMetric(points, 'connect_latency_min_ms') ?? avg
  const max = maxMetric(points, 'connect_latency_max_ms') ?? avg
  const stddev = weightedAverage(points, 'connect_latency_stddev_ms', 'connect_successes')
  const jitter = weightedAverage(points, 'connect_jitter_ms', 'connect_successes')

  return finalizePoint({
    timestamp: latestTimestamp(points),
    protocol,
    avg_rtt: avg,
    min_rtt: min,
    max_rtt: max,
    packet_loss_pct: failurePct,
    connect_latency_avg_ms: avg,
    connect_latency_min_ms: min,
    connect_latency_max_ms: max,
    connect_latency_stddev_ms: stddev,
    connect_jitter_ms: jitter,
    connect_failure_pct: failurePct,
    connect_attempts: attempts,
    connect_successes: successes,
    connect_failures: failures,
  }, protocol)
}

function latestTimestamp(points: MonitoringDataPoint[]): number {
  return points.reduce((latest, point) => Math.max(latest, point.timestamp), 0)
}

function finiteMetric(point: MonitoringDataPoint, key: keyof MonitoringDataPoint): number | null {
  const value = point[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function sumMetric(points: MonitoringDataPoint[], key: keyof MonitoringDataPoint): number {
  return points.reduce((total, point) => total + (finiteMetric(point, key) ?? 0), 0)
}

function minMetric(points: MonitoringDataPoint[], key: keyof MonitoringDataPoint): number | null {
  let min: number | null = null
  for (const point of points) {
    const value = finiteMetric(point, key)
    if (value === null) continue
    min = min === null ? value : Math.min(min, value)
  }
  return min
}

function maxMetric(points: MonitoringDataPoint[], key: keyof MonitoringDataPoint): number | null {
  let max: number | null = null
  for (const point of points) {
    const value = finiteMetric(point, key)
    if (value === null) continue
    max = max === null ? value : Math.max(max, value)
  }
  return max
}

function weightedAverage(
  points: MonitoringDataPoint[],
  valueKey: keyof MonitoringDataPoint,
  weightKey: keyof MonitoringDataPoint,
): number {
  let weightedTotal = 0
  let weightTotal = 0
  const fallbackValues: number[] = []

  for (const point of points) {
    const value = finiteMetric(point, valueKey)
    if (value === null) continue
    fallbackValues.push(value)
    const weight = finiteMetric(point, weightKey)
    if (weight === null || weight <= 0) continue
    weightedTotal += value * weight
    weightTotal += weight
  }

  if (weightTotal > 0) return weightedTotal / weightTotal
  if (fallbackValues.length === 0) return 0
  return fallbackValues.reduce((total, value) => total + value, 0) / fallbackValues.length
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
