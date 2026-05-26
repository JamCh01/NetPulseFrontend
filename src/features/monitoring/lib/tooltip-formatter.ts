/**
 * Custom ECharts tooltip formatter for SmokePing charts.
 * Uses a pre-built timestamp→data index for reliable value lookup.
 */

import type { MonitoringDataPoint } from '@/features/monitoring/lib/monitoring-data-point'
import type { ChartThemeConfig } from './chart-theme'
import { formatChartTime } from '@/lib/format'

function rtt(val: number | undefined): string {
  if (val === undefined || val === null) return '--'
  return `${val.toFixed(1)}ms`
}

/**
 * Build a timestamp → MonitoringDataPoint index for O(1) lookup in tooltip.
 */
export function buildDataIndex(points: MonitoringDataPoint[]): Map<number, MonitoringDataPoint> {
  const map = new Map<number, MonitoringDataPoint>()
  for (const p of points) {
    map.set(p.timestamp * 1000, p) // key in ms (ECharts time axis)
  }
  return map
}

interface TooltipParams {
  axisValue: number
}

/**
 * Create a tooltip formatter that looks up the full data point by timestamp.
 */
export function createTooltipFormatter(
  dataIndex: Map<number, MonitoringDataPoint>,
  agentName?: string,
  theme?: ChartThemeConfig,
) {
  const labelColor = theme?.tooltipLabelColor ?? '#9ca3af'
  const valueColor = theme?.tooltipValueColor ?? '#fff'
  const medianColor = theme?.medianColor ?? '#00dcc8'
  const dividerColor = theme ? (theme.tooltipValueColor === '#fff' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)') : 'rgba(255,255,255,0.06)'

  return function tooltipFormatter(params: TooltipParams | TooltipParams[]): string {
    const items = Array.isArray(params) ? params : [params]
    if (items.length === 0) return ''

    const ts = items[0].axisValue
    const timeStr = formatChartTime(ts)

    // Find the closest data point (exact match or nearest)
    let point = dataIndex.get(ts)
    if (!point) {
      // Try nearest within 30s window
      for (const [key, val] of dataIndex) {
        if (Math.abs(key - ts) < 30000) {
          point = val
          break
        }
      }
    }

    let html = `<div style="font-family:'Inter',sans-serif;font-size:11px;line-height:1.6;min-width:160px">`
    html += `<div style="color:${labelColor};margin-bottom:4px">${timeStr}</div>`

    if (agentName) {
      html += `<div style="color:${valueColor};font-weight:600;margin-bottom:4px">${agentName}</div>`
    }

    if (!point) {
      html += `<div style="color:${labelColor}">--</div></div>`
      return html
    }

    const rows = [
      { label: 'Median', value: rtt(point.median_rtt), color: medianColor },
      { label: 'Avg', value: rtt(point.avg_rtt) },
      { label: 'Min', value: rtt(point.min_rtt) },
      { label: 'Max', value: rtt(point.max_rtt) },
      { label: 'P95', value: rtt(point.p95_rtt) },
      { label: 'P99', value: rtt(point.p99_rtt) },
    ]

    for (const row of rows) {
      html += `<div style="display:flex;justify-content:space-between;gap:16px">`
      html += `<span style="color:${labelColor}">${row.label}</span>`
      html += `<span style="color:${row.color ?? valueColor};font-family:'JetBrains Mono',monospace;font-weight:500">${row.value}</span>`
      html += `</div>`
    }

    // Packet loss row
    const lossVal = point.packet_loss_pct
    const lossColor = lossVal > 0 ? '#ff3250' : '#4ade80'
    html += `<div style="display:flex;justify-content:space-between;gap:16px;margin-top:4px;padding-top:4px;border-top:1px solid ${dividerColor}">`
    html += `<span style="color:${labelColor}">Loss</span>`
    html += `<span style="color:${lossColor};font-family:'JetBrains Mono',monospace;font-weight:500">${lossVal.toFixed(1)}%</span>`
    html += `</div>`

    html += `</div>`
    return html
  }
}
