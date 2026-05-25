import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { ArrowLeft, Filter, MapPin, Radio, Search, Server, ShieldCheck } from 'lucide-react'
import { usePublicMonitoringTasks } from '@/api/hooks/use-public-monitoring-tasks'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { PROTOCOL_COLORS } from '@/lib/constants'
import { TargetMonitoringPanel } from '@/features/monitoring/components/target/target-monitoring-panel'
import {
  classifyTaskStatus,
  formatAgentLocation,
  formatLatestSample,
  formatTargetLocation,
  protocolLabel,
  type LatestResultState,
  type MonitoringProtocol,
  type MonitoringTargetGroup,
  type MonitoringTask,
} from '@/features/monitoring/lib/monitoring-models'

type ProtocolFilter = 'all' | 'icmp' | 'tcp' | 'mtr' | 'iperf3'

const protocolFilters: Array<{ value: ProtocolFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'icmp', label: 'ICMP' },
  { value: 'tcp', label: 'TCP' },
  { value: 'mtr', label: 'MTR' },
  { value: 'iperf3', label: 'IPERF3' },
]

const statusCopy: Record<LatestResultState, { label: string; variant: 'success' | 'warning' | 'error' | 'inactive' }> = {
  ok: { label: '正常', variant: 'success' },
  missing: { label: '无数据', variant: 'warning' },
  failed: { label: '异常', variant: 'error' },
  unknown: { label: '未知', variant: 'inactive' },
}

function taskHref(basePath: string, task: MonitoringTask) {
  return task.task_type === 'mtr' ? `${basePath}/${task.task_uuid}/mtr` : `${basePath}/${task.task_uuid}`
}

function protocolCoverage(group: MonitoringTargetGroup, protocol: MonitoringProtocol) {
  const count = group.tasks.filter((task) => task.task_type === protocol).length
  const className = count > 0
    ? PROTOCOL_COLORS[protocol] ?? 'bg-muted text-text-muted border-border'
    : 'border-border bg-muted/30 text-text-dim'
  return (
    <span className={`inline-flex h-6 min-w-12 items-center justify-center rounded-md border px-2 text-[11px] font-semibold uppercase ${className}`}>
      {protocolLabel(protocol)}
      <span className="ml-1 font-mono text-[10px] opacity-75">{count}</span>
    </span>
  )
}

