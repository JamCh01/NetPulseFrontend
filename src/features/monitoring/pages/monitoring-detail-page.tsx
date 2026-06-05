import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type TFunction } from 'i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Download, Radio, Server, Signal, Waypoints } from 'lucide-react'
import { useMonitoringData, useMultiAgentMonitoringData } from '@/api/hooks/use-monitoring'
import { useMonitoringTaskDetail } from '@/api/hooks/use-monitoring-task-detail'
import { SmokePingChart } from '@/features/monitoring/components/charts/smokeping-chart'
import { MultiAgentChart } from '@/features/monitoring/components/charts/multi-agent-chart'
import { MetricDetailTable } from '@/features/monitoring/components/charts/metric-detail-table'
import { TimeRangeSelector } from '@/features/monitoring/components/time-range/time-range-selector'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PROTOCOL_COLORS } from '@/lib/constants'
import { useAuthStore } from '@/stores/auth-store'
import {
  classifyTaskStatus,
  formatAgentLocation,
  formatLatestSample,
  formatTargetLocation,
  protocolLabel,
  type LatestResultState,
} from '@/features/monitoring/lib/monitoring-models'
import {
  AUTO_REFRESH_INTERVAL_MS,
  createRelativeTimeRange,
  refreshRelativeTimeRange,
  type MonitoringTimeRange,
} from '@/features/monitoring/lib/time-range'
import type { MonitoringDataPoint } from '@/features/monitoring/lib/monitoring-data-point'

type ChartStyle = 'basic' | 'smoke'

type StatusUi = { label: string; variant: 'success' | 'warning' | 'error' | 'inactive' }

function statusCopy(t: TFunction<'translation'>): Record<LatestResultState, StatusUi> {
  return {
    ok: { label: t('monitoring.statusOk'), variant: 'success' },
    missing: { label: t('monitoring.statusNoData'), variant: 'warning' },
    failed: { label: t('monitoring.statusFailed'), variant: 'error' },
    unknown: { label: t('monitoring.statusUnknown'), variant: 'inactive' },
  }
}

function computeStats(data: MonitoringDataPoint[]) {
  if (data.length === 0) return null
  const sum = data.reduce(
    (acc, point) => {
      acc.avg += point.avg_rtt
      acc.loss += point.packet_loss_pct
      acc.min = Math.min(acc.min, point.min_rtt)
      acc.max = Math.max(acc.max, point.max_rtt)
      acc.p95 += point.p95_rtt
      return acc
    },
    { avg: 0, loss: 0, min: Infinity, max: -Infinity, p95: 0 },
  )
  return {
    avg: sum.avg / data.length,
    loss: sum.loss / data.length,
    min: sum.min,
    max: sum.max,
    p95: sum.p95 / data.length,
    points: data.length,
  }
}

function StatItem({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg-surface-light px-3 py-2">
      <div className="text-[10px] uppercase text-text-dim">{label}</div>
      <div className={`mt-1 font-mono text-sm font-semibold ${tone ?? 'text-text-primary'}`}>{value}</div>
    </div>
  )
}

