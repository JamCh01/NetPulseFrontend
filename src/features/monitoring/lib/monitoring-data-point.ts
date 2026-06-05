export type MonitoringGranularity = 'raw' | 'hourly' | 'daily'

export type MonitoringMetricProtocol = 'icmp' | 'tcp' | string

export interface MonitoringDataPoint {
  timestamp: number
  protocol?: MonitoringMetricProtocol
  avg_rtt: number
  max_rtt: number
  min_rtt: number
  median_rtt: number
  p95_rtt: number
  p99_rtt: number
  packet_loss_pct: number
  latency_avg_ms?: number
  latency_min_ms?: number
  latency_max_ms?: number
  latency_stddev_ms?: number
  latency_jitter_ms?: number
  packets_sent?: number
  packets_received?: number
  connect_latency_avg_ms?: number
  connect_latency_min_ms?: number
  connect_latency_max_ms?: number
  connect_latency_stddev_ms?: number
  connect_jitter_ms?: number
  connect_failure_pct?: number
  connect_attempts?: number
  connect_successes?: number
  connect_failures?: number
}
