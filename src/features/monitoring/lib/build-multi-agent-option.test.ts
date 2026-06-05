import { describe, expect, it } from 'vitest'
import { buildMultiAgentOption, type AgentSeriesData } from './build-multi-agent-option'
import type { ChartThemeConfig } from './chart-theme'

const theme: ChartThemeConfig = {
  medianColor: '#00dcc8',
  medianGlow: 'rgba(0, 220, 200, 0.4)',
  bandColors: ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.1)'],
  lossColor: 'rgba(255, 50, 80, 0.8)',
  lossAreaColor: 'rgba(255, 50, 80, 0.15)',
  gridLineColor: 'rgba(0, 255, 200, 0.04)',
  axisLabelColor: '#4b5563',
  tooltipBg: 'rgba(6, 12, 24, 0.95)',
  tooltipBorder: 'rgba(0, 255, 200, 0.1)',
  tooltipTextColor: '#d1d5db',
  tooltipLabelColor: '#9ca3af',
  tooltipValueColor: '#fff',
  backgroundColor: 'transparent',
}

describe('buildMultiAgentOption', () => {
  it('shows all visible ICMP agents and protocol metrics in tooltip', () => {
    const ts = 1_700_000_000
    const option = buildMultiAgentOption([
      {
        agentUuid: 'agent-a',
        agentName: 'Tokyo',
        data: [{
          timestamp: ts,
          avg_rtt: 12,
          min_rtt: 10,
          max_rtt: 18,
          median_rtt: 12,
          p95_rtt: 12,
          p99_rtt: 12,
          packet_loss_pct: 25,
          protocol: 'icmp',
          latency_avg_ms: 12,
          latency_min_ms: 10,
          latency_max_ms: 18,
          latency_jitter_ms: 2,
          packets_sent: 4,
          packets_received: 3,
        }],
      },
      {
        agentUuid: 'agent-b',
        agentName: 'Osaka',
        data: [{
          timestamp: ts,
          avg_rtt: 22,
          min_rtt: 20,
          max_rtt: 28,
          median_rtt: 22,
          p95_rtt: 22,
          p99_rtt: 22,
          packet_loss_pct: 0,
          protocol: 'icmp',
          latency_avg_ms: 22,
          latency_min_ms: 20,
          latency_max_ms: 28,
          latency_jitter_ms: 1,
          packets_sent: 4,
          packets_received: 4,
        }],
      },
    ] satisfies AgentSeriesData[], theme, 'smoke', 'icmp')

    const formatter = option.tooltip && typeof option.tooltip === 'object' && !Array.isArray(option.tooltip)
      ? option.tooltip.formatter
      : null
    expect(typeof formatter).toBe('function')

    const html = (formatter as (params: unknown) => string)([
      { axisValue: ts * 1000, seriesName: 'Tokyo' },
      { axisValue: ts * 1000, seriesName: 'Osaka' },
    ])

    expect(html).toContain('Tokyo')
    expect(html).toContain('Osaka')
    expect(html).toContain('Sent/Recv')
    expect(html).toContain('4/3')
    expect(html).toContain('25.0%')
  })

  it('shows TCP attempts, successes, failures, and failure percentage in tooltip', () => {
    const ts = 1_700_000_000
    const option = buildMultiAgentOption([
      {
        agentUuid: 'agent-a',
        agentName: 'Tokyo',
        data: [{
          timestamp: ts,
          avg_rtt: 41,
          min_rtt: 35,
          max_rtt: 82,
          median_rtt: 41,
          p95_rtt: 41,
          p99_rtt: 41,
          packet_loss_pct: 10,
          protocol: 'tcp',
          connect_latency_avg_ms: 41,
          connect_latency_min_ms: 35,
          connect_latency_max_ms: 82,
          connect_jitter_ms: 4,
          connect_failure_pct: 10,
          connect_attempts: 10,
          connect_successes: 9,
          connect_failures: 1,
        }],
      },
    ] satisfies AgentSeriesData[], theme, 'smoke', 'tcp')

    const formatter = option.tooltip && typeof option.tooltip === 'object' && !Array.isArray(option.tooltip)
      ? option.tooltip.formatter
      : null
    const html = (formatter as (params: unknown) => string)([
      { axisValue: ts * 1000, seriesName: 'Tokyo' },
    ])

    expect(html).toContain('Attempts')
    expect(html).toContain('OK/Fail')
    expect(html).toContain('10')
    expect(html).toContain('9/1')
    expect(html).toContain('10.0%')
  })
})
