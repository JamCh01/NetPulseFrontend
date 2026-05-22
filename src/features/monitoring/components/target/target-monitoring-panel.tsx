import { useEffect, useMemo, useState } from 'react'
import { Activity, ChevronDown, MapPin, Radio, Server, ShieldCheck, Users, Waypoints, Wifi } from 'lucide-react'
import { useMtrDetail, useMtrListsForTasks } from '@/api/hooks/use-mtr'
import { useTaskMonitoringSeries } from '@/api/hooks/use-monitoring'
import { usePublicMonitoringTasks } from '@/api/hooks/use-public-monitoring-tasks'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { MultiAgentChart } from '@/features/monitoring/components/charts/multi-agent-chart'
import { MtrResultViews } from '@/features/monitoring/components/mtr/mtr-result-views'
import { GrafanaTimeRangeSelector } from '@/features/monitoring/components/time-range/time-range-selector'
import {
  buildAgentFilterOptions,
  filterTasksBySelectedAgents,
  labelForAgentSelection,
  type AgentFilterOption,
} from '@/features/monitoring/lib/agent-filter'
import {
  AUTO_REFRESH_INTERVAL_MS,
  createRelativeTimeRange,
  refreshRelativeTimeRange,
  type MonitoringTimeRange,
} from '@/features/monitoring/lib/time-range'
import { PROTOCOL_COLORS } from '@/lib/constants'
import {
  classifyTaskStatus,
  formatLatestSample,
  formatTargetLocation,
  protocolLabel,
  type LatestResultState,
  type MonitoringProtocol,
  type MonitoringTargetGroup,
  type MonitoringTask,
} from '@/features/monitoring/lib/monitoring-models'

const statusCopy: Record<LatestResultState, { label: string; variant: 'success' | 'warning' | 'error' | 'inactive' }> = {
  ok: { label: '正常', variant: 'success' },
  missing: { label: '上次更新时间', variant: 'warning' },
  failed: { label: '异常', variant: 'error' },
  unknown: { label: '未知', variant: 'inactive' },
}

function latestTimestamp(tasks: MonitoringTask[], sources: Array<(task: MonitoringTask) => string | null | undefined>) {
  return tasks
    .flatMap((task) => sources.map((source) => source(task)))
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null
}

function latestSample(tasks: MonitoringTask[]) {
  return latestTimestamp(tasks, [(task) => task.latest_result.latest_sample_at])
}

function latestTaskUpdate(tasks: MonitoringTask[]) {
  return latestTimestamp(tasks, [
    (task) => task.updated_at,
    (task) => task.created_at,
    (task) => task.latest_result.latest_sample_at,
  ])
}

function statusLabelForTasks(tasks: MonitoringTask[], state: LatestResultState) {
  if (state === 'missing') {
    return `上次更新 ${formatLatestSample(latestTaskUpdate(tasks))}`
  }
  return statusCopy[state].label
}

function protocolTasks(tasks: MonitoringTask[], protocol: MonitoringProtocol) {
  return tasks
    .filter((task) => task.task_type === protocol)
    .sort((a, b) => (a.agent?.name ?? '').localeCompare(b.agent?.name ?? '') || a.name.localeCompare(b.name))
}

function statusForTasks(tasks: MonitoringTask[]): LatestResultState {
  if (tasks.length === 0) return 'missing'
  const states = tasks.map(classifyTaskStatus)
  if (states.includes('failed')) return 'failed'
  if (states.includes('missing')) return 'missing'
  if (states.includes('unknown')) return 'unknown'
  return 'ok'
}

