import type { EChartsOption } from 'echarts'
import type { MonitoringDataPoint } from '@/api/generated/types.gen'
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
 * Build a SmokePing-style ECharts option with stacked band areas.
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

  const bandConfigs = [
    { name: 'min_avg', band: data.bands.minToAvg, color: theme.bandColors[0], stack: 'band1' },
    { name: 'avg_p95', band: data.bands.avgToP95, color: theme.bandColors[1], stack: 'band2' },
    { name: 'p95_p99', band: data.bands.p95ToP99, color: theme.bandColors[2], stack: 'band3' },
    { name: 'p99_max', band: data.bands.p99ToMax, color: theme.bandColors[3], stack: 'band4' },
  ]

  const series: EChartsOption['series'] = []

  for (const cfg of bandConfigs) {
    series.push({
      name: `${cfg.name.split('_')[0]}_lower`,
      type: 'line',
      stack: cfg.stack,
      symbol: 'none',
      lineStyle: { opacity: 0, width: 0 },
      areaStyle: { opacity: 0 },
      data: data.timestamps.map((ts, i) => {
        const val = cfg.band.lower[i]
        return val === null ? [ts, null] : [ts, val]
      }),
      silent: true,
      z: 1,
      connectNulls: false,
    })
    series.push({
      name: `${cfg.name.split('_')[1]}_delta`,
      type: 'line',
      stack: cfg.stack,
      symbol: 'none',
      lineStyle: { opacity: 0, width: 0 },
      areaStyle: { color: cfg.color },
      data: data.timestamps.map((ts, i) => {
        const val = cfg.band.delta[i]
        return val === null ? [ts, null] : [ts, val]
      }),
      silent: true,
      z: 1,
      connectNulls: false,
    })
  }

  const markAreaData = data.lossIntervals.map(([start, end]) => [
    { xAxis: start, itemStyle: { color: theme.lossAreaColor } },
    { xAxis: end },
  ])

  series.push({
    name: 'Median',
    type: 'line',
    smooth: chartStyle === 'basic',
    step: chartStyle === 'smoke' ? 'middle' : false,
    symbol: 'circle',
    symbolSize: 3,
    showSymbol: false,
    emphasis: { focus: 'series', itemStyle: { borderWidth: 2 } },
    lineStyle: {
      color: theme.medianColor,
      width: 2,
      shadowColor: theme.medianGlow,
      shadowBlur: 8,
    },
    itemStyle: { color: theme.medianColor },
    data: data.timestamps.map((ts, i) => {
      const val = data.medianLine[i]
      return val === null ? [ts, null] : [ts, val]
    }),
    z: 10,
    connectNulls: false,
    markArea: markAreaData.length > 0 ? { silent: true, data: markAreaData as never } : undefined,
  })

  // Build data index for tooltip lookup
  const dataIndex = buildDataIndex(rawPoints)

  return {
    backgroundColor: theme.backgroundColor,
    animation: true,
    animationDuration: 600,
    grid: {
      left: 56,
      right: 16,
      top: 16,
      bottom: 32,
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