export default function MonitoringDetailPage() {
  const { t, i18n } = useTranslation()
  const { taskUuid } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const monitoringBasePath = location.pathname.startsWith('/app/monitoring') ? '/app/monitoring' : '/monitoring'
  const { data: detailData, isLoading: taskLoading, error: taskError } = useMonitoringTaskDetail(taskUuid ?? '')
  const task = detailData?.task
  const taskAgents = useMemo(() => detailData?.taskAgents ?? [], [detailData?.taskAgents])

  const [selectedAgentUuid, setSelectedAgentUuid] = useState<string>('')
  const [chartStyle, setChartStyle] = useState<ChartStyle>('smoke')
  const [timeRange, setTimeRange] = useState<MonitoringTimeRange>(() => createRelativeTimeRange())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeRange((current) => refreshRelativeTimeRange(current))
    }, AUTO_REFRESH_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [])

  const isMtr = task?.task_type === 'mtr'
  const isAllAgents = !selectedAgentUuid
  const protocol = task?.task_type === 'tcp' ? 'tcp' : 'icmp'

  const {
    data: singleMonitoringData,
    isLoading: singleLoading,
    isFetching: singleFetching,
    error: singleError,
  } = useMonitoringData(isMtr ? '' : (taskUuid ?? ''), selectedAgentUuid || undefined, {
    start: timeRange.start,
    end: timeRange.end,
  }, protocol)

  const {
    agentSeries,
    isLoading: multiLoading,
    isUpdating: multiUpdating,
    error: multiError,
  } = useMultiAgentMonitoringData(
    !isMtr && isAllAgents ? (taskUuid ?? '') : '',
    isAllAgents ? taskAgents : [],
    { start: timeRange.start, end: timeRange.end },
    protocol,
  )

  const stats = useMemo(() => {
    if (isAllAgents) {
      const all = agentSeries.flatMap((series) => series.data)
      return computeStats(all)
    }
    return computeStats(singleMonitoringData?.data ?? [])
  }, [agentSeries, isAllAgents, singleMonitoringData?.data])

  const handleExportCsv = useCallback(() => {
    if (!task || isMtr) return
    const rows = isAllAgents
      ? agentSeries.flatMap((series) => series.data.map((point) => ({ point, agent: series.agentName })))
      : (singleMonitoringData?.data ?? []).map((point) => ({ point, agent: task.agent?.name ?? 'Unknown' }))

    const csv = [
      'Timestamp,Agent,Avg (ms),Min (ms),Max (ms),P95 (ms),Loss (%)',
      ...rows.map(({ point, agent }) => [
        point.timestamp,
        `"${agent}"`,
        point.avg_rtt.toFixed(2),
        point.min_rtt.toFixed(2),
        point.max_rtt.toFixed(2),
        point.p95_rtt.toFixed(2),
        point.packet_loss_pct.toFixed(2),
      ].join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `netpulse_${task.name}_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }, [agentSeries, isAllAgents, isMtr, singleMonitoringData?.data, task])

  if (taskLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (taskError || !task) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-8 text-center">
        <div className="text-sm font-medium text-text-primary">{t('monitoring.taskMissing')}</div>
        <Button variant="outline" className="mt-4" onClick={() => navigate(monitoringBasePath)}>
          {t('monitoring.backToTargets')}
        </Button>
      </div>
    )
  }

  const status = statusCopy(t)[classifyTaskStatus(task)]
  const port = typeof task.probe_config?.port === 'number' ? `:${task.probe_config.port}` : ''
  const selectedAgentName = taskAgents.find((agent) => agent.agent_uuid === selectedAgentUuid)?.agent_name ?? task.agent?.name ?? 'Unknown'
  const detailAgentSeries = isAllAgents
    ? agentSeries
    : [{
      agentUuid: selectedAgentUuid || task.agent?.agent_uuid || task.task_uuid,
      agentName: selectedAgentName,
      data: singleMonitoringData?.data ?? [],
    }]

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-bg-surface">
        <div className="border-b border-border px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => navigate(monitoringBasePath)}
                className="mb-2 inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t('monitoring.backToTargets')}
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold text-text-primary">{task.name}</h1>
                <Badge className={`border text-xs ${PROTOCOL_COLORS[task.task_type] ?? ''}`}>
                  {protocolLabel(task.task_type)}
                </Badge>
                <Badge variant={status.variant}>{status.label}</Badge>
                {task.target.is_anycast && <Badge variant="info">Anycast</Badge>}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                <span>{task.target.name}</span>
                {port && <span>{port}</span>}
                <span>{formatTargetLocation(task.target, t('monitoring.locationUnknown'))}</span>
                {task.target.carrier && <span>{task.target.carrier}</span>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!isMtr && (
                <Button variant="outline" onClick={handleExportCsv}>
                  <Download className="h-4 w-4" />
                  {t('monitoring.exportCsv')}
                </Button>
              )}
              <Link to={`${monitoringBasePath}/${task.task_uuid}/mtr`}>
                <Button variant={isMtr ? 'default' : 'outline'}>
                  <Waypoints className="h-4 w-4" />
                  {t('monitoring.mtrResults')}
                </Button>
              </Link>
              {isAdmin && (
                <Button onClick={() => navigate(`/tasks/${task.task_uuid}`)}>
                  {t('monitoring.manageTask')}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          <StatItem label="Agent" value={task.agent?.name ?? t('common.unassigned')} />
          <StatItem label={t('monitoring.agentLocation')} value={formatAgentLocation(task.agent, t('monitoring.locationUnknown'), t('monitoring.agentNotBound'))} />
          <StatItem label={t('common.latestSample')} value={formatLatestSample(task.latest_result.latest_sample_at, i18n.language, t('monitoring.noSample'))} />
          <StatItem label={t('monitoring.runStatus')} value={task.latest_result.latest_run_status ?? t('monitoring.notAvailable')} tone={status.variant === 'success' ? 'text-status-success-fg' : undefined} />
        </div>
      </div>

      {isMtr ? (
        <div className="rounded-xl border border-status-info-border bg-status-info-bg p-5">
          <div className="flex items-start gap-3">
            <Waypoints className="mt-0.5 h-5 w-5 text-status-info-fg" />
            <div>
              <div className="text-sm font-medium text-status-info-fg">{t('monitoring.mtrNoMetricsTitle')}</div>
              <p className="mt-1 text-xs text-status-info-fg/80">
                {t('monitoring.mtrNoMetricsDesc')}
              </p>
              <Link to={`${monitoringBasePath}/${task.task_uuid}/mtr`}>
                <Button className="mt-3" size="sm">{t('monitoring.viewMtrEvidence')}</Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-surface p-3 lg:flex-row lg:items-center lg:justify-between">
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={!selectedAgentUuid ? 'default' : 'outline'}
                onClick={() => setSelectedAgentUuid('')}
              >
                {t('monitoring.allAgents')}
              </Button>
              {taskAgents.map((agent) => (
                <Button
                  key={agent.agent_uuid}
                  size="sm"
                  variant={selectedAgentUuid === agent.agent_uuid ? 'default' : 'outline'}
                  onClick={() => setSelectedAgentUuid(agent.agent_uuid)}
                >
                  <Radio className="h-3.5 w-3.5" />
                  {agent.agent_name}
                </Button>
              ))}
              <Button
                size="sm"
                variant={chartStyle === 'smoke' ? 'default' : 'outline'}
                onClick={() => setChartStyle(chartStyle === 'smoke' ? 'basic' : 'smoke')}
              >
                <Signal className="h-3.5 w-3.5" />
                {chartStyle === 'smoke' ? 'Smoke' : 'Basic'}
              </Button>
            </div>
          </div>

          {isAllAgents ? (
            <MultiAgentChart agentSeries={agentSeries} isLoading={multiLoading} isUpdating={multiUpdating} error={multiError} height={420} chartStyle={chartStyle} protocol={protocol} />
          ) : (
            <SmokePingChart
              data={singleMonitoringData?.data}
              isLoading={singleLoading}
              isUpdating={singleFetching && !singleLoading}
              error={singleError as Error | null}
              agentName={selectedAgentName}
              height={420}
              chartStyle={chartStyle}
              protocol={protocol}
            />
          )}

          <MetricDetailTable
            protocol={protocol}
            agentSeries={detailAgentSeries}
            isLoading={isAllAgents ? multiLoading : singleLoading}
            isUpdating={isAllAgents ? multiUpdating : singleFetching && !singleLoading}
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatItem label={t('monitoring.averageLatency')} value={stats ? `${stats.avg.toFixed(1)}ms` : '-'} />
            <StatItem label="P95" value={stats ? `${stats.p95.toFixed(1)}ms` : '-'} />
            <StatItem label={t('monitoring.minMax')} value={stats ? `${stats.min.toFixed(1)} / ${stats.max.toFixed(1)}ms` : '-'} />
            <StatItem label={t('monitoring.packetLoss')} value={stats ? `${stats.loss.toFixed(1)}%` : '-'} tone={stats && stats.loss > 0 ? 'text-status-error-fg' : 'text-status-success-fg'} />
            <StatItem label={t('monitoring.samplePoints')} value={stats ? String(stats.points) : '-'} />
          </div>

          <section className="rounded-xl border border-border bg-bg-surface p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Server className="h-4 w-4 text-text-muted" />
              {t('monitoring.metricSource')}
            </div>
            <div className="grid gap-3 text-xs text-text-muted md:grid-cols-3">
              <div className="rounded-lg border border-border bg-bg-surface-light p-3">
                ICMP: latency_avg_ms、packet_loss_pct、jitter_ms。
              </div>
              <div className="rounded-lg border border-border bg-bg-surface-light p-3">
                TCP: connect_latency_avg_ms、connect_failure_pct、jitter_ms。
              </div>
              <div className="rounded-lg border border-border bg-bg-surface-light p-3">
                {t('monitoring.vmStepSource')}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
