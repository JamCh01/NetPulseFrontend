import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Clock3, MapPin, Radio, Waypoints } from 'lucide-react'
import { useMonitoringTaskDetail } from '@/api/hooks/use-monitoring-task-detail'
import { useMtrDetail, useMtrList } from '@/api/hooks/use-mtr'
import { MtrDetailTable } from '@/features/monitoring/components/mtr/mtr-detail-table'
import { MtrTimeline } from '@/features/monitoring/components/mtr/mtr-timeline'
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
} from '@/features/monitoring/lib/monitoring-models'
import {
  AUTO_REFRESH_INTERVAL_MS,
  createRelativeTimeRange,
  refreshRelativeTimeRange,
  type MonitoringTimeRange,
} from '@/features/monitoring/lib/time-range'

export default function MtrDetailPage() {
  const { t, i18n } = useTranslation()
  const { taskUuid } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const monitoringBasePath = location.pathname.startsWith('/app/monitoring') ? '/app/monitoring' : '/monitoring'
  const { data: detailData, isLoading: taskLoading, error: taskError } = useMonitoringTaskDetail(taskUuid ?? '')
  const task = detailData?.task
  const taskAgents = detailData?.taskAgents ?? []

  const [selectedAgentUuid, setSelectedAgentUuid] = useState<string>('')
  const [selectedResultUuid, setSelectedResultUuid] = useState<string | undefined>()
  const [timeRange, setTimeRange] = useState<MonitoringTimeRange>(() => createRelativeTimeRange())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeRange((current) => refreshRelativeTimeRange(current))
    }, AUTO_REFRESH_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [])

  const { data: mtrListData, isLoading: mtrListLoading, error: mtrListError } = useMtrList(
    taskUuid ?? '',
    selectedAgentUuid || undefined,
    { start: timeRange.start, end: timeRange.end },
  )
  const activeResultUuid = useMemo(() => {
    if (selectedResultUuid) return selectedResultUuid
    return mtrListData?.results[0]?.result_uuid
  }, [mtrListData?.results, selectedResultUuid])
  const { data: mtrDetailData, isLoading: mtrDetailLoading } = useMtrDetail(activeResultUuid ?? '')

  const handleSelectResult = useCallback((resultUuid: string) => {
    setSelectedResultUuid(resultUuid)
  }, [])

  if (taskLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (taskError || !task) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-8 text-center">
        <div className="text-sm font-medium text-text-primary">{t('monitoring.mtrTaskMissing')}</div>
        <Button variant="outline" className="mt-4" onClick={() => navigate(monitoringBasePath)}>
          {t('monitoring.backToTargets')}
        </Button>
      </div>
    )
  }

  const status = classifyTaskStatus(task)
  const reachedCount = mtrListData?.results.filter((result) => result.target_reached).length ?? 0
  const failedCount = (mtrListData?.results.length ?? 0) - reachedCount

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
                <Badge className={`border text-xs uppercase ${PROTOCOL_COLORS.mtr}`}>MTR</Badge>
                <Badge variant={status === 'ok' ? 'success' : status === 'failed' ? 'error' : 'warning'}>
                  {status === 'ok' ? t('monitoring.statusOk') : status === 'failed' ? t('monitoring.statusFailed') : t('monitoring.statusNoData')}
                </Badge>
                {task.target.is_anycast && <Badge variant="info">Anycast</Badge>}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                <span className="font-mono text-text-secondary">{task.target.target}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{formatTargetLocation(task.target, t('monitoring.locationUnknown'))}</span>
                <span className="inline-flex items-center gap-1"><Radio className="h-3.5 w-3.5" />{task.agent?.name ?? t('monitoring.agentUnassigned')}</span>
                <span>{formatAgentLocation(task.agent, t('monitoring.locationUnknown'), t('monitoring.agentNotBound'))}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link to={`${monitoringBasePath}/${task.task_uuid}`}>
                <Button variant="outline">{t('common.details')}</Button>
              </Link>
              {isAdmin && (
                <Button onClick={() => navigate(`/tasks/${task.task_uuid}`)}>
                  {t('monitoring.manageTask')}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-4 md:grid-cols-4">
          <Summary label={t('common.latestSample')} value={formatLatestSample(task.latest_result.latest_sample_at, i18n.language, t('monitoring.noSample'))} icon={Clock3} />
          <Summary label="Result" value={String(mtrListData?.results.length ?? 0)} icon={Waypoints} />
          <Summary label={t('monitoring.reachedTarget')} value={String(reachedCount)} icon={Waypoints} />
          <Summary label={t('monitoring.unreached')} value={String(failedCount)} icon={Waypoints} tone={failedCount > 0 ? 'text-status-error-fg' : 'text-status-success-fg'} />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-surface p-3 lg:flex-row lg:items-center lg:justify-between">
        <TimeRangeSelector value={timeRange} onChange={(range) => {
          setTimeRange(range)
          setSelectedResultUuid(undefined)
        }} />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={!selectedAgentUuid ? 'default' : 'outline'}
            onClick={() => {
              setSelectedAgentUuid('')
              setSelectedResultUuid(undefined)
            }}
          >
            {t('monitoring.allAgents')}
          </Button>
          {taskAgents.map((agent) => (
            <Button
              key={agent.agent_uuid}
              size="sm"
              variant={selectedAgentUuid === agent.agent_uuid ? 'default' : 'outline'}
              onClick={() => {
                setSelectedAgentUuid(agent.agent_uuid)
                setSelectedResultUuid(undefined)
              }}
            >
              {agent.agent_name}
            </Button>
          ))}
        </div>
      </div>

      {mtrListError ? (
        <div className="rounded-xl border border-status-error-border bg-status-error-bg p-4 text-sm text-status-error-fg">
          {t('monitoring.mtrDataLoadFailed', { message: (mtrListError as Error).message })}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-bg-surface p-3">
          <MtrTimeline
            results={mtrListData?.results ?? []}
            isLoading={mtrListLoading}
            onSelectResult={handleSelectResult}
            selectedResultUuid={activeResultUuid}
            height={220}
          />
        </div>
      )}

      <MtrDetailTable result={activeResultUuid ? mtrDetailData : undefined} isLoading={activeResultUuid ? mtrDetailLoading : false} />
    </div>
  )
}

function Summary({ label, value, icon: Icon, tone }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg-surface-light px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] uppercase text-text-dim">{label}</div>
        <Icon className={`h-3.5 w-3.5 ${tone ?? 'text-text-muted'}`} />
      </div>
      <div className={`mt-1 font-mono text-sm font-semibold ${tone ?? 'text-text-primary'}`}>{value}</div>
    </div>
  )
}
