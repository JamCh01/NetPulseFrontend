import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MetricDetailTable } from './metric-detail-table'
import type { AgentSeriesData } from '@/features/monitoring/lib/build-multi-agent-option'

const icmpSeries: AgentSeriesData[] = [
  {
    agentUuid: 'agent-a',
    agentName: 'Tokyo',
    data: [
      {
        timestamp: 1_700_000_000,
        avg_rtt: 12,
        min_rtt: 10,
        max_rtt: 18,
        median_rtt: 12,
        p95_rtt: 12,
        p99_rtt: 12,
        packet_loss_pct: 2.5,
        protocol: 'icmp',
        latency_avg_ms: 12,
        latency_min_ms: 10,
        latency_max_ms: 18,
        latency_stddev_ms: 2,
        latency_jitter_ms: 1.5,
        packets_sent: 8,
        packets_received: 7,
      },
    ],
  },
  {
    agentUuid: 'agent-b',
    agentName: 'Osaka',
    data: [
      {
        timestamp: 1_700_000_060,
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
        latency_stddev_ms: 3,
        latency_jitter_ms: 2.5,
        packets_sent: 8,
        packets_received: 8,
      },
    ],
  },
]

const tcpSeries: AgentSeriesData[] = [
  {
    agentUuid: 'agent-a',
    agentName: 'Tokyo',
    data: [
      {
        timestamp: 1_700_000_000,
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
        connect_latency_stddev_ms: 5.4,
        connect_jitter_ms: 4.2,
        connect_failure_pct: 10,
        connect_attempts: 10,
        connect_successes: 9,
        connect_failures: 1,
      },
    ],
  },
]

describe('MetricDetailTable', () => {
  it('renders ICMP detail columns and rows for each agent sample', () => {
    render(<MetricDetailTable protocol="icmp" agentSeries={icmpSeries} />)

    expect(screen.getByRole('table', { name: 'ICMP 明细指标' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: '时间' })).not.toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '探针' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '平均延迟' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '延迟抖动' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '接收包数' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'latency_avg_ms' })).not.toBeInTheDocument()

    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(3)
    expect(within(rows[1]).getByText('Osaka')).toBeInTheDocument()
    expect(within(rows[1]).getByText('22.0ms')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Tokyo')).toBeInTheDocument()
    expect(within(rows[2]).getByText('7')).toBeInTheDocument()
  })

  it('renders TCP detail columns including attempts and failures', () => {
    render(<MetricDetailTable protocol="tcp" agentSeries={tcpSeries} />)

    expect(screen.getByRole('table', { name: 'TCP 明细指标' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: '时间' })).not.toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '平均连接耗时' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '连接抖动' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '连接失败数' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'connect_latency_avg_ms' })).not.toBeInTheDocument()
    expect(screen.getByText('10.0%')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('uses translated empty state and update status', () => {
    render(<MetricDetailTable protocol="icmp" agentSeries={[]} isUpdating />)

    expect(screen.getByText('ICMP 明细指标')).toBeInTheDocument()
    expect(screen.getByText('当前时间范围内暂无明细指标。')).toBeInTheDocument()
    expect(screen.queryByText('Updating')).not.toBeInTheDocument()
  })
})
