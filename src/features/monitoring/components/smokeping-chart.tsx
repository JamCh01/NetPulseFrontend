import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ReactECharts from 'echarts-for-react'
import type { MonitoringDataPoint } from '@/api/generated/types.gen'
import { transformToChartData } from '../lib/transform-chart-data'
import { useChartTheme } from '../lib/chart-theme'
import { buildSmokePingOption } from '../lib/build-chart-option'
import { Skeleton } from '@/components/ui/skeleton'

export interface SmokePingChartProps {
  data?: MonitoringDataPoint[]
  isLoading?: boolean
  error?: Error | null
  agentName?: string
  height?: number
}

function SmokePingChartInner({
  height = 320,
  data,
  isLoading = false,
  error = null,
  agentName,
}: SmokePingChartProps) {
  const { t } = useTranslation()
  const theme = useChartTheme()

  const chartOption = useMemo(() => {
    if (!data || data.length === 0) return null
    const bandData = transformToChartData(data)
    return buildSmokePingOption({ data: bandData, theme, agentName, rawPoints: data })
  }, [data, theme, agentName])

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

  if (!data || data.length === 0) {
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
    <div className="glass-light rounded-xl p-4">
      <ReactECharts
        option={chartOption!}
        style={{ height, width: '100%' }}
        notMerge={false}
        lazyUpdate
        opts={{ renderer: 'canvas' }}
      />
    </div>
  )
}

export const SmokePingChart = memo(SmokePingChartInner)
SmokePingChart.displayName = 'SmokePingChart'