function TaskRow({ task, basePath }: { task: MonitoringTask; basePath: string }) {
  const status = statusCopy[classifyTaskStatus(task)]
  const port = typeof task.probe_config?.port === 'number' ? `:${task.probe_config.port}` : ''
  return (
    <Link
      to={taskHref(basePath, task)}
      className="grid grid-cols-1 gap-2 rounded-lg border border-border/70 bg-bg-surface-light px-3 py-2.5 transition-colors hover:border-accent-border hover:bg-bg-card sm:grid-cols-[minmax(0,1fr)_9rem_7rem_7rem]"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${PROTOCOL_COLORS[task.task_type] ?? 'bg-muted text-text-muted border-border'}`}>
            {protocolLabel(task.task_type)}
          </span>
          <span className="truncate text-sm font-medium text-text-primary">{task.name}</span>
        </div>
        <div className="mt-1 truncate text-xs text-text-muted">
          {task.agent?.name ?? '未绑定 Agent'} · {formatAgentLocation(task.agent)} · {task.target.target}{port}
        </div>
      </div>
      <div className="flex items-center text-xs text-text-muted sm:justify-end">
        <Radio className="mr-1.5 h-3.5 w-3.5" />
        {task.interval_sec}s
      </div>
      <div className="flex items-center text-xs text-text-muted sm:justify-end">
        {formatLatestSample(task.latest_result.latest_sample_at)}
      </div>
      <div className="flex items-center sm:justify-end">
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
    </Link>
  )
}

function TargetGroupPanel({ group, basePath }: { group: MonitoringTargetGroup; basePath: string }) {
  const status = statusCopy[group.status]
  const sortedTasks = [...group.tasks].sort((a, b) => {
    const order: Record<string, number> = { icmp: 0, tcp: 1, mtr: 2, iperf3: 3 }
    return (order[a.task_type] ?? 10) - (order[b.task_type] ?? 10) || a.name.localeCompare(b.name)
  })

  return (
    <section className="rounded-xl border border-border bg-bg-surface/90">
      <div className="border-b border-border px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-text-primary">{group.target.name}</h2>
              <Badge variant={status.variant}>{status.label}</Badge>
              {group.target.is_anycast && <Badge variant="info">Anycast</Badge>}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
              <span className="font-mono text-text-secondary">{group.target.target}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{formatTargetLocation(group.target)}</span>
              {group.target.carrier && <span className="inline-flex items-center gap-1"><Server className="h-3.5 w-3.5" />{group.target.carrier}</span>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {protocolCoverage(group, 'icmp')}
            {protocolCoverage(group, 'tcp')}
            {protocolCoverage(group, 'mtr')}
            {protocolCoverage(group, 'iperf3')}
            <span className="inline-flex h-6 items-center rounded-md border border-border bg-muted/30 px-2 text-[11px] text-text-muted">
              {group.agents.length} Agent
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-2 p-3">
        {sortedTasks.map((task) => (
          <TaskRow key={task.task_uuid} task={task} basePath={basePath} />
        ))}
      </div>
    </section>
  )
}

export default function MonitoringIndexPage() {
  const location = useLocation()
  const basePath = location.pathname.startsWith('/app/monitoring') ? '/app/monitoring' : '/monitoring'
  const { data, isLoading, error, refetch } = usePublicMonitoringTasks(100)
  const [query, setQuery] = useState('')
  const [protocol, setProtocol] = useState<ProtocolFilter>('all')
  const selectedTargetUuid = new URLSearchParams(location.search).get('target_uuid')

  const groups = useMemo(() => data?.groups ?? [], [data?.groups])
  const selectedTargetName = selectedTargetUuid
    ? groups.find((group) => group.target.target_uuid === selectedTargetUuid)?.target.name
    : null
  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return groups
      .filter((group) => !selectedTargetUuid || group.target.target_uuid === selectedTargetUuid)
      .map((group) => ({
        ...group,
        tasks: group.tasks.filter((task) => protocol === 'all' || task.task_type === protocol),
      }))
      .filter((group) => group.tasks.length > 0)
      .filter((group) => {
        if (!needle) return true
        return [
          group.target.name,
          group.target.target,
          group.target.carrier ?? '',
          ...group.agents.map((agent) => agent.name),
          ...group.tasks.map((task) => task.name),
        ].some((value) => value.toLowerCase().includes(needle))
      })
  }, [groups, protocol, query, selectedTargetUuid])

  const selectedGroup = selectedTargetUuid
    ? groups.find((group) => group.target.target_uuid === selectedTargetUuid)
    : undefined

  return (
    <div className="space-y-5">
      {selectedTargetUuid ? (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-sm text-text-muted">
            当前 Target：
            <span className="font-medium text-text-primary">{selectedTargetName ?? selectedTargetUuid}</span>
          </div>
          <Link to={basePath}>
            <Button size="sm" variant="outline">
              <ArrowLeft className="h-4 w-4" />
              返回所有 Target
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-surface p-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索 Target、Agent、运营商或任务"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="h-4 w-4 shrink-0 text-text-muted" />
            {protocolFilters.map((item) => (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant={protocol === item.value ? 'default' : 'outline'}
                onClick={() => setProtocol(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {selectedTargetUuid ? (
        <TargetMonitoringPanel targetUuid={selectedTargetUuid} fallbackGroup={selectedGroup} basePath={basePath} />
      ) : error ? (
        <div className="rounded-xl border border-status-error-border bg-status-error-bg p-5">
          <div className="text-sm font-medium text-status-error-fg">监控任务加载失败</div>
          <div className="mt-1 text-xs text-status-error-fg/80">无法读取 `/api/v1/monitoring/tasks`。</div>
          <Button className="mt-3" size="sm" variant="outline" onClick={() => void refetch()}>
            重试
          </Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-surface p-8 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-text-dim" />
          <div className="mt-3 text-sm font-medium text-text-primary">没有匹配的监控目标</div>
          <div className="mt-1 text-xs text-text-muted">调整搜索条件或协议筛选。</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map((group) => (
            <TargetGroupPanel key={group.target.target_uuid} group={group} basePath={basePath} />
          ))}
        </div>
      )}
    </div>
  )
}
