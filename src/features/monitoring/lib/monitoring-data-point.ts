export type MonitoringGranularity = 'raw' | 'hourly' | 'daily'

export interface MonitoringDataPoint {
  timestamp: number
  avg_rtt: number
  max_rtt: number
  min_rtt: number
  median_rtt: number
  p95_rtt: number
  p99_rtt: number
  packet_loss_pct: number
}
