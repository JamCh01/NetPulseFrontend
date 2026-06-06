import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MetricDetailTable } from './metric-detail-table'
import type { AgentSeriesData } from '@/features/monitoring/lib/build-multi-agent-option'

const icmpSeries: AgentSeriesData[] = [
  {
    agentUuid: 'agent-a',
    agentName: 'Tokyo',
    ipFamily: '4',
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
      {
        timestamp: 1_700_000_060,
        avg_rtt: 18,
        min_rtt: 14,
        max_rtt: 26,
        median_rtt: 18,
        p95_rtt: 18,
        p99_rtt: 18,
        packet_loss_pct: 20,
        protocol: 'icmp',
        latency_avg_ms: 18,
        latency_min_ms: 14,
        latency_max_ms: 26,
        latency_stddev_ms: 4,
        latency_jitter_ms: 2.5,
        packets_sent: 10,
        packets_received: 8,
      },
    ],
  },
  {
    agentUuid: 'agent-b',
    agentName: 'Osaka',
    ipFamily: '6',
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
    ipFamily: '4',
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
      {
        timestamp: 1_700_000_060,
        avg_rtt: 61,
        min_rtt: 44,
        max_rtt: 94,
        median_rtt: 61,
        p95_rtt: 61,
        p99_rtt: 61,
        packet_loss_pct: 20,
        protocol: 'tcp',
        connect_latency_avg_ms: 61,
        connect_latency_min_ms: 44,
        connect_latency_max_ms: 94,
        connect_latency_stddev_ms: 7.4,
        connect_jitter_ms: 6.2,
        connect_failure_pct: 20,
        connect_attempts: 5,
        connect_successes: 4,
        connect_failures: 1,
      },
    ],
  },
]

describe('MetricDetailTable', () => {
  it('summarizes ICMP detail metrics by Agent across the current time window', () => {
    render(<MetricDetailTable protocol="icmp" agentSeries={icmpSeries} />)

    expect(screen.getByRole('table', { name: 'ICMP 明细指标' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: '时间' })).not.toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '探针' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'IP 协议族' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '平均延迟' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '延迟抖动' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '接收包数' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'latency_avg_ms' })).not.toBeInTheDocument()

    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(3)
    expect(within(rows[1]).getByText('Osaka')).toBeInTheDocument()
    expect(within(rows[1]).getByText('IPv6')).toBeInTheDocument()
    expect(within(rows[1]).getByText('22.0ms')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Tokyo')).toBeInTheDocument()
    expect(within(rows[2]).getByText('IPv4')).toBeInTheDocument()
    expect(within(rows[2]).getByText('15.2ms')).toBeInTheDocument()
    expect(within(rows[2]).getByText('16.7%')).toBeInTheDocument()
    expect(within(rows[2]).getByText('18')).toBeInTheDocument()
    expect(within(rows[2]).getByText('15')).toBeInTheDocument()
  })

  it('summarizes TCP detail metrics by Agent across the current time window', () => {
    render(<MetricDetailTable protocol="tcp" agentSeries={tcpSeries} />)

    expect(screen.getByRole('table', { name: 'TCP 明细指标' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: '时间' })).not.toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'IP 协议族' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '平均连接耗时' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '连接抖动' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '连接失败数' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'connect_latency_avg_ms' })).not.toBeInTheDocument()
    expect(screen.getByText('IPv4')).toBeInTheDocument()
    expect(screen.getByText('47.2ms')).toBeInTheDocument()
    expect(screen.getByText('13.3%')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('13')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('uses translated empty state and update status', () => {
    render(<MetricDetailTable protocol="icmp" agentSeries={[]} isUpdating />)

    expect(screen.getByText('ICMP 明细指标')).toBeInTheDocument()
    expect(screen.getByText('当前时间范围内暂无明细指标。')).toBeInTheDocument()
    expect(screen.queryByText('Updating')).not.toBeInTheDocument()
  })

  it('keeps existing rows during background updates without showing a refresh label', () => {
    render(<MetricDetailTable protocol="tcp" agentSeries={tcpSeries} isUpdating />)

    expect(screen.getByRole('table', { name: 'TCP 明细指标' })).toBeInTheDocument()
    expect(screen.getByText('Tokyo')).toBeInTheDocument()
    expect(screen.getByText('47.2ms')).toBeInTheDocument()
    expect(screen.queryByText('加载中…')).not.toBeInTheDocument()
    expect(screen.queryByText('当前时间范围内暂无明细指标。')).not.toBeInTheDocument()
  })

  it('keeps the last non-empty rows when a background refresh briefly has no series', () => {
    const { rerender } = render(<MetricDetailTable protocol="tcp" agentSeries={tcpSeries} />)

    expect(screen.getByText('Tokyo')).toBeInTheDocument()
    expect(screen.getByText('47.2ms')).toBeInTheDocument()

    rerender(<MetricDetailTable protocol="tcp" agentSeries={[]} isUpdating />)

    expect(screen.getByRole('table', { name: 'TCP 明细指标' })).toBeInTheDocument()
    expect(screen.getByText('Tokyo')).toBeInTheDocument()
    expect(screen.getByText('47.2ms')).toBeInTheDocument()
    expect(screen.queryByText('加载中…')).not.toBeInTheDocument()
    expect(screen.queryByText('当前时间范围内暂无明细指标。')).not.toBeInTheDocument()
  })

  it('merges partial background update rows into the previous table', () => {
    const { rerender } = render(<MetricDetailTable protocol="icmp" agentSeries={icmpSeries} />)

    expect(screen.getByText('Osaka')).toBeInTheDocument()
    expect(screen.getByText('Tokyo')).toBeInTheDocument()

    rerender(<MetricDetailTable protocol="icmp" agentSeries={[icmpSeries[0]]} isUpdating />)

    expect(screen.getByText('Osaka')).toBeInTheDocument()
    expect(screen.getByText('Tokyo')).toBeInTheDocument()
    expect(screen.queryByText('加载中…')).not.toBeInTheDocument()
  })
})
