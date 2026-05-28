import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type TFunction } from 'i18next'
import { Link } from 'react-router'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Crosshair,
  DatabaseZap,
  GitBranch,
  Globe2,
  MapPin,
  ShieldAlert,
  Signal,
} from 'lucide-react'
import { usePublicMonitoringTasks } from '@/api/hooks/use-public-monitoring-tasks'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MONITORING_PROTOCOLS, PROTOCOL_COLORS } from '@/lib/constants'
import {
  classifyTaskStatus,
  formatAgentLocation,
  formatLatestSample,
  formatTargetLocation,
  protocolLabel,
  type LatestResultState,
  type MonitoringTargetGroup,
  type MonitoringTask,
} from '@/features/monitoring/lib/monitoring-models'

type StatusUi = { label: string; variant: 'success' | 'warning' | 'error' | 'inactive'; tone: string }

function statusCopy(t: TFunction<'translation'>): Record<LatestResultState, StatusUi> {
  return {
    ok: { label: t('monitoring.statusOk'), variant: 'success', tone: 'text-status-success-fg' },
    missing: { label: t('monitoring.statusNoData'), variant: 'warning', tone: 'text-status-warning-fg' },
    failed: { label: t('monitoring.statusFailed'), variant: 'error', tone: 'text-status-error-fg' },
    unknown: { label: t('monitoring.statusUnknown'), variant: 'inactive', tone: 'text-status-inactive-fg' },
  }
}

function attentionWeight(task: MonitoringTask) {
  const status = classifyTaskStatus(task)
  if (status === 'failed') return 0
  if (status === 'missing') return 1
  if (status === 'unknown') return 2
  if (task.task_type === 'mtr') return 3
  if (task.task_type === 'iperf3') return 4
  return 5
}

function taskHref(task: MonitoringTask) {
  return task.task_type === 'mtr' ? `/app/monitoring/${task.task_uuid}/mtr` : `/app/monitoring/${task.task_uuid}`
}

function StatTile({ label, value, icon: Icon, tone }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg-surface px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-text-muted">{label}</span>
        <Icon className={`h-4 w-4 ${tone ?? 'text-accent-foreground'}`} />
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold text-text-primary">{value}</div>
    </div>
  )
}

