import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ReactECharts from 'echarts-for-react'
import { useNavigate } from 'react-router'
import type { MonitoringDataPoint } from '@/api/generated/types.gen'
import { useChartTheme } from '@/features/monitoring/lib/chart-theme'
import { transformToChartData } from '@/features/monitoring/lib/transform-chart-data'

interface MiniSmokePingChartProps {
  taskUuid: string
  taskName: string
  protocol?: string | null
  target: string
  data?: MonitoringDataPoint[]
  isLoading?: boolean
}

const protocolColors: Record<string, { bg: string; text: string }> = {
  icmp: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  tcp: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  udp: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  http: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
}

function MiniSmokePingChartInner({
  taskUuid,
  taskName,
  protocol,
  target,
  data,
  isLoading,
}: MiniSmokePingChartProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const theme = useChartTheme()

  const option = useMemo(() => {
    if (!data || data.length === 0) return null

    const chartData = transformToChartData(data)
    // Find the last non-null median value
    let lastMedian: number | null = null
    for (let i = chartData.medianLine.length - 1; i >= 0; i--) {
      const val = chartData.medianLine[i]
      if (val !== null) {
        lastMedian = val
        break
      }
    }
    const lastLoss = data[data.length - 1]?.packet_loss_pct ?? 0

    return {
      option: {
        backgroundColor: 'transparent',
        animation: false,
        grid: { left: 0, right: 0, top: 4, bottom: 4, containLabel: false },
        xAxis: { type: 'time' as const, show: false },
        yAxis: { type: 'value' as const, show: false, min: 0 },
        series: [
          // Min-max band
          {
            type: 'line',
            stack: 'mini-band',
            symbol: 'none',
            lineStyle: { opacity: 0 },
            areaStyle: { opacity: 0 },
            data: chartData.timestamps.map((ts, i) => {
              const val = chartData.bands.minToAvg.lower[i]
              return val === null ? [ts, null] : [ts, val]
            }),
            silent: true,
            connectNulls: false,
          },
          {
            type: 'line',
            stack: 'mini-band',
            symbol: 'none',
            lineStyle: { opacity: 0 },
            areaStyle: { color: theme.bandColors[3] },
            data: chartData.timestamps.map((ts, i) => {
              const min = chartData.bands.minToAvg.lower[i]
              const p99 = chartData.bands.p99ToMax.lower[i]
              const delta = chartData.bands.p99ToMax.delta[i]
              if (min === null || p99 === null || delta === null) {
                return [ts, null]
              }
              const maxVal = p99 + delta
              return [ts, Math.max(0, maxVal - min)]
            }),
            silent: true,
            connectNulls: false,
          },
          // Median line
          {
            type: 'line',
            smooth: false,
            step: false,
            symbol: 'none',
            lineStyle: { color: theme.medianColor, width: 1.5 },
            data: chartData.timestamps.map((ts, i) => {
              const val = chartData.medianLine[i]
              return val === null ? [ts, null] : [ts, val]
            }),
            silent: true,
            connectNulls: false,
          },
        ],
      },
      lastMedian,
      lastLoss,
    }
  }, [data, theme])

  const normalizedProtocol = (protocol ?? 'icmp').toLowerCase()
  const proto = protocolColors[normalizedProtocol] ?? protocolColors.icmp
  const protocolLabel = normalizedProtocol.toUpperCase()

  if (isLoading) {
    return (
      <div className="glass-light rounded-xl p-3 h-[140px] animate-pulse" />
    )
  }

  return (
    <div
      className="glass-light rounded-xl p-3 cursor-pointer hover:border-emerald-500/20 transition-colors"
      onClick={() => navigate(`/monitoring/${taskUuid}`)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium text-text-primary truncate">{taskName}</span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${proto.bg} ${proto.text}`}>
          {protocolLabel}
        </span>
      </div>

      {option ? (
        <>
          <ReactECharts
            option={option.option}
            style={{ height: 56, width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-[9px] text-text-dim font-mono">
              {option.lastMedian?.toFixed(1)}ms
            </span>
            <span className={`text-[9px] font-mono ${option.lastLoss > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {option.lastLoss.toFixed(1)}%
            </span>
          </div>
        </>
      ) : (
        <div className="h-[72px] flex items-center justify-center">
          <span className="text-[10px] text-text-dim">{t('common.noData')}</span>
        </div>
      )}

      <div className="text-[9px] text-text-dim mt-0.5 truncate">{target}</div>
    </div>
  )
}

export const MiniSmokePingChart = memo(MiniSmokePingChartInner)
MiniSmokePingChart.displayName = 'MiniSmokePingChart'