function ProtocolHeader({
  protocol,
  tasks,
  icon,
  timeRange,
  onTimeRangeChange,
  agentOptions,
  selectedAgentUuids,
  onSelectedAgentUuidsChange,
}: {
  protocol: 'icmp' | 'tcp' | 'mtr'
  tasks: MonitoringTask[]
  icon: React.ReactNode
  timeRange?: MonitoringTimeRange
  onTimeRangeChange?: (range: MonitoringTimeRange) => void
  agentOptions?: AgentFilterOption[]
  selectedAgentUuids?: string[]
  onSelectedAgentUuidsChange?: (agentUuids: string[]) => void
}) {
  const statusState = statusForTasks(tasks)
  const status = statusCopy[statusState]
  const agents = new Set(tasks.map((task) => task.agent?.agent_uuid).filter(Boolean)).size
  const showAgentFilter = agentOptions && selectedAgentUuids && onSelectedAgentUuidsChange

  return (
    <div className="flex flex-col gap-2 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${PROTOCOL_COLORS[protocol] ?? 'border-border bg-muted text-text-muted'}`}>
          {icon}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-text-primary">{protocolLabel(protocol)}</h2>
            <Badge variant={status.variant}>{statusLabelForTasks(tasks, statusState)}</Badge>
          </div>
          <div className="mt-0.5 text-xs text-text-muted">
            {tasks.length} 个任务 · {agents} 个 Agent · 最新样本 {formatLatestSample(latestSample(tasks))}
          </div>
        </div>
      </div>
      {(showAgentFilter || (timeRange && onTimeRangeChange)) && (
        <div className="flex flex-wrap items-center gap-2">
          {showAgentFilter && (
            <AgentFilterDropdown
              options={agentOptions}
              selectedAgentUuids={selectedAgentUuids}
              onSelectedAgentUuidsChange={onSelectedAgentUuidsChange}
            />
          )}
          {timeRange && onTimeRangeChange && (
            <GrafanaTimeRangeSelector value={timeRange} onChange={onTimeRangeChange} />
          )}
        </div>
      )}
    </div>
  )
}