function CoverageRow({ group, selected, onSelect, statusMap }: { group: MonitoringTargetGroup; selected: boolean; onSelect: () => void; statusMap: Record<LatestResultState, StatusUi> }) {
  const status = statusMap[group.status]
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
        selected ? 'border-accent-border bg-bg-card' : 'border-border bg-bg-surface-light hover:border-accent-border/80 hover:bg-bg-card/70'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-text-primary">{group.target.name}</div>
          <div className="mt-1 truncate text-xs text-text-muted">{group.target.target}</div>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {MONITORING_PROTOCOLS.map((protocol) => {
          const count = group.tasks.filter((task) => task.task_type === protocol).length
          return (
            <span
              key={protocol}
              className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                count > 0 ? PROTOCOL_COLORS[protocol] : 'border-border bg-muted/30 text-text-dim'
              }`}
            >
              {protocolLabel(protocol)} {count}
            </span>
          )
        })}
        <span className="rounded border border-border bg-muted/30 px-1.5 py-0.5 text-[10px] text-text-muted">
          {group.agents.length} Agent
        </span>
      </div>
    </button>
  )
}

function AttentionRow({ task, statusMap }: { task: MonitoringTask; statusMap: Record<LatestResultState, StatusUi> }) {
  const { t, i18n } = useTranslation()
  const status = statusMap[classifyTaskStatus(task)]
  return (
    <Link
      to={taskHref(task)}
      className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-bg-surface-light px-3 py-2.5 transition-colors hover:border-accent-border hover:bg-bg-card md:grid-cols-[minmax(0,1fr)_8rem_6rem]"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${PROTOCOL_COLORS[task.task_type] ?? 'bg-muted text-text-muted border-border'}`}>
            {protocolLabel(task.task_type)}
          </span>
          <span className="truncate text-sm font-medium text-text-primary">{task.name}</span>
        </div>
        <div className="mt-1 truncate text-xs text-text-muted">
          {task.target.name} · {task.agent?.name ?? t('monitoring.agentUnassigned')}
        </div>
      </div>
      <div className="flex items-center text-xs text-text-muted md:justify-end">
        <Clock3 className="mr-1.5 h-3.5 w-3.5" />
        {formatLatestSample(task.latest_result.latest_sample_at, i18n.language, t('monitoring.noSample'))}
      </div>
      <div className="flex md:justify-end">
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
    </Link>
  )
}

function EvidencePanel({ group }: { group?: MonitoringTargetGroup }) {
  const { t } = useTranslation()
  if (!group) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-5 text-sm text-text-muted">
        {t('dashboard.selectTargetForEvidence')}
      </div>
    )
  }

  const mtrTasks = group.tasks.filter((task) => task.task_type === 'mtr')

  return (
    <aside className="rounded-xl border border-border bg-bg-surface">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-text-primary">{group.target.name}</div>
            <div className="mt-1 font-mono text-xs text-text-muted">{group.target.target}</div>
          </div>
          {group.target.is_anycast && <Badge variant="info">Anycast</Badge>}
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs text-text-muted">
          <MapPin className="h-3.5 w-3.5" />
          {formatTargetLocation(group.target, t('monitoring.locationUnknown'))}
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <div className="mb-2 text-xs font-medium uppercase text-text-muted">{t('dashboard.protocolCoverage')}</div>
          <div className="grid grid-cols-3 gap-2">
            {MONITORING_PROTOCOLS.map((protocol) => (
              <div key={protocol} className="rounded-lg border border-border bg-bg-surface-light p-2">
                <div className="text-[10px] uppercase text-text-dim">{protocolLabel(protocol)}</div>
                <div className="mt-1 font-mono text-lg font-semibold text-text-primary">
                  {group.tasks.filter((task) => task.task_type === protocol).length}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium uppercase text-text-muted">{t('dashboard.agentCoverage')}</div>
          <div className="space-y-2">
            {group.agents.map((agent) => (
              <div key={agent.agent_uuid} className="rounded-lg border border-border bg-bg-surface-light px-3 py-2">
                <div className="truncate text-xs font-medium text-text-primary">{agent.name}</div>
                <div className="mt-1 truncate text-[11px] text-text-muted">{formatAgentLocation(agent, t('monitoring.locationUnknown'), t('monitoring.agentNotBound'))}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium uppercase text-text-muted">{t('dashboard.mtrEvidence')}</div>
          {mtrTasks.length === 0 ? (
            <div className="rounded-lg border border-border bg-bg-surface-light px-3 py-2 text-xs text-text-muted">{t('dashboard.noMtrTasks')}</div>
          ) : (
            <div className="space-y-2">
              {mtrTasks.map((task) => (
                <Link
                  key={task.task_uuid}
                  to={`/app/monitoring/${task.task_uuid}/mtr`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg-surface-light px-3 py-2 text-xs text-text-secondary transition-colors hover:border-accent-border hover:text-text-primary"
                >
                  <span className="truncate">{task.agent?.name ?? task.name}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { data, isLoading, error, refetch } = usePublicMonitoringTasks(100)
  const groups = useMemo(() => data?.groups ?? [], [data?.groups])
  const tasks = useMemo(() => data?.tasks ?? [], [data?.tasks])
  const [selectedTargetUuid, setSelectedTargetUuid] = useState<string | null>(null)

  const selectedGroup = useMemo(() => {
    if (groups.length === 0) return undefined
    return groups.find((group) => group.target.target_uuid === selectedTargetUuid) ?? groups[0]
  }, [groups, selectedTargetUuid])

  const attentionTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => attentionWeight(a) - attentionWeight(b) || a.name.localeCompare(b.name))
      .slice(0, 8)
  }, [tasks])

  const anycastTargets = groups.filter((group) => group.target.is_anycast).length
  const missingTasks = tasks.filter((task) => classifyTaskStatus(task) === 'missing').length
  const failedTasks = tasks.filter((task) => classifyTaskStatus(task) === 'failed').length
  const healthyTasks = tasks.filter((task) => classifyTaskStatus(task) === 'ok').length
  const overallStatus = failedTasks > 0 ? 'failed' : missingTasks > 0 ? 'missing' : 'ok'
  const statuses = statusCopy(t)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase text-accent-foreground">
            <DatabaseZap className="h-4 w-4" />
            {t('dashboard.healthEyebrow')}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">{t('dashboard.healthTitle')}</h1>
          <p className="mt-1 text-sm text-text-muted">{t('dashboard.healthDescription')}</p>
        </div>
        <Button variant="outline" onClick={() => void refetch()}>
          {t('dashboard.refresh')}
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-status-error-border bg-status-error-bg p-5">
          <div className="text-sm font-medium text-status-error-fg">{t('dashboard.healthLoadFailed')}</div>
          <div className="mt-1 text-xs text-status-error-fg/80">{t('dashboard.healthLoadFailedDesc')}</div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatTile label="Target" value={String(groups.length)} icon={Globe2} />
          <StatTile label="Anycast" value={String(anycastTargets)} icon={GitBranch} />
          <StatTile label="Task" value={String(tasks.length)} icon={Crosshair} />
          <StatTile label={t('dashboard.hasResults')} value={String(healthyTasks)} icon={CheckCircle2} tone="text-status-success-fg" />
          <StatTile label={t('dashboard.needsAttention')} value={String(missingTasks + failedTasks)} icon={overallStatus === 'ok' ? Signal : AlertTriangle} tone={statuses[overallStatus].tone} />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.05fr_1.45fr_0.95fr]">
        <section className="rounded-xl border border-border bg-bg-surface p-3">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">{t('dashboard.targetCoverage')}</h2>
              <p className="mt-1 text-xs text-text-muted">{t('dashboard.targetCoverageDesc')}</p>
            </div>
            <Badge variant="info">{groups.length}</Badge>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-20 rounded-lg" />)
            ) : groups.length === 0 ? (
              <div className="rounded-lg border border-border bg-bg-surface-light p-4 text-xs text-text-muted">{t('dashboard.noTargets')}</div>
            ) : (
              groups.map((group) => (
                <CoverageRow
                  key={group.target.target_uuid}
                  group={group}
                  statusMap={statuses}
                  selected={selectedGroup?.target.target_uuid === group.target.target_uuid}
                  onSelect={() => setSelectedTargetUuid(group.target.target_uuid)}
                />
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-bg-surface p-3">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">{t('dashboard.attentionQueue')}</h2>
              <p className="mt-1 text-xs text-text-muted">{t('dashboard.attentionQueueDesc')}</p>
            </div>
            <ShieldAlert className="h-4 w-4 text-text-muted" />
          </div>
          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-16 rounded-lg" />)
            ) : attentionTasks.length === 0 ? (
              <div className="rounded-lg border border-border bg-bg-surface-light p-6 text-center text-sm text-text-muted">{t('dashboard.noMonitoringTasks')}</div>
            ) : (
              attentionTasks.map((task) => <AttentionRow key={task.task_uuid} task={task} statusMap={statuses} />)
            )}
          </div>
          <Link to="/app/monitoring" className="mt-3 inline-flex items-center gap-1 px-1 text-xs text-accent-foreground hover:text-accent-foreground/80">
            {t('dashboard.viewAllTargets')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>

        <EvidencePanel group={selectedGroup} />
      </div>

      <section className="rounded-xl border border-border bg-bg-surface p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">{t('dashboard.protocolDistribution')}</h2>
            <p className="mt-1 text-xs text-text-muted">{t('dashboard.protocolDistributionDesc')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {MONITORING_PROTOCOLS.map((protocol) => (
              <span key={protocol} className={`rounded-md border px-2 py-1 text-xs font-semibold uppercase ${PROTOCOL_COLORS[protocol]}`}>
                {protocolLabel(protocol)} {tasks.filter((task) => task.task_type === protocol).length}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
