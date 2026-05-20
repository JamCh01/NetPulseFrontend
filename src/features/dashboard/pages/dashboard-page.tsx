import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useDashboardStats } from '@/api/hooks/use-dashboard'
import { useTasks } from '@/api/hooks/use-tasks'
import { useMonitoringData } from '@/api/hooks/use-monitoring'
import { useAlertEvents } from '@/api/hooks/use-alert-events'
import { StatsCards } from '../components/stats-cards'
import { HealthCard } from '../components/health-card'
import { MiniSmokePingChart } from '../components/mini-smokeping-chart'
import { TimeRangeSelector } from '@/features/monitoring/components/time-range-selector'
import { Badge } from '@/components/ui/badge'
import type { DashboardStats } from '@/api/types'
import type { AlertEventResponse, TaskResponse, PaginatedResponseTaskResponse } from '@/api/generated/types.gen'
import { Activity, AlertTriangle, ArrowRight, BellRing, CheckCircle2, Clock3, Radar } from 'lucide-react'

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
  const { data: alertEventsRaw, isLoading: eventsLoading } = useAlertEvents({ limit: 50 })

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
  const statsApiUnsupported = Boolean((statsRaw as { __unsupported?: boolean } | undefined)?.__unsupported)
  const eventsApiUnsupported = Boolean((alertEventsRaw as { __unsupported?: boolean } | undefined)?.__unsupported)
  const tasks = ((tasksRaw as PaginatedResponseTaskResponse)?.items ?? []) as TaskResponse[]
  const alertEvents = ((alertEventsRaw as { items?: AlertEventResponse[] })?.items ?? []) as AlertEventResponse[]

  const firingEvents = alertEvents.filter((event) => event.status === 'firing')
  const tasksWithFiring = new Set(firingEvents.map((event) => event.task_uuid))
  const anomalyTasks = tasks.filter((task) => tasksWithFiring.has(task.task_uuid))
  const recentEvents = alertEvents
    .slice()
    .sort((a, b) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime())
    .slice(0, 6)
  const priorityTasks = anomalyTasks.length > 0 ? anomalyTasks : tasks.slice(0, 6)
  const overallStatus = firingEvents.length > 0 ? 'incident' : 'healthy'

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t('dashboard.title')}</h1>
        <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
      </div>
      {statsApiUnsupported && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          Missing API: <code>/api/v1/dashboard/stats</code>
        </div>
      )}
      {eventsApiUnsupported && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          Missing API: <code>/api/v1/alerts/events/</code>
        </div>
      )}

      <div className="glass rounded-xl p-4 md:p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            {overallStatus === 'incident' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            )}
            <h2 className="text-sm font-semibold text-text-primary">
              {overallStatus === 'incident' ? 'Active Attention Needed' : 'Network Looks Healthy'}
            </h2>
          </div>
          <Badge className={`border text-xs ${
            overallStatus === 'incident'
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              : 'bg-green-500/15 text-green-300 border-green-500/30'
          }`}>
            {overallStatus === 'incident' ? 'Incident Mode' : 'Healthy Mode'}
          </Badge>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="glass-light rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-1">
              <BellRing className="w-3 h-3" />
              Active Alerts
            </div>
            <div className="text-lg font-semibold text-text-primary font-mono">{firingEvents.length}</div>
          </div>
          <div className="glass-light rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-1">
              <Radar className="w-3 h-3" />
              Affected Tasks
            </div>
            <div className="text-lg font-semibold text-text-primary font-mono">{tasksWithFiring.size}</div>
          </div>
          <div className="glass-light rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-1">
              <Activity className="w-3 h-3" />
              Active Tasks
            </div>
            <div className="text-lg font-semibold text-text-primary font-mono">{stats?.tasks.active ?? '--'}</div>
          </div>
          <div className="glass-light rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-1">
              <Clock3 className="w-3 h-3" />
              Recent Events
            </div>
            <div className="text-lg font-semibold text-text-primary font-mono">{alertEvents.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 mb-6">
        <div className="glass-light rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">
              {anomalyTasks.length > 0 ? 'Anomaly Queue' : 'Priority Monitoring Queue'}
            </h3>
            <Link to="/monitoring" className="text-xs text-accent hover:text-accent-hover inline-flex items-center gap-1">
              Open Monitoring
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {tasksLoading ? (
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
                const hasFiring = tasksWithFiring.has(task.task_uuid)
                return (
                  <Link
                    key={task.task_uuid}
                    to={`/monitoring/${task.task_uuid}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-white/5 transition-colors border border-white/5"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-text-primary truncate">{task.task_name}</div>
                      <div className="text-xs text-text-dim truncate">{task.target}{task.port ? `:${task.port}` : ''}</div>
                    </div>
                    <Badge className={`border text-[11px] ${
                      hasFiring
                        ? 'bg-red-500/15 text-red-300 border-red-500/30'
                        : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                    }`}>
                      {hasFiring ? 'Investigate' : 'Watch'}
                    </Badge>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div className="glass-light rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Recent Incident Signals</h3>
          {eventsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="glass rounded-lg h-10 animate-pulse" />
              ))}
            </div>
          ) : recentEvents.length === 0 ? (
            <div className="text-xs text-text-muted">No recent alert events.</div>
          ) : (
            <div className="space-y-2">
              {recentEvents.map((event) => (
                <Link
                  key={event.event_uuid}
                  to={`/monitoring/${event.task_uuid}`}
                  className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 hover:bg-white/5 transition-colors border border-white/5"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-text-primary font-medium truncate">{event.task_uuid.slice(0, 8)}…</div>
                    <div className="text-[11px] text-text-dim truncate">{new Date(event.triggered_at).toLocaleString()}</div>
                  </div>
                  <Badge className={`border text-[10px] ${
                    event.status === 'firing'
                      ? 'bg-red-500/15 text-red-300 border-red-500/30'
                      : 'bg-green-500/15 text-green-300 border-green-500/30'
                  }`}>
                    {event.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Supporting context */}
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
