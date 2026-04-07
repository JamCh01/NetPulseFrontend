import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDashboardStats } from '@/api/hooks/use-dashboard'
import { useTasks } from '@/api/hooks/use-tasks'
import { useMonitoringData } from '@/api/hooks/use-monitoring'
import { StatsCards } from '../components/stats-cards'
import { HealthCard } from '../components/health-card'
import { MiniSmokePingChart } from '../components/mini-smokeping-chart'
import { TimeRangeSelector } from '@/features/monitoring/components/time-range-selector'
import type { DashboardStats } from '@/api/types'
import type { TaskResponse, PaginatedResponseTaskResponse } from '@/api/generated/types.gen'

const INITIAL_DURATION_MS = 24 * 60 * 60 * 1000

function MiniChartWithData({ task, timeRange }: { task: TaskResponse, timeRange: { start: number, end: number, granularity: 'raw' | 'hourly' | 'daily' } }) {
  const { data: monitoringData, isLoading } = useMonitoringData(
    task.task_uuid,
    undefined,
    timeRange,
  )

  return (
    <MiniSmokePingChart
      taskUuid={task.task_uuid}
      taskName={task.task_name}
      protocol={task.protocol}
      target={task.target}
      data={monitoringData?.data}
      isLoading={isLoading}
    />
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { data: statsRaw, isLoading: statsLoading } = useDashboardStats()
  const { data: tasksRaw, isLoading: tasksLoading } = useTasks({ is_active: true, limit: 200 })

  const [now] = useState(() => Date.now())
  const [timeRange, setTimeRange] = useState<{ start: number; end: number; granularity: 'raw' | 'hourly' | 'daily' }>({
    start: now - INITIAL_DURATION_MS,
    end: now,
    granularity: 'raw',
  })

  const handleTimeRangeChange = useCallback(
    (range: { start: number; end: number; granularity: 'raw' | 'hourly' | 'daily' }) => {
      setTimeRange(range)
    },
    [],
  )

  // Cast dashboard stats which comes as generic object
  const stats = statsRaw as DashboardStats | undefined
  const tasks = ((tasksRaw as PaginatedResponseTaskResponse)?.items ?? []) as TaskResponse[]

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t('dashboard.title')}</h1>
        <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
      </div>

      {/* Stats cards */}
      <div className="mb-6">
        <StatsCards stats={stats} isLoading={statsLoading} />
      </div>

      {/* Health card */}
      <div className="mb-6">
        <HealthCard />
      </div>

      {/* Mini chart grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tasksLoading ? (
          Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="glass-light rounded-xl p-3 h-[140px] animate-pulse" />
          ))
        ) : tasks.length === 0 ? (
          <div className="col-span-full glass-light rounded-xl p-8 text-center">
            <p className="text-text-muted text-sm">{t('dashboard.noActiveTasks')}</p>
            <p className="text-text-dim text-xs mt-1">{t('dashboard.createTaskHint')}</p>
          </div>
        ) : (
          tasks.map((task) => (
            <MiniChartWithData key={task.task_uuid} task={task} timeRange={timeRange} />
          ))
        )}
      </div>
    </div>
  )
}
