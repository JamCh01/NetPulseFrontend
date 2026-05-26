import type { EChartsOption } from 'echarts'
import type { MonitoringDataPoint } from '@/features/monitoring/lib/monitoring-data-point'
import type { ChartBandData } from './transform-chart-data'
import type { ChartThemeConfig } from './chart-theme'
import { buildDataIndex, createTooltipFormatter } from './tooltip-formatter'

type ChartStyle = 'basic' | 'smoke'

interface BuildOptionParams {
  data: ChartBandData
  theme: ChartThemeConfig
  agentName?: string
  rawPoints: MonitoringDataPoint[]
  chartStyle?: ChartStyle
}

/**
 * Build a latency/loss combo chart:
 * Avg line + translucent Min-Max band + Packet Loss bars.
 */
export function buildSmokePingOption({
  data,
  theme,
  agentName,
  rawPoints,
  chartStyle = 'smoke',
}: BuildOptionParams): EChartsOption {
  if (data.timestamps.length === 0) {
    return { title: { text: 'No data', left: 'center', top: 'center', textStyle: { color: theme.axisLabelColor, fontSize: 14 } } }
  }

  const series: EChartsOption['series'] = []

  series.push({
    name: 'Min baseline',
    type: 'line',
    stack: 'min_max_band',
    symbol: 'none',
    showSymbol: false,
    lineStyle: { opacity: 0, width: 0 },
    areaStyle: { opacity: 0 },
    data: data.timestamps.map((ts, i) => {
      const val = data.minLine[i]
      return val === null ? [ts, null] : [ts, val]
    }),
    silent: true,
    z: 1,
    connectNulls: false,
  })

  series.push({
    name: 'Min-Max band',
    type: 'line',
    stack: 'min_max_band',
    symbol: 'none',
    showSymbol: false,
    lineStyle: { opacity: 0, width: 0 },
    areaStyle: { color: theme.bandColors[1], opacity: 1 },
    data: data.timestamps.map((ts, i) => {
      const delta = data.minMaxDelta[i]
      return delta === null ? [ts, null] : [ts, delta]
    }),
    silent: true,
    z: 2,
    connectNulls: false,
  })

  series.push({
    name: 'Packet Loss',
    type: 'bar',
    yAxisIndex: 1,
    barMaxWidth: 10,
    itemStyle: {
      color: theme.lossColor,
      borderRadius: [2, 2, 0, 0],
    },
    data: data.timestamps.map((ts, i) => {
      const val = data.packetLoss[i]
      return val === null ? [ts, null] : [ts, val]
    }),
    z: 3,
  })

  series.push({
    name: 'Avg',
    type: 'line',
    smooth: chartStyle === 'basic',
    step: chartStyle === 'smoke' ? 'middle' : false,
    symbol: 'circle',
    symbolSize: 3,
    showSymbol: false,
    emphasis: { focus: 'series', itemStyle: { borderWidth: 2 } },
    lineStyle: {
      color: theme.medianColor,
      width: 2.5,
      shadowColor: theme.medianGlow,
      shadowBlur: 8,
    },
    itemStyle: { color: theme.medianColor },
    data: data.timestamps.map((ts, i) => {
      const val = data.avgLine[i]
      return val === null ? [ts, null] : [ts, val]
    }),
    z: 10,
    connectNulls: false,
  })

  // Build data index for tooltip lookup
  const dataIndex = buildDataIndex(rawPoints)

  return {
    backgroundColor: theme.backgroundColor,
    animation: true,
    animationDuration: 600,
    grid: {
      left: 8,
      right: 16,
      top: 16,
      bottom: 24,
      containLabel: true,
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
    yAxis: [
      {
        type: 'value',
        name: 'Latency',
        nameTextStyle: { color: theme.axisLabelColor, fontSize: 10 },
        axisLabel: {
          color: theme.axisLabelColor,
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          formatter: '{value}ms',
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: { color: theme.gridLineColor, type: 'dashed' },
        },
        min: 0,
      },
      {
        type: 'value',
        name: 'Loss',
        nameTextStyle: { color: theme.axisLabelColor, fontSize: 10 },
        axisLabel: {
          color: theme.axisLabelColor,
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          formatter: '{value}%',
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        min: 0,
        max: 100,
      },
    ],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        lineStyle: { color: theme.medianColor, opacity: 0.3 },
        crossStyle: { color: theme.medianColor, opacity: 0.3 },
      },
      backgroundColor: theme.tooltipBg,
      borderColor: theme.tooltipBorder,
      textStyle: { color: theme.tooltipTextColor },
      formatter: createTooltipFormatter(dataIndex, agentName, theme) as never,
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'none',
      },
    ],
    series,
  }
}
