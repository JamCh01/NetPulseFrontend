import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useTasks } from '@/api/hooks/use-tasks'
import { useMonitoringData } from '@/api/hooks/use-monitoring'
import { HealthCard } from '../components/health-card'
import { MiniSmokePingChart } from '../components/mini-smokeping-chart'
import { TimeRangeSelector } from '@/features/monitoring/components/time-range-selector'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import type { TaskResponse, PaginatedResponseTaskResponse } from '@/api/generated/types.gen'
import { Activity, AlertTriangle, ArrowRight, BellRing, CheckCircle2, Clock3, Radar } from 'lucide-react'

const INITIAL_DURATION_MS = 24 * 60 * 60 * 1000

function formatTaskTarget(task: TaskResponse): string {
  const raw = task.target as unknown
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object') {
    const rec = raw as Record<string, unknown>
    if (typeof rec.target === 'string' && rec.target) return rec.target
    if (typeof rec.name === 'string' && rec.name) return rec.name
  }
  return 'unknown-target'
}

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
      target={formatTaskTarget(task)}
      basePath="/app/monitoring"
      data={monitoringData?.data}
      isLoading={isLoading}
    />
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { data: tasksRaw, isLoading: tasksLoading, error: tasksError, refetch: refetchTasks } = useTasks({ is_active: true, limit: 200 })

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

  const tasks = ((tasksRaw as PaginatedResponseTaskResponse)?.items ?? []) as TaskResponse[]
  const activeTasks = tasks.filter((task) => task.is_active)
  const tasksFailed = Boolean(tasksError)

  const priorityTasks = activeTasks.slice(0, 6)
  const overallStatus = tasksFailed ? 'incident' : 'healthy'

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t('dashboard.title')}</h1>
        <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
      </div>
      {tasksFailed && (
        <div className="mb-4 rounded-lg border border-status-warning-border bg-status-warning-bg px-3 py-3 text-xs text-status-warning-fg">
          <div className="mb-2 font-medium">任务数据加载失败，页面已降级展示。</div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 border-status-warning-border bg-transparent text-status-warning-fg hover:bg-status-warning-bg/85" onClick={() => { void refetchTasks() }}>
              重试任务服务
            </Button>
          </div>
        </div>
      )}

      <div className="glass rounded-xl p-4 md:p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            {overallStatus === 'incident' ? (
              <AlertTriangle className="w-4 h-4 text-status-warning-solid" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-status-success-solid" />
            )}
            <h2 className="text-sm font-semibold text-text-primary">
              {overallStatus === 'incident' ? 'Active Attention Needed' : 'Network Looks Healthy'}
            </h2>
          </div>
          <Badge variant={overallStatus === 'incident' ? 'warning' : 'success'}>
            {overallStatus === 'incident' ? 'Incident Mode' : 'Healthy Mode'}
          </Badge>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="glass-light rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-1">
              <BellRing className="w-3 h-3" />
              Active Alerts
            </div>
            <div className="text-lg font-semibold text-text-primary font-mono">--</div>
          </div>
          <div className="glass-light rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-1">
              <Radar className="w-3 h-3" />
              Affected Tasks
            </div>
            <div className="text-lg font-semibold text-text-primary font-mono">--</div>
          </div>
          <div className="glass-light rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-1">
              <Activity className="w-3 h-3" />
              Active Tasks
            </div>
            <div className="text-lg font-semibold text-text-primary font-mono">{activeTasks.length}</div>
          </div>
          <div className="glass-light rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-1">
              <Clock3 className="w-3 h-3" />
              Recent Events
            </div>
            <div className="text-lg font-semibold text-text-primary font-mono">--</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 mb-6">
        <div className="glass-light rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Priority Monitoring Queue</h3>
            <Link to="/app/monitoring" className="text-xs text-accent-foreground hover:text-accent-foreground/80 inline-flex items-center gap-1">
              Open Monitoring
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {tasksFailed ? (
            <ErrorState
              title="任务数据加载失败"
              description="无法生成优先队列，请重试任务服务。"
              onRetry={() => { void refetchTasks() }}
              retryLabel="重试任务服务"
              className="min-h-[180px]"
            />
          ) : tasksLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="glass rounded-lg h-12 animate-pulse" />
              ))}
            </div>
          ) : priorityTasks.length === 0 ? (
            <div className="text-xs text-text-muted">No active tasks available.</div>
          ) : (
            <div className="space-y-2">
              {priorityTasks.map((task) => {
                return (
                  <Link
                    key={task.task_uuid}
                    to={`/app/monitoring/${task.task_uuid}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-white/5 transition-colors border border-white/5"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-text-primary truncate">{task.task_name}</div>
                      <div className="text-xs text-text-dim truncate">{formatTaskTarget(task)}{task.port ? `:${task.port}` : ''}</div>
                    </div>
                    <Badge variant="info" className="text-[11px]">
                      Watch
                    </Badge>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div className="glass-light rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Recent Incident Signals</h3>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-text-muted">
            当前后端未部署 <code>/api/v1/alerts/events</code>，该区域暂不可用。
          </div>
        </div>
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

