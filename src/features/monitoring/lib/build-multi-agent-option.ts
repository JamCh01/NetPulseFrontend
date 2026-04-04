import type { EChartsOption } from 'echarts'
import type { MonitoringDataPoint } from '@/api/generated/types.gen'
import type { ChartThemeConfig } from './chart-theme'
import { getAgentColor } from './agent-colors'
import { buildDataIndex } from './tooltip-formatter'
import { formatChartTime } from '@/lib/format'

export interface AgentSeriesData {
  agentUuid: string
  agentName: string
  data: MonitoringDataPoint[]
}

/**
 * Build a multi-agent overlay chart.
 * Each agent gets its own median line with a distinct color.
 * A shared band (min-max envelope) is drawn for the first agent as reference.
 */
export function buildMultiAgentOption(
  agentSeries: AgentSeriesData[],
  theme: ChartThemeConfig,
): EChartsOption {
  const nonEmpty = agentSeries.filter((s) => s.data.length > 0)

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

  for (let i = 0; i < nonEmpty.length; i++) {
    const agent = nonEmpty[i]
    const color = getAgentColor(i)
    const timestamps = agent.data.map((p) => p.timestamp * 1000)

    // Band area (min → max) — subtle fill per agent
    series.push({
      name: `${agent.agentName}_band_lower`,
      type: 'line',
      stack: `band_${i}`,
      symbol: 'none',
      lineStyle: { opacity: 0, width: 0 },
      areaStyle: { opacity: 0 },
      data: timestamps.map((ts, j) => [ts, agent.data[j].min_rtt]),
      silent: true,
      z: 1,
    })
    series.push({
      name: `${agent.agentName}_band`,
      type: 'line',
      stack: `band_${i}`,
      symbol: 'none',
      lineStyle: { opacity: 0, width: 0 },
      areaStyle: { color: color.bg },
      data: timestamps.map((ts, j) => [ts, Math.max(0, agent.data[j].max_rtt - agent.data[j].min_rtt)]),
      silent: true,
      z: 1,
    })

    // Median line — the main visible line per agent
    series.push({
      name: agent.agentName,
      type: 'line',
      smooth: true,
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
      data: timestamps.map((ts, j) => [ts, agent.data[j].median_rtt]),
      z: 10 + i,
    })
  }

  // Build per-agent data indexes for tooltip lookup
  const agentIndexes = nonEmpty.map((agent, i) => ({
    name: agent.agentName,
    color: getAgentColor(i).line,
    index: buildDataIndex(agent.data),
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
      // Only show agent median lines in legend, not band/loss series
      selector: false,
      data: nonEmpty.map((a, i) => ({
        name: a.agentName,
        itemStyle: { color: getAgentColor(i).line },
      })),
    },
    grid: {
      left: 56,
      right: 16,
      top: 16,
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
            .filter((n) => !n.includes('_band')),
        )

        const ts = rawItems[0].axisValue
        const timeStr = formatChartTime(ts)

        const rtt = (v: number) => v.toFixed(1)

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
        const th = "color:#6b7280;font-size:9px;text-align:right;padding:0 4px"
        const td = `font-size:10px;${mono};padding:1px 4px`

        let html = `<div style="font-family:'Inter',sans-serif;font-size:11px;line-height:1.4">`
        html += `<div style="color:#9ca3af;margin-bottom:4px">${timeStr}</div>`
        html += `<table style="border-collapse:collapse;width:100%">`
        html += `<tr><td style="${th}"></td><td style="${th}">Med</td><td style="${th}">Avg</td><td style="${th}">Min</td><td style="${th}">Max</td><td style="${th}">P95</td><td style="${th}">P99</td><td style="${th}">Loss</td></tr>`

        for (const row of rows) {
          const p = row.point
          const lc = p.packet_loss_pct > 0 ? '#ff3250' : '#4ade80'
          html += `<tr>`
          html += `<td style="padding:1px 4px;white-space:nowrap"><span style="display:inline-block;width:8px;height:2px;border-radius:1px;background:${row.color};vertical-align:middle;margin-right:4px"></span><span style="color:#d1d5db;font-size:10px">${row.name}</span></td>`
          html += `<td style="${td};color:${row.color}">${rtt(p.median_rtt)}</td>`
          html += `<td style="${td};color:#fff">${rtt(p.avg_rtt)}</td>`
          html += `<td style="${td};color:#fff">${rtt(p.min_rtt)}</td>`
          html += `<td style="${td};color:#fff">${rtt(p.max_rtt)}</td>`
          html += `<td style="${td};color:#fff">${rtt(p.p95_rtt)}</td>`
          html += `<td style="${td};color:#fff">${rtt(p.p99_rtt)}</td>`
          html += `<td style="${td};color:${lc}">${p.packet_loss_pct.toFixed(1)}%</td>`
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
