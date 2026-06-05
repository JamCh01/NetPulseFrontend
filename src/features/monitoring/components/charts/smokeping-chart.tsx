import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { MonitoringDataPoint } from '@/features/monitoring/lib/monitoring-data-point'
import { LazyECharts } from '@/components/charts/lazy-echarts'
import { transformToChartData } from '../../lib/transform-chart-data'
import { useChartTheme } from '../../lib/chart-theme'
import { buildSmokePingOption } from '../../lib/build-chart-option'
import { Skeleton } from '@/components/ui/skeleton'
import type { MonitoringMetricProtocol } from '../../lib/monitoring-data-point'

type ChartStyle = 'basic' | 'smoke'

export interface SmokePingChartProps {
  data?: MonitoringDataPoint[]
  isLoading?: boolean
  error?: Error | null
  isUpdating?: boolean
  agentName?: string
  height?: number
  chartStyle?: ChartStyle
  protocol?: MonitoringMetricProtocol
}

function SmokePingChartInner({
  height = 320,
  data,
  isLoading = false,
  error = null,
  isUpdating = false,
  agentName,
  chartStyle = 'smoke',
  protocol,
}: SmokePingChartProps) {
  const { t } = useTranslation()
  const theme = useChartTheme()

  const chartOption = useMemo(() => {
    if (!data || data.length === 0) return null
    const bandData = transformToChartData(data)
    return buildSmokePingOption({ data: bandData, theme, agentName, rawPoints: data, chartStyle, protocol })
  }, [data, theme, agentName, chartStyle, protocol])

  const hasData = Boolean(data?.length)

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
      <div
        className="glass-light rounded-xl p-6 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <p className="text-status-disabled text-sm font-medium mb-1">
            {t('monitoring.failedToLoad')}
          </p>
          <p className="text-text-muted text-xs">{error.message}</p>
        </div>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div
        className="glass-light rounded-xl p-6 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <p className="text-text-muted text-sm">{t('monitoring.noDataAvailable')}</p>
          <p className="text-text-dim text-xs mt-1">
            {t('monitoring.noDataHint')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-light relative rounded-xl p-4">
      {(isUpdating || error) && (
        <div className="absolute right-5 top-5 z-10 rounded border border-border bg-bg-surface/90 px-2 py-1 text-[10px] font-medium text-text-muted shadow-sm">
          {error ? t('monitoring.failedToLoad') : 'Updating'}
        </div>
      )}
      <LazyECharts
        option={chartOption!}
        style={{ height, width: '100%' }}
        notMerge={false}
        lazyUpdate
      />
    </div>
  )
}

export const SmokePingChart = memo(SmokePingChartInner)
SmokePingChart.displayName = 'SmokePingChart'
