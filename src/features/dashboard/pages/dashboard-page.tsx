import { useMemo, useState } from 'react'
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
import { PROTOCOL_COLORS } from '@/lib/constants'
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

const statusCopy: Record<LatestResultState, { label: string; variant: 'success' | 'warning' | 'error' | 'inactive'; tone: string }> = {
  ok: { label: '正常', variant: 'success', tone: 'text-status-success-fg' },
  missing: { label: '无数据', variant: 'warning', tone: 'text-status-warning-fg' },
  failed: { label: '异常', variant: 'error', tone: 'text-status-error-fg' },
  unknown: { label: '未知', variant: 'inactive', tone: 'text-status-inactive-fg' },
}

function attentionWeight(task: MonitoringTask) {
  const status = classifyTaskStatus(task)
  if (status === 'failed') return 0
  if (status === 'missing') return 1
  if (status === 'unknown') return 2
  if (task.task_type === 'mtr') return 3
  return 4
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

function CoverageRow({ group, selected, onSelect }: { group: MonitoringTargetGroup; selected: boolean; onSelect: () => void }) {
  const status = statusCopy[group.status]
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
        {['icmp', 'tcp', 'mtr'].map((protocol) => {
          const count = group.tasks.filter((task) => task.task_type === protocol).length
          return (
            <span
              key={protocol}
              className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                count > 0 ? PROTOCOL_COLORS[protocol] : 'border-border bg-muted/30 text-text-dim'
              }`}
            >
              {protocol} {count}
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

function AttentionRow({ task }: { task: MonitoringTask }) {
  const status = statusCopy[classifyTaskStatus(task)]
  return (
    <Link
      to={taskHref(task)}
      className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-bg-surface-light px-3 py-2.5 transition-colors hover:border-accent-border hover:bg-bg-card md:grid-cols-[minmax(0,1fr)_8rem_6rem]"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${PROTOCOL_COLORS[task.task_type] ?? 'bg-muted text-text-muted border-border'}`}>
            {task.task_type}
          </span>
          <span className="truncate text-sm font-medium text-text-primary">{task.name}</span>
        </div>
        <div className="mt-1 truncate text-xs text-text-muted">
          {task.target.name} · {task.agent?.name ?? '未绑定 Agent'}
        </div>
      </div>
      <div className="flex items-center text-xs text-text-muted md:justify-end">
        <Clock3 className="mr-1.5 h-3.5 w-3.5" />
        {formatLatestSample(task.latest_result.latest_sample_at)}
      </div>
      <div className="flex md:justify-end">
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
    </Link>
  )
}

function EvidencePanel({ group }: { group?: MonitoringTargetGroup }) {
  if (!group) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-5 text-sm text-text-muted">
        选择一个 Target 查看证据。
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
          {formatTargetLocation(group.target)}
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <div className="mb-2 text-xs font-medium uppercase text-text-muted">协议覆盖</div>
          <div className="grid grid-cols-3 gap-2">
            {['icmp', 'tcp', 'mtr'].map((protocol) => (
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
          <div className="mb-2 text-xs font-medium uppercase text-text-muted">Agent 覆盖</div>
          <div className="space-y-2">
            {group.agents.map((agent) => (
              <div key={agent.agent_uuid} className="rounded-lg border border-border bg-bg-surface-light px-3 py-2">
                <div className="truncate text-xs font-medium text-text-primary">{agent.name}</div>
                <div className="mt-1 truncate text-[11px] text-text-muted">{formatAgentLocation(agent)}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium uppercase text-text-muted">MTR 证据</div>
          {mtrTasks.length === 0 ? (
            <div className="rounded-lg border border-border bg-bg-surface-light px-3 py-2 text-xs text-text-muted">没有 MTR 任务。</div>
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
  const { data, isLoading, error, refetch } = usePublicMonitoringTasks(100)
  const groups = data?.groups ?? []
  const tasks = data?.tasks ?? []
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase text-accent-foreground">
            <DatabaseZap className="h-4 w-4" />
            Network Health
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">网络健康指挥台</h1>
          <p className="mt-1 text-sm text-text-muted">按 Target、Agent 和协议聚合当前监控状态。</p>
        </div>
        <Button variant="outline" onClick={() => void refetch()}>
          刷新数据
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-status-error-border bg-status-error-bg p-5">
          <div className="text-sm font-medium text-status-error-fg">网络健康数据加载失败</div>
          <div className="mt-1 text-xs text-status-error-fg/80">无法读取监控任务列表，Dashboard 已停止生成结论。</div>
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
          <StatTile label="有结果" value={String(healthyTasks)} icon={CheckCircle2} tone="text-status-success-fg" />
          <StatTile label="需关注" value={String(missingTasks + failedTasks)} icon={overallStatus === 'ok' ? Signal : AlertTriangle} tone={statusCopy[overallStatus].tone} />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.05fr_1.45fr_0.95fr]">
        <section className="rounded-xl border border-border bg-bg-surface p-3">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Target 覆盖</h2>
              <p className="mt-1 text-xs text-text-muted">按异常优先排序。</p>
            </div>
            <Badge variant="info">{groups.length}</Badge>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-20 rounded-lg" />)
            ) : groups.length === 0 ? (
              <div className="rounded-lg border border-border bg-bg-surface-light p-4 text-xs text-text-muted">暂无 Target。</div>
            ) : (
              groups.map((group) => (
                <CoverageRow
                  key={group.target.target_uuid}
                  group={group}
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
              <h2 className="text-sm font-semibold text-text-primary">Attention Queue</h2>
              <p className="mt-1 text-xs text-text-muted">无数据、失败和 MTR 任务优先。</p>
            </div>
            <ShieldAlert className="h-4 w-4 text-text-muted" />
          </div>
          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-16 rounded-lg" />)
            ) : attentionTasks.length === 0 ? (
              <div className="rounded-lg border border-border bg-bg-surface-light p-6 text-center text-sm text-text-muted">暂无监控任务。</div>
            ) : (
              attentionTasks.map((task) => <AttentionRow key={task.task_uuid} task={task} />)
            )}
          </div>
          <Link to="/app/monitoring" className="mt-3 inline-flex items-center gap-1 px-1 text-xs text-accent-foreground hover:text-accent-foreground/80">
            查看全部监控目标
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>

        <EvidencePanel group={selectedGroup} />
      </div>

      <section className="rounded-xl border border-border bg-bg-surface p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">协议任务分布</h2>
            <p className="mt-1 text-xs text-text-muted">用于确认 Target 是否具备 ICMP/TCP/MTR 完整检测链路。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['icmp', 'tcp', 'mtr'].map((protocol) => (
              <span key={protocol} className={`rounded-md border px-2 py-1 text-xs font-semibold uppercase ${PROTOCOL_COLORS[protocol]}`}>
                {protocol} {tasks.filter((task) => task.task_type === protocol).length}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
