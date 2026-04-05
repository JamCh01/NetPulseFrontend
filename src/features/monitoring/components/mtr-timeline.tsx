import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import type { MtrResultSummary } from '@/api/generated/types.gen'
import { formatChartTime } from '@/lib/format'
import { useChartTheme } from '../lib/chart-theme'

interface MtrTimelineProps {
  results: MtrResultSummary[]
  isLoading?: boolean
  onSelectResult?: (resultUuid: string) => void
  selectedResultUuid?: string
  height?: number
}

export function MtrTimeline({
  results,
  isLoading,
  onSelectResult,
  selectedResultUuid,
  height = 200,
}: MtrTimelineProps) {
  const theme = useChartTheme()

  const option = useMemo((): EChartsOption => {
    if (results.length === 0) {
      return {
        title: {
          text: 'No data',
          left: 'center',
          top: 'center',
          textStyle: { color: theme.axisLabelColor, fontSize: 14 },
        },
      }
    }

    // Sort by timestamp
    const sorted = [...results].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    const dataSuccess = sorted
      .filter((r) => r.target_reached)
      .map((r) => ({
        name: r.result_uuid,
        value: [new Date(r.timestamp).getTime(), 1],
        itemStyle: {
          color: '#4ade80',
          borderColor: r.result_uuid === selectedResultUuid ? '#ffffff' : 'transparent',
          borderWidth: r.result_uuid === selectedResultUuid ? 2 : 0,
        },
        symbolSize: r.result_uuid === selectedResultUuid ? 16 : 12,
      }))

    const dataFailed = sorted
      .filter((r) => !r.target_reached)
      .map((r) => ({
        name: r.result_uuid,
        value: [new Date(r.timestamp).getTime(), 0],
        itemStyle: {
          color: '#ff3250',
          borderColor: r.result_uuid === selectedResultUuid ? '#ffffff' : 'transparent',
          borderWidth: r.result_uuid === selectedResultUuid ? 2 : 0,
        },
        symbolSize: r.result_uuid === selectedResultUuid ? 16 : 12,
      }))

    return {
      backgroundColor: theme.backgroundColor,
      animation: true,
      animationDuration: 600,
      grid: {
        left: 56,
        right: 16,
        top: 24,
        bottom: 40,
        containLabel: false,
      },
      xAxis: {
        type: 'time',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: theme.axisLabelColor,
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: -0.5,
        max: 1.5,
        axisLabel: {
          show: false,
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: { color: theme.gridLineColor, type: 'dashed' },
        },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: theme.tooltipBg,
        borderColor: theme.tooltipBorder,
        textStyle: { color: theme.tooltipTextColor, fontSize: 11 },
        formatter: (params: unknown) => {
          const p = params as {
            name: string
            value: [number, number]
            data: { itemStyle: { color: string } }
          }
          if (!p) return ''

          const result = sorted.find((r) => r.result_uuid === p.name)
          if (!result) return ''

          const timeStr = formatChartTime(p.value[0])
          const statusColor = result.target_reached ? '#4ade80' : '#ff3250'
          const statusText = result.target_reached ? 'Reached' : 'Failed'

          return `
            <div style="font-family:'Inter',sans-serif;font-size:11px;line-height:1.4">
              <div style="color:${theme.tooltipLabelColor};margin-bottom:4px">${timeStr}</div>
              <div>
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${statusColor};margin-right:6px"></span>
                <span style="color:${statusColor}">${statusText}</span>
              </div>
              <div style="margin-top:4px;color:${theme.tooltipValueColor}">
                Hops: ${result.total_hops}
              </div>
            </div>
          `
        },
      },
      series: [
        {
          name: 'Success',
          type: 'scatter',
          symbolSize: 12,
          data: dataSuccess,
          encode: {
            x: 0,
            y: 1,
          },
          z: 10,
        },
        {
          name: 'Failed',
          type: 'scatter',
          symbolSize: 12,
          data: dataFailed,
          encode: {
            x: 0,
            y: 1,
          },
          z: 10,
        },
      ],
    }
  }, [results, theme, selectedResultUuid])

  if (isLoading) {
    return (
      <div style={{ height }} className="glass-light rounded-xl animate-pulse" />
    )
  }

  return (
    <ReactECharts
      option={option}
      style={{ height }}
      notMerge={true}
      onEvents={{
        click: (params: unknown) => {
          if (!onSelectResult) return
          const p = params as { name: string }
          if (p?.name) {
            onSelectResult(p.name)
          }
        },
      }}
    />
  )
}
