import type { EChartsOption } from 'echarts'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MultiAgentChart } from './multi-agent-chart'
import type { AgentSeriesData } from '@/features/monitoring/lib/build-multi-agent-option'

const capturedOptions: EChartsOption[] = []

vi.mock('@/components/charts/lazy-echarts', () => ({
  LazyECharts: ({ option }: { option: EChartsOption }) => {
    capturedOptions.push(option)
    return <div data-testid="multi-agent-chart" />
  },
}))

vi.mock('../../lib/chart-theme', () => ({
  useChartTheme: () => ({
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
  }),
}))

const populatedSeries: AgentSeriesData[] = [{
  agentUuid: 'agent-a',
  agentName: 'Tokyo',
  data: [{
    timestamp: 1_700_000_000,
    protocol: 'icmp',
    avg_rtt: 12,
    min_rtt: 10,
    max_rtt: 18,
    median_rtt: 12,
    p95_rtt: 12,
    p99_rtt: 12,
    packet_loss_pct: 0,
    latency_avg_ms: 12,
    latency_min_ms: 10,
    latency_max_ms: 18,
    packets_sent: 30,
    packets_received: 30,
  }],
}]

describe('MultiAgentChart', () => {
  it('keeps the last rendered series while a refresh temporarily has no incoming data', () => {
    capturedOptions.length = 0

    const { rerender } = render(
      <MultiAgentChart agentSeries={populatedSeries} protocol="icmp" />,
    )

    expect(screen.getByTestId('multi-agent-chart')).toBeInTheDocument()
    expect(capturedOptions.at(-1)?.title).toBeUndefined()

    rerender(
      <MultiAgentChart agentSeries={[]} protocol="icmp" isUpdating />,
    )

    expect(screen.getByTestId('multi-agent-chart')).toBeInTheDocument()
    expect(screen.queryByText('Updating')).not.toBeInTheDocument()
    expect(capturedOptions.at(-1)?.title).toBeUndefined()
    expect(capturedOptions.at(-1)?.series).toEqual(expect.any(Array))
  })
})