function AgentFilterDropdown({
  options,
  selectedAgentUuids,
  onSelectedAgentUuidsChange,
}: {
  options: AgentFilterOption[]
  selectedAgentUuids: string[]
  onSelectedAgentUuidsChange: (agentUuids: string[]) => void
}) {
  const selected = useMemo(() => new Set(selectedAgentUuids), [selectedAgentUuids])
  const allSelected = options.length > 0 && selectedAgentUuids.length === options.length
  const label = labelForAgentSelection(selectedAgentUuids.length, options.length)

  const handleToggleAll = (checked: boolean) => {
    onSelectedAgentUuidsChange(checked ? options.map((option) => option.agentUuid) : [])
  }

  const handleToggleAgent = (agentUuid: string, checked: boolean) => {
    if (checked) {
      onSelectedAgentUuidsChange(Array.from(new Set([...selectedAgentUuids, agentUuid])))
      return
    }
    onSelectedAgentUuidsChange(selectedAgentUuids.filter((item) => item !== agentUuid))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-border bg-bg-surface-light px-2.5 text-xs text-text-secondary hover:border-accent-border hover:bg-muted hover:text-text-primary"
          />
        }
      >
        <Users className="h-3.5 w-3.5 text-text-muted" />
        <span className="font-[family-name:var(--font-mono)]">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-text-dim" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-md border border-border bg-popover text-text-secondary">
        <DropdownMenuCheckboxItem
          checked={allSelected}
          onCheckedChange={handleToggleAll}
          className="cursor-pointer text-xs"
        >
          全部 Agent
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {options.length === 0 ? (
          <DropdownMenuItem disabled className="text-xs text-text-muted">
            当前协议没有 Agent
          </DropdownMenuItem>
        ) : (
          options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.agentUuid}
              checked={selected.has(option.agentUuid)}
              onCheckedChange={(checked) => handleToggleAgent(option.agentUuid, checked)}
              className="cursor-pointer text-xs"
            >
              <span className="truncate">{option.agentName}</span>
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function EmptyProtocolState({ protocol }: { protocol: string }) {
  return (
    <div className="p-8 text-center">
      <ShieldCheck className="mx-auto h-7 w-7 text-text-dim" />
      <div className="mt-3 text-sm font-medium text-text-primary">当前 Target 没有 {protocol} 任务</div>
      <div className="mt-1 text-xs text-text-muted">创建任务并产生数据后会在这里直接展示。</div>
    </div>
  )
}

function MetricsProtocolPanel({
  protocol,
  tasks,
  timeRange,
  onTimeRangeChange,
}: {
  protocol: 'icmp' | 'tcp'
  tasks: MonitoringTask[]
  timeRange: MonitoringTimeRange
  onTimeRangeChange: (range: MonitoringTimeRange) => void
}) {
  const agentOptions = useMemo(() => buildAgentFilterOptions(tasks), [tasks])
  const [selectedAgentUuids, setSelectedAgentUuids] = useState<string[] | null>(null)

  useEffect(() => {
    setSelectedAgentUuids((current) => {
      const available = new Set(agentOptions.map((option) => option.agentUuid))
      if (current === null) {
        return agentOptions.map((option) => option.agentUuid)
      }
      const retained = current.filter((agentUuid) => available.has(agentUuid))
      return retained
    })
  }, [agentOptions])

  const effectiveSelectedAgentUuids = selectedAgentUuids ?? agentOptions.map((option) => option.agentUuid)

  const filteredTasks = useMemo(
    () => filterTasksBySelectedAgents(tasks, effectiveSelectedAgentUuids),
    [effectiveSelectedAgentUuids, tasks],
  )
  const { agentSeries, isLoading, error } = useTaskMonitoringSeries(filteredTasks, timeRange)

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-bg-surface">
      <ProtocolHeader
        protocol={protocol}
        tasks={tasks}
        icon={protocol === 'icmp' ? <Wifi className="h-4 w-4" /> : <Radio className="h-4 w-4" />}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
        agentOptions={agentOptions}
        selectedAgentUuids={effectiveSelectedAgentUuids}
        onSelectedAgentUuidsChange={setSelectedAgentUuids}
      />
      {tasks.length === 0 ? (
        <EmptyProtocolState protocol={protocol.toUpperCase()} />
      ) : filteredTasks.length === 0 ? (
        <div className="p-8 text-center">
          <Users className="mx-auto h-7 w-7 text-text-dim" />
          <div className="mt-3 text-sm font-medium text-text-primary">未选择 Agent</div>
          <div className="mt-1 text-xs text-text-muted">请在上方 Agent 筛选中至少选择一个 Agent。</div>
        </div>
      ) : (
        <div className="p-4">
          <MultiAgentChart
            agentSeries={agentSeries}
            isLoading={isLoading}
            error={error}
            height={protocol === 'icmp' ? 340 : 320}
            chartStyle="smoke"
          />
        </div>
      )}
    </section>
  )
}

function MtrProtocolPanel({
  tasks,
  timeRange,
  onTimeRangeChange,
}: {
  tasks: MonitoringTask[]
  timeRange: MonitoringTimeRange
  onTimeRangeChange: (range: MonitoringTimeRange) => void
}) {
  const agentOptions = useMemo(() => buildAgentFilterOptions(tasks), [tasks])
  const [selectedAgentUuids, setSelectedAgentUuids] = useState<string[] | null>(null)
  useEffect(() => {
    setSelectedAgentUuids((current) => {
      const available = new Set(agentOptions.map((option) => option.agentUuid))
      if (current === null) {
        return agentOptions.map((option) => option.agentUuid)
      }
      return current.filter((agentUuid) => available.has(agentUuid))
    })
  }, [agentOptions])
  const effectiveSelectedAgentUuids = selectedAgentUuids ?? agentOptions.map((option) => option.agentUuid)
  const filteredTasks = useMemo(
    () => filterTasksBySelectedAgents(tasks, effectiveSelectedAgentUuids),
    [effectiveSelectedAgentUuids, tasks],
  )
  const { combinedResults, total, isLoading, error } = useMtrListsForTasks(filteredTasks, timeRange)
  const [selectedResultUuid, setSelectedResultUuid] = useState<string>('')
  const selectedResult = selectedResultUuid || combinedResults[0]?.result_uuid || ''
  const { data: mtrDetail, isLoading: detailLoading } = useMtrDetail(selectedResult)

  useEffect(() => {
    if (selectedResultUuid && !combinedResults.some((result) => result.result_uuid === selectedResultUuid)) {
      setSelectedResultUuid(combinedResults[0]?.result_uuid ?? '')
      return
    }
    if (!selectedResultUuid && combinedResults[0]?.result_uuid) {
      setSelectedResultUuid(combinedResults[0].result_uuid)
    }
  }, [combinedResults, selectedResultUuid])

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-bg-surface">
      <ProtocolHeader
        protocol="mtr"
        tasks={tasks}
        icon={<Waypoints className="h-4 w-4" />}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
        agentOptions={agentOptions}
        selectedAgentUuids={effectiveSelectedAgentUuids}
        onSelectedAgentUuidsChange={setSelectedAgentUuids}
      />
      {tasks.length === 0 ? (
        <EmptyProtocolState protocol="MTR" />
      ) : filteredTasks.length === 0 ? (
        <div className="p-8 text-center">
          <Users className="mx-auto h-7 w-7 text-text-dim" />
          <div className="mt-3 text-sm font-medium text-text-primary">未选择 Agent</div>
          <div className="mt-1 text-xs text-text-muted">请在上方 Agent 筛选中至少选择一个 Agent。</div>
        </div>
      ) : error ? (
        <div className="p-6 text-sm text-status-error-fg">MTR 数据加载失败：{error.message}</div>
      ) : (
        <div className="p-4">
          <MtrResultViews
            tasks={filteredTasks}
            results={combinedResults}
            total={total}
            selectedResultUuid={selectedResult}
            onSelectResult={setSelectedResultUuid}
            selectedResult={mtrDetail}
            detailLoading={selectedResult ? detailLoading : false}
            listLoading={isLoading}
          />
        </div>
      )}
    </section>
  )
}

