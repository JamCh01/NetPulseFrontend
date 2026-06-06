import type { EChartsOption } from 'echarts'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MtrTimeline } from './mtr-timeline'
import type { MtrResultSummaryView } from '@/features/monitoring/lib/monitoring-models'

const capturedOptions: EChartsOption[] = []

vi.mock('@/components/charts/lazy-echarts', () => ({
  LazyECharts: ({ option }: { option: EChartsOption }) => {
    capturedOptions.push(option)
    return <div data-testid="mtr-timeline-chart" />
  },
}))

vi.mock('../../lib/chart-theme', () => ({
  useChartTheme: () => ({
    backgroundColor: 'transparent',
    axisLabelColor: '#94a3b8',
    gridLineColor: '#334155',
    tooltipBg: '#0f172a',
    tooltipBorder: '#334155',
    tooltipTextColor: '#e2e8f0',
    tooltipLabelColor: '#94a3b8',
    tooltipValueColor: '#e2e8f0',
  }),
}))

function result(resultUuid: string, timestamp: string, targetReached = true): MtrResultSummaryView {
  return {
    result_uuid: resultUuid,
    task_uuid: 'task-mtr',
    agent_uuid: 'agent-tokyo',
    timestamp,
    target_reached: targetReached,
    total_hops: targetReached ? 8 : 3,
  }
}

describe('MtrTimeline', () => {
  it('enables built-in horizontal time-axis panning and slider zoom', () => {
    capturedOptions.length = 0

    render(
      <MtrTimeline
        results={[
          result('result-1', '2026-06-06T00:00:00Z'),
          result('result-2', '2026-06-06T01:00:00Z', false),
        ]}
      />,
    )

    expect(screen.getByTestId('mtr-timeline-chart')).toBeInTheDocument()
    const dataZoom = capturedOptions.at(-1)?.dataZoom
    expect(dataZoom).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'inside', xAxisIndex: 0, filterMode: 'none' }),
      expect.objectContaining({ type: 'slider', xAxisIndex: 0, filterMode: 'none' }),
    ]))
  })
})
