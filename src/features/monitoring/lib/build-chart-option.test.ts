import { describe, expect, it } from 'vitest'
import { buildSmokePingOption } from './build-chart-option'
import { transformToChartData } from './transform-chart-data'
import type { ChartThemeConfig } from './chart-theme'
import type { MonitoringDataPoint } from '@/api/generated/types.gen'

const testTheme: ChartThemeConfig = {
  medianColor: '#00dcc8',
  medianGlow: 'rgba(0, 220, 200, 0.4)',
  bandColors: [
    'rgba(0, 220, 180, 0.35)',
    'rgba(0, 220, 180, 0.22)',
    'rgba(0, 220, 180, 0.12)',
    'rgba(0, 220, 180, 0.06)',
  ],
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

const points: MonitoringDataPoint[] = [
  {
    timestamp: 1_700_000_000,
    avg_rtt: 12,
    max_rtt: 20,
    min_rtt: 8,
    median_rtt: 11,
    p95_rtt: 18,
    p99_rtt: 19,
    packet_loss_pct: 0,
  },
  {
    timestamp: 1_700_000_060,
    avg_rtt: 16,
    max_rtt: 25,
    min_rtt: 10,
    median_rtt: 15,
    p95_rtt: 22,
    p99_rtt: 24,
    packet_loss_pct: 3,
  },
]

describe('buildSmokePingOption', () => {
  it('builds an Avg line, Min-Max band, and Packet Loss bar chart', () => {
    const option = buildSmokePingOption({
      data: transformToChartData(points),
      theme: testTheme,
      rawPoints: points,
      chartStyle: 'basic',
    })

    const series = Array.isArray(option.series) ? option.series : []
    const names = series.map((item) => {
      if (item && typeof item === 'object' && 'name' in item) return item.name
      return undefined
    })

    expect(names).toContain('Avg')
    expect(names).toContain('Min baseline')
    expect(names).toContain('Min-Max band')
    expect(names).toContain('Packet Loss')

    const avg = series.find((item) => item && typeof item === 'object' && 'name' in item && item.name === 'Avg')
    const packetLoss = series.find((item) => item && typeof item === 'object' && 'name' in item && item.name === 'Packet Loss')
    const yAxis = Array.isArray(option.yAxis) ? option.yAxis : []

    expect(avg).toMatchObject({ type: 'line' })
    expect(packetLoss).toMatchObject({ type: 'bar', yAxisIndex: 1 })
    expect(yAxis).toHaveLength(2)
  })
})