function TargetSummary({ group }: { group: MonitoringTargetGroup }) {
  const status = statusCopy[group.status]
  const statusLabel = group.status === 'missing'
    ? `上次更新 ${formatLatestSample(latestTaskUpdate(group.tasks))}`
    : status.label
  return (
    <section className="rounded-xl border border-border bg-bg-surface">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-semibold text-text-primary">{group.target.name}</h1>
            <Badge variant={status.variant}>{statusLabel}</Badge>
            {group.target.is_anycast && <Badge variant="info">Anycast</Badge>}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
            <span className="font-mono text-text-secondary">{group.target.target}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {formatTargetLocation(group.target)}
            </span>
            {group.target.carrier && (
              <span className="inline-flex items-center gap-1">
                <Server className="h-3.5 w-3.5" />
                {group.target.carrier}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryMetric label="任务数" value={String(group.tasks.length)} />
        <SummaryMetric label="Agent" value={String(group.agents.length)} />
        <SummaryMetric label="协议" value={group.protocols.map((item) => item.toUpperCase()).join(' / ') || '-'} />
        <SummaryMetric label="最新样本" value={formatLatestSample(group.latest_sample_at)} />
      </div>
    </section>
  )
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg-surface-light px-3 py-2">
      <div className="text-[10px] uppercase text-text-dim">{label}</div>
      <div className="mt-1 flex items-center gap-1 font-mono text-sm font-semibold text-text-primary">
        <Activity className="h-3.5 w-3.5 text-accent-foreground" />
        {value}
      </div>
    </div>
  )
}

export function TargetMonitoringPanel({
  targetUuid,
  fallbackGroup,
  basePath: _basePath,
}: {
  targetUuid: string
  fallbackGroup?: MonitoringTargetGroup
  basePath: '/monitoring' | '/app/monitoring'
}) {
  const { data, isLoading, error, refetch } = usePublicMonitoringTasks({
    pageSize: 100,
    targetUuid,
  })
  const [icmpTimeRange, setIcmpTimeRange] = useState<MonitoringTimeRange>(() => createRelativeTimeRange())
  const [tcpTimeRange, setTcpTimeRange] = useState<MonitoringTimeRange>(() => createRelativeTimeRange())
  const [mtrTimeRange, setMtrTimeRange] = useState<MonitoringTimeRange>(() => createRelativeTimeRange())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIcmpTimeRange((current) => refreshRelativeTimeRange(current))
      setTcpTimeRange((current) => refreshRelativeTimeRange(current))
      setMtrTimeRange((current) => refreshRelativeTimeRange(current))
    }, AUTO_REFRESH_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [])

  const group = data?.groups[0] ?? fallbackGroup
  const icmpTasks = useMemo(() => protocolTasks(group?.tasks ?? [], 'icmp'), [group?.tasks])
  const tcpTasks = useMemo(() => protocolTasks(group?.tasks ?? [], 'tcp'), [group?.tasks])
  const mtrTasks = useMemo(() => protocolTasks(group?.tasks ?? [], 'mtr'), [group?.tasks])

  if (isLoading && !group) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="rounded-xl border border-status-error-border bg-status-error-bg p-5">
        <div className="text-sm font-medium text-status-error-fg">Target 监控数据加载失败</div>
        <div className="mt-1 text-xs text-status-error-fg/80">无法按 Target 读取监控任务和指标。</div>
        <Button className="mt-3" size="sm" variant="outline" onClick={() => void refetch()}>
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <TargetSummary group={group} />
      <MetricsProtocolPanel protocol="icmp" tasks={icmpTasks} timeRange={icmpTimeRange} onTimeRangeChange={setIcmpTimeRange} />
      <MetricsProtocolPanel protocol="tcp" tasks={tcpTasks} timeRange={tcpTimeRange} onTimeRangeChange={setTcpTimeRange} />
      <MtrProtocolPanel tasks={mtrTasks} timeRange={mtrTimeRange} onTimeRangeChange={setMtrTimeRange} />
    </div>
  )
}
