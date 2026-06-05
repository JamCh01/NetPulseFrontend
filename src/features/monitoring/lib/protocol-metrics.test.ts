import { describe, expect, it } from 'vitest'
import {
  buildMetricsParam,
  flattenAgentMetricRows,
  getMetricColumns,
  normalizeMetricSeries,
} from './protocol-metrics'
import type { AgentSeriesData } from './build-multi-agent-option'

describe('protocol metrics', () => {
  it('requests and normalizes full ICMP window metrics', () => {
    expect(buildMetricsParam('icmp')).toBe([
      'latency_avg_ms',
      'latency_min_ms',
      'latency_max_ms',
      'latency_stddev_ms',
      'latency_jitter_ms',
      'packet_loss_pct',
      'packets_sent',
      'packets_received',
    ].join(','))

    const points = normalizeMetricSeries('icmp', [
      { metric: 'latency_avg_ms', points: [{ timestamp: '2026-06-05T00:00:00Z', value: 12.4 }] },
      { metric: 'latency_min_ms', points: [{ timestamp: '2026-06-05T00:00:00Z', value: 10.1 }] },
      { metric: 'latency_max_ms', points: [{ timestamp: '2026-06-05T00:00:00Z', value: 18.9 }] },
      { metric: 'latency_stddev_ms', points: [{ timestamp: '2026-06-05T00:00:00Z', value: 2.3 }] },
      { metric: 'latency_jitter_ms', points: [{ timestamp: '2026-06-05T00:00:00Z', value: 1.7 }] },
      { metric: 'packet_loss_pct', points: [{ timestamp: '2026-06-05T00:00:00Z', value: 4 }] },
      { metric: 'packets_sent', points: [{ timestamp: '2026-06-05T00:00:00Z', value: 10 }] },
      { metric: 'packets_received', points: [{ timestamp: '2026-06-05T00:00:00Z', value: 9 }] },
    ])

    expect(points).toEqual([
      expect.objectContaining({
        protocol: 'icmp',
        latency_avg_ms: 12.4,
        latency_min_ms: 10.1,
        latency_max_ms: 18.9,
        latency_stddev_ms: 2.3,
        latency_jitter_ms: 1.7,
        packet_loss_pct: 4,
        packets_sent: 10,
        packets_received: 9,
        avg_rtt: 12.4,
        min_rtt: 10.1,
        max_rtt: 18.9,
      }),
    ])
  })

  it('requests and normalizes full TCP window metrics', () => {
    expect(buildMetricsParam('tcp')).toBe([
      'connect_latency_avg_ms',
      'connect_latency_min_ms',
      'connect_latency_max_ms',
      'connect_latency_stddev_ms',
      'connect_jitter_ms',
      'connect_failure_pct',
      'connect_attempts',
      'connect_successes',
      'connect_failures',
    ].join(','))

    const points = normalizeMetricSeries('tcp', [
      { metric: 'connect_latency_avg_ms', points: [{ timestamp: '2026-06-05T00:00:00Z', value: 42.5 }] },
      { metric: 'connect_latency_min_ms', points: [{ timestamp: '2026-06-05T00:00:00Z', value: 33.2 }] },
      { metric: 'connect_latency_max_ms', points: [{ timestamp: '2026-06-05T00:00:00Z', value: 80.6 }] },
      { metric: 'connect_latency_stddev_ms', points: [{ timestamp: '2026-06-05T00:00:00Z', value: 8.1 }] },
      { metric: 'connect_jitter_ms', points: [{ timestamp: '2026-06-05T00:00:00Z', value: 3.4 }] },
      { metric: 'connect_failure_pct', points: [{ timestamp: '2026-06-05T00:00:00Z', value: 12.5 }] },
      { metric: 'connect_attempts', points: [{ timestamp: '2026-06-05T00:00:00Z', value: 8 }] },
      { metric: 'connect_successes', points: [{ timestamp: '2026-06-05T00:00:00Z', value: 7 }] },
      { metric: 'connect_failures', points: [{ timestamp: '2026-06-05T00:00:00Z', value: 1 }] },
    ])

    expect(points).toEqual([
      expect.objectContaining({
        protocol: 'tcp',
        connect_latency_avg_ms: 42.5,
        connect_latency_min_ms: 33.2,
        connect_latency_max_ms: 80.6,
        connect_latency_stddev_ms: 8.1,
        connect_jitter_ms: 3.4,
        connect_failure_pct: 12.5,
        connect_attempts: 8,
        connect_successes: 7,
        connect_failures: 1,
        avg_rtt: 42.5,
        min_rtt: 33.2,
        max_rtt: 80.6,
        packet_loss_pct: 12.5,
      }),
    ])
  })

  it('flattens detail rows as timestamp by agent and uses protocol-specific columns', () => {
    const agentSeries: AgentSeriesData[] = [
      {
        agentUuid: 'agent-b',
        agentName: 'Beta',
        data: [
          {
            timestamp: 1_700_000_000,
            avg_rtt: 20,
            min_rtt: 18,
            max_rtt: 24,
            median_rtt: 20,
            p95_rtt: 20,
            p99_rtt: 20,
            packet_loss_pct: 0,
            protocol: 'icmp',
            latency_avg_ms: 20,
            packets_sent: 4,
            packets_received: 4,
          },
        ],
      },
      {
        agentUuid: 'agent-a',
        agentName: 'Alpha',
        data: [
          {
            timestamp: 1_700_000_060,
            avg_rtt: 10,
            min_rtt: 9,
            max_rtt: 14,
            median_rtt: 10,
            p95_rtt: 10,
            p99_rtt: 10,
            packet_loss_pct: 25,
            protocol: 'icmp',
            latency_avg_ms: 10,
            packets_sent: 4,
            packets_received: 3,
          },
        ],
      },
    ]

    expect(getMetricColumns('icmp').map((column) => column.key)).toEqual([
      'latency_avg_ms',
      'latency_min_ms',
      'latency_max_ms',
      'latency_stddev_ms',
      'latency_jitter_ms',
      'packet_loss_pct',
      'packets_sent',
      'packets_received',
    ])
    expect(flattenAgentMetricRows(agentSeries, 'icmp').map((row) => [row.timestamp, row.agentName])).toEqual([
      [1_700_000_060, 'Alpha'],
      [1_700_000_000, 'Beta'],
    ])
  })
})
