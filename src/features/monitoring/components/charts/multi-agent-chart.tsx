import { memo, useId, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LazyECharts } from '@/components/charts/lazy-echarts'
import { useChartTheme } from '../../lib/chart-theme'
import { buildMultiAgentOption, type AgentSeriesData } from '../../lib/build-multi-agent-option'
import { Skeleton } from '@/components/ui/skeleton'
import { useStableSnapshot } from '@/hooks/use-stable-snapshot'
import type { MonitoringMetricProtocol } from '../../lib/monitoring-data-point'

type ChartStyle = 'basic' | 'smoke'

export interface MultiAgentChartProps {
  agentSeries: AgentSeriesData[]
  isLoading?: boolean
  error?: Error | null
  isUpdating?: boolean
  height?: number
  chartStyle?: ChartStyle
  protocol?: MonitoringMetricProtocol
}

function MultiAgentChartInner({
  agentSeries,
  isLoading = false,
  error = null,
  isUpdating = false,
  height = 400,
  chartStyle = 'smoke',
  protocol,
}: MultiAgentChartProps) {
  const { t } = useTranslation()
  const theme = useChartTheme()
  const hasIncomingData = agentSeries.some((s) => s.data.length > 0)
  const stableScope = useId()
  const snapshotScope = `multi-agent:${protocol ?? 'auto'}:${chartStyle}:${stableScope}`
  const displaySeries = useStableSnapshot({
    scope: snapshotScope,
    value: agentSeries,
    hasValue: hasIncomingData,
    isUpdating: isLoading || isUpdating,
  })

  const option = useMemo(
    () => buildMultiAgentOption(displaySeries, theme, chartStyle, protocol),
    [displaySeries, theme, chartStyle, protocol],
  )

  const hasData = displaySeries.some((s) => s.data.length > 0)

  if (isLoading && !hasData) {
    return (
      <div className="glass-light rounded-xl p-6" style={{ height }}>
        <div className="flex flex-col gap-3 h-full justify-center">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-full w-full rounded-lg" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    )
  }

  if (error && !hasData) {
    return (
      <div className="glass-light rounded-xl p-6 flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <p className="text-status-disabled text-sm font-medium mb-1">{t('monitoring.failedToLoad')}</p>
          <p className="text-text-muted text-xs">{error.message}</p>
        </div>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="glass-light rounded-xl p-6 flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <p className="text-text-muted text-sm">{t('monitoring.noDataAvailable')}</p>
          <p className="text-text-dim text-xs mt-1">{t('monitoring.noDataHintMulti')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-light relative rounded-xl p-4">
      {error && (
        <div className="absolute right-5 top-5 z-10 rounded border border-border bg-bg-surface/90 px-2 py-1 text-[10px] font-medium text-text-muted shadow-sm">
          {t('monitoring.failedToLoad')}
        </div>
      )}
      <LazyECharts
        option={option}
        style={{ height, width: '100%' }}
        notMerge={false}
        lazyUpdate
      />
    </div>
  )
}

export const MultiAgentChart = memo(MultiAgentChartInner)
MultiAgentChart.displayName = 'MultiAgentChart'
