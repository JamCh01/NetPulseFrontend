import type { EChartsOption } from 'echarts'
import type { MonitoringDataPoint, MonitoringMetricProtocol } from '@/features/monitoring/lib/monitoring-data-point'
import type { ChartThemeConfig } from './chart-theme'
import { getAgentColor } from './agent-colors'
import { formatChartTime } from '@/lib/format'
import { formatMetricValue, normalizeProtocol } from './protocol-metrics'

export interface AgentSeriesData {
  agentUuid: string
  agentName: string
  ipFamily?: string | null
  data: MonitoringDataPoint[]
}

type ChartStyle = 'basic' | 'smoke'

// Maximum gap between data points before we show a break in the chart (5 minutes)
const MAX_GAP_MS = 5 * 60 * 1000

interface ProcessedAgentData {
  timestamps: number[]
  min: (number | null)[]
  max: (number | null)[]
  avg: (number | null)[]
  loss: (number | null)[]
  rawPoints: Map<number, MonitoringDataPoint>
}

/**
 * Insert null values into data arrays where there are time gaps > MAX_GAP_MS.
 */
function processAgentData(points: MonitoringDataPoint[]): ProcessedAgentData {
  const timestamps: number[] = []
  const min: (number | null)[] = []
  const max: (number | null)[] = []
  const avg: (number | null)[] = []
  const loss: (number | null)[] = []
  const rawPoints = new Map<number, MonitoringDataPoint>()

  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const ts = p.timestamp * 1000

    // Check if there's a gap from the previous point
    if (i > 0) {
      const prevTs = points[i - 1].timestamp * 1000
      if (ts - prevTs > MAX_GAP_MS) {
        const midTs = prevTs + (ts - prevTs) / 2
        timestamps.push(midTs)
        min.push(null)
        max.push(null)
        avg.push(null)
        loss.push(null)
      }
    }

    timestamps.push(ts)
    min.push(p.min_rtt)
    max.push(p.max_rtt)
    avg.push(p.avg_rtt)
    loss.push(p.packet_loss_pct)
    rawPoints.set(ts, p)
  }

  return { timestamps, min, max, avg, loss, rawPoints }
}

/**
 * Build a multi-agent overlay chart.
 * Each agent gets Avg as the main line, a Min-Max envelope, and packet loss bars.
 */
