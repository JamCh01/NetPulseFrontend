import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LazyECharts } from '@/components/charts/lazy-echarts'
import { useChartTheme } from '../../lib/chart-theme'
import { buildMultiAgentOption, type AgentSeriesData } from '../../lib/build-multi-agent-option'
import { Skeleton } from '@/components/ui/skeleton'

type ChartStyle = 'basic' | 'smoke'

export interface MultiAgentChartProps {
  agentSeries: AgentSeriesData[]
  isLoading?: boolean
  error?: Error | null
  height?: number
  chartStyle?: ChartStyle
}

function MultiAgentChartInner({
  agentSeries,
  isLoading = false,
  error = null,
  height = 400,
  chartStyle = 'smoke',
}: MultiAgentChartProps) {
  const { t } = useTranslation()
  const theme = useChartTheme()

  const option = useMemo(
    () => buildMultiAgentOption(agentSeries, theme, chartStyle),
    [agentSeries, theme, chartStyle],
  )

  if (isLoading) {
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

  if (error) {
    return (
      <div className="glass-light rounded-xl p-6 flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <p className="text-status-disabled text-sm font-medium mb-1">{t('monitoring.failedToLoad')}</p>
          <p className="text-text-muted text-xs">{error.message}</p>
        </div>
      </div>
    )
  }

  const hasData = agentSeries.some((s) => s.data.length > 0)
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
    <div className="glass-light rounded-xl p-4">
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