export function buildMultiAgentOption(
  agentSeries: AgentSeriesData[],
  theme: ChartThemeConfig,
  chartStyle: ChartStyle = 'smoke',
  protocol?: MonitoringMetricProtocol,
): EChartsOption {
  const nonEmpty = agentSeries.filter((s) => s.data.length > 0)
  const normalizedProtocol = normalizeProtocol(protocol ?? nonEmpty[0]?.data[0]?.protocol)
  const lossSeriesName = normalizedProtocol === 'tcp' ? 'Connect Failure' : 'Packet Loss'

  if (nonEmpty.length === 0) {
    return {
      title: {
        text: 'No data',
        left: 'center',
        top: 'center',
        textStyle: { color: theme.axisLabelColor, fontSize: 14 },
      },
    }
  }

  const series: NonNullable<EChartsOption['series']> = []
  const processedAgents: Array<{
    agent: AgentSeriesData
    color: ReturnType<typeof getAgentColor>
    processed: ProcessedAgentData
  }> = []

  for (let i = 0; i < nonEmpty.length; i++) {
    const agent = nonEmpty[i]
    const color = getAgentColor(i)
    const processed = processAgentData(agent.data)
    processedAgents.push({ agent, color, processed })

    // Band area (min → max) — subtle fill per agent
    series.push({
      name: `${agent.agentName} Min baseline`,
      type: 'line',
      stack: `band_${i}`,
      symbol: 'none',
      lineStyle: { opacity: 0, width: 0 },
      areaStyle: { opacity: 0 },
      data: processed.timestamps.map((ts, j) => {
        const val = processed.min[j]
        return val === null ? [ts, null] : [ts, val]
      }),
      silent: true,
      z: 1,
      connectNulls: false,
    })
    series.push({
      name: `${agent.agentName} Min-Max band`,
      type: 'line',
      stack: `band_${i}`,
      symbol: 'none',
      lineStyle: { opacity: 0, width: 0 },
      areaStyle: { color: color.bg },
      data: processed.timestamps.map((ts, j) => {
        const minVal = processed.min[j]
        const maxVal = processed.max[j]
        if (minVal === null || maxVal === null) {
          return [ts, null]
        }
        return [ts, Math.max(0, maxVal - minVal)]
      }),
      silent: true,
      z: 1,
      connectNulls: false,
    })

    // Loss/failure bars use the right axis.
    series.push({
      name: `${agent.agentName} ${lossSeriesName}`,
      type: 'bar',
      yAxisIndex: 1,
      barMaxWidth: 8,
      itemStyle: {
        color: color.line,
        opacity: 0.28,
        borderRadius: [2, 2, 0, 0],
      },
      data: processed.timestamps.map((ts, j) => {
        const val = processed.loss[j]
        return val === null ? [ts, null] : [ts, val]
      }),
      z: 3,
    })

    // Avg line — the main visible line per agent
    series.push({
      name: agent.agentName,
      type: 'line',
      smooth: chartStyle === 'basic',
      step: chartStyle === 'smoke' ? 'middle' : false,
      symbol: 'circle',
      symbolSize: 3,
      showSymbol: false,
      emphasis: { focus: 'series', itemStyle: { borderWidth: 2 } },
      lineStyle: {
        color: color.line,
        width: 2,
        shadowColor: color.glow,
        shadowBlur: 6,
      },
      itemStyle: { color: color.line },
      data: processed.timestamps.map((ts, j) => {
        const val = processed.avg[j]
        return val === null ? [ts, null] : [ts, val]
      }),
      z: 10 + i,
      connectNulls: false,
    })
  }

  // Build per-agent data indexes for tooltip lookup
  const agentIndexes = processedAgents.map((pa, i) => ({
    name: pa.agent.agentName,
    color: getAgentColor(i).line,
    index: pa.processed.rawPoints,
  }))

  return {
    backgroundColor: theme.backgroundColor,
    animation: true,
    animationDuration: 600,
    legend: {
      show: true,
      bottom: 0,
      left: 'center',
      textStyle: { color: theme.axisLabelColor, fontSize: 10 },
      itemWidth: 16,
      itemHeight: 2,
      itemGap: 16,
      // Only show agent Avg lines in legend, not band/loss/failure series
      selector: false,
      data: processedAgents.map((pa, i) => ({
        name: pa.agent.agentName,
        itemStyle: { color: getAgentColor(i).line },
      })),
    },
    grid: {
      left: 8,
      right: 16,
      top: 16,
      bottom: 48,
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
        name: normalizedProtocol === 'tcp' ? 'Failure' : 'Loss',
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
        type: 'line',
        lineStyle: { color: 'rgba(255,255,255,0.1)' },
      },
      backgroundColor: theme.tooltipBg,
      borderColor: theme.tooltipBorder,
      textStyle: { color: theme.tooltipTextColor, fontSize: 11 },
      formatter: (params: unknown) => {
        const rawItems = params as Array<{ axisValue: number; seriesName: string }>
        if (!rawItems || rawItems.length === 0) return ''

        // Get visible agent names from params (legend toggle filters series from params)
        const visibleNames = new Set(
          rawItems
            .map((i) => i.seriesName)
            .filter((n) => !n.includes('Min baseline') && !n.includes('Min-Max band') && !n.includes('Packet Loss') && !n.includes('Connect Failure')),
        )

        const ts = rawItems[0].axisValue
        const timeStr = formatChartTime(ts)

        const labelColor = theme.tooltipLabelColor
        const valueColor = theme.tooltipValueColor
        const nameColor = theme.tooltipTextColor

        // Collect visible agents' data
        const rows: Array<{ name: string; color: string; point: MonitoringDataPoint }> = []
        for (const agent of agentIndexes) {
          if (!visibleNames.has(agent.name)) continue
          let point: MonitoringDataPoint | undefined = agent.index.get(ts)
          if (!point) {
            for (const [key, val] of agent.index) {
              if (Math.abs(key - ts) < 30000) { point = val; break }
            }
          }
          if (point) rows.push({ name: agent.name, color: agent.color, point })
        }
        if (rows.length === 0) return ''

        // Compact table layout: header row + one row per agent
        const mono = "font-family:'JetBrains Mono',monospace;font-weight:500;text-align:right"
        const th = `color:${labelColor};font-size:9px;text-align:right;padding:0 4px`
        const td = `font-size:10px;${mono};padding:1px 4px`
        const headers = normalizedProtocol === 'tcp'
          ? ['Avg', 'Min/Max', 'Jitter', 'Attempts', 'OK/Fail', 'Failure']
          : ['Avg', 'Min/Max', 'Jitter', 'Sent/Recv', 'Loss']

        let html = `<div style="font-family:'Inter',sans-serif;font-size:11px;line-height:1.4">`
        html += `<div style="color:${labelColor};margin-bottom:4px">${timeStr}</div>`
        html += `<table style="border-collapse:collapse;width:100%">`
        html += `<tr><td style="${th}"></td>${headers.map((label) => `<td style="${th}">${label}</td>`).join('')}</tr>`

        for (const row of rows) {
          const p = row.point
          const failureOrLoss = normalizedProtocol === 'tcp' ? p.connect_failure_pct ?? p.packet_loss_pct : p.packet_loss_pct
          const lc = failureOrLoss > 0 ? '#ff3250' : '#4ade80'
          const avg = normalizedProtocol === 'tcp' ? p.connect_latency_avg_ms ?? p.avg_rtt : p.latency_avg_ms ?? p.avg_rtt
          const min = normalizedProtocol === 'tcp' ? p.connect_latency_min_ms ?? p.min_rtt : p.latency_min_ms ?? p.min_rtt
          const max = normalizedProtocol === 'tcp' ? p.connect_latency_max_ms ?? p.max_rtt : p.latency_max_ms ?? p.max_rtt
          const jitter = normalizedProtocol === 'tcp' ? p.connect_jitter_ms : p.latency_jitter_ms
          html += `<tr>`
          html += `<td style="padding:1px 4px;white-space:nowrap"><span style="display:inline-block;width:8px;height:2px;border-radius:1px;background:${row.color};vertical-align:middle;margin-right:4px"></span><span style="color:${nameColor};font-size:10px">${row.name}</span></td>`
          html += `<td style="${td};color:${row.color}">${formatMetricValue(avg, 'ms').replace('ms', '')}</td>`
          html += `<td style="${td};color:${valueColor}">${formatMetricValue(min, 'ms').replace('ms', '')}/${formatMetricValue(max, 'ms').replace('ms', '')}</td>`
          html += `<td style="${td};color:${valueColor}">${formatMetricValue(jitter, 'ms').replace('ms', '')}</td>`
          if (normalizedProtocol === 'tcp') {
            html += `<td style="${td};color:${valueColor}">${formatMetricValue(p.connect_attempts, 'count')}</td>`
            html += `<td style="${td};color:${valueColor}">${formatMetricValue(p.connect_successes, 'count')}/${formatMetricValue(p.connect_failures, 'count')}</td>`
            html += `<td style="${td};color:${lc}">${formatMetricValue(failureOrLoss, 'percent')}</td>`
          } else {
            html += `<td style="${td};color:${valueColor}">${formatMetricValue(p.packets_sent, 'count')}/${formatMetricValue(p.packets_received, 'count')}</td>`
            html += `<td style="${td};color:${lc}">${formatMetricValue(failureOrLoss, 'percent')}</td>`
          }
          html += `</tr>`
        }

        html += `</table></div>`
        return html
      },
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
