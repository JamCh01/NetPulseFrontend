import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type TFunction } from 'i18next'
import { ChevronDown, Gauge, MapPin, Radio, Server, ShieldCheck, Users, Waypoints, Wifi } from 'lucide-react'
import { useIperf3ListsForTasks } from '@/api/hooks/use-iperf3'
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
import { Iperf3ResultViews } from '@/features/monitoring/components/iperf3/iperf3-result-views'
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
  formatLatestSample,
  formatTargetLocation,
  protocolLabel,
  type LatestResultState,
  type MonitoringProtocol,
  type MonitoringTargetGroup,
  type MonitoringTask,
} from '@/features/monitoring/lib/monitoring-models'

type StatusUi = { label: string; variant: 'success' | 'warning' | 'error' | 'inactive' }

function statusCopy(t: TFunction<'translation'>): Record<LatestResultState, StatusUi> {
  return {
    ok: { label: t('monitoring.statusOk'), variant: 'success' },
    missing: { label: t('monitoring.statusLastUpdated'), variant: 'warning' },
    failed: { label: t('monitoring.statusFailed'), variant: 'error' },
    unknown: { label: t('monitoring.statusUnknown'), variant: 'inactive' },
  }
}

const filterButtonClass = 'h-9 w-full min-w-0 justify-between border-border bg-bg-surface-light px-3 text-xs text-text-secondary shadow-sm hover:border-accent-border hover:bg-muted hover:text-text-primary'

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

function protocolTasks(tasks: MonitoringTask[], protocol: MonitoringProtocol) {
  return tasks
    .filter((task) => task.task_type === protocol)
    .sort((a, b) => (a.agent?.name ?? '').localeCompare(b.agent?.name ?? '') || a.name.localeCompare(b.name))
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
  protocol: 'icmp' | 'tcp' | 'mtr' | 'iperf3'
  tasks: MonitoringTask[]
  icon: React.ReactNode
  timeRange?: MonitoringTimeRange
  onTimeRangeChange?: (range: MonitoringTimeRange) => void
  agentOptions?: AgentFilterOption[]
  selectedAgentUuids?: string[]
  onSelectedAgentUuidsChange?: (agentUuids: string[]) => void
}) {
  const { t, i18n } = useTranslation()
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
          </div>
          <div className="mt-0.5 text-xs text-text-muted">
            {t('monitoring.taskPlural', { count: tasks.length })} · {t('monitoring.agentPlural', { count: agents })} · {t('monitoring.latestSampleWithValue', { value: formatLatestSample(latestSample(tasks), i18n.language, t('monitoring.noSample')) })}
          </div>
        </div>
      </div>
      {(showAgentFilter || (timeRange && onTimeRangeChange)) && (
        <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:min-w-[42rem]">
          {showAgentFilter && (
            <AgentFilterDropdown
              options={agentOptions}
              selectedAgentUuids={selectedAgentUuids}
              onSelectedAgentUuidsChange={onSelectedAgentUuidsChange}
              className={filterButtonClass}
            />
          )}
          {timeRange && onTimeRangeChange && (
            <GrafanaTimeRangeSelector
              value={timeRange}
              onChange={onTimeRangeChange}
              density="compact"
              className={filterButtonClass}
            />
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
  className,
}: {
  options: AgentFilterOption[]
  selectedAgentUuids: string[]
  onSelectedAgentUuidsChange: (agentUuids: string[]) => void
  className?: string
}) {
  const { t } = useTranslation()
  const selected = useMemo(() => new Set(selectedAgentUuids), [selectedAgentUuids])
  const allSelected = options.length > 0 && selectedAgentUuids.length === options.length
  const label = labelForAgentSelection(selectedAgentUuids.length, options.length, {
    noAgent: t('common.noAgent'),
    noneSelected: t('common.noAgentSelected'),
    allAgents: t('common.allAgents'),
  })
  const selectedLabel = t('common.selectedCount', { selected: selectedAgentUuids.length, total: options.length })

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
            className={className ?? filterButtonClass}
          />
        }
      >
        <Users className="h-3.5 w-3.5 text-text-muted" />
        <span className="min-w-0 flex-1 truncate text-left font-[family-name:var(--font-mono)]">{label}</span>
        <span className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] text-text-dim">
          {selectedLabel}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-text-dim" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-md border border-border bg-popover text-text-secondary">
        <DropdownMenuCheckboxItem
          checked={allSelected}
          onCheckedChange={handleToggleAll}
          className="cursor-pointer text-xs"
        >
          {t('monitoring.allAgents')}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {options.length === 0 ? (
          <DropdownMenuItem disabled className="text-xs text-text-muted">
            {t('monitoring.noAgentForProtocol')}
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

function EvidenceToolbar({
  title,
  icon,
  tasks,
  timeRange,
  onTimeRangeChange,
  agentOptions,
  selectedAgentUuids,
  onSelectedAgentUuidsChange,
}: {
  title: string
  icon: React.ReactNode
  tasks: MonitoringTask[]
  timeRange: MonitoringTimeRange
  onTimeRangeChange: (range: MonitoringTimeRange) => void
  agentOptions: AgentFilterOption[]
  selectedAgentUuids: string[]
  onSelectedAgentUuidsChange: (agentUuids: string[]) => void
}) {
  const { t, i18n } = useTranslation()
  const agents = new Set(tasks.map((task) => task.agent?.agent_uuid).filter(Boolean)).size

  return (
    <div className="border-b border-border bg-bg-surface">
      <div className="flex flex-col gap-3 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-sky-500/30 bg-sky-500/10 text-sky-300">
              {icon}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-text-primary">{title}</h2>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                <span>{t('monitoring.taskPlural', { count: tasks.length })}</span>
                <span>{t('monitoring.agentPlural', { count: agents })}</span>
                <span>{t('monitoring.latestSampleWithValue', { value: formatLatestSample(latestSample(tasks), i18n.language, t('monitoring.noSample')) })}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid w-full gap-2 sm:grid-cols-2 xl:w-auto xl:min-w-[42rem]">
          <AgentFilterDropdown
            options={agentOptions}
            selectedAgentUuids={selectedAgentUuids}
            onSelectedAgentUuidsChange={onSelectedAgentUuidsChange}
            className={filterButtonClass}
          />
          <GrafanaTimeRangeSelector
            value={timeRange}
            onChange={onTimeRangeChange}
            showStep={false}
            density="compact"
            className={filterButtonClass}
          />
        </div>
      </div>
    </div>
  )
}

function MtrEvidenceToolbar(props: Omit<Parameters<typeof EvidenceToolbar>[0], 'protocol' | 'title' | 'icon'>) {
  const { t } = useTranslation()
  return (
    <EvidenceToolbar
      {...props}
      title={t('monitoring.mtrResults')}
      icon={<Waypoints className="h-4 w-4" />}
    />
  )
}

function Iperf3EvidenceToolbar(props: Omit<Parameters<typeof EvidenceToolbar>[0], 'protocol' | 'title' | 'icon'>) {
  const { t } = useTranslation()
  return (
    <EvidenceToolbar
      {...props}
      title={t('monitoring.iperf3Results')}
      icon={<Gauge className="h-4 w-4" />}
    />
  )
}

function EmptyProtocolState({ protocol }: { protocol: string }) {
  const { t } = useTranslation()
  return (
    <div className="p-8 text-center">
      <ShieldCheck className="mx-auto h-7 w-7 text-text-dim" />
      <div className="mt-3 text-sm font-medium text-text-primary">{t('monitoring.emptyProtocolTitle', { protocol })}</div>
      <div className="mt-1 text-xs text-text-muted">{t('monitoring.emptyProtocolDesc')}</div>
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
  const availableAgentUuids = useMemo(() => new Set(agentOptions.map((option) => option.agentUuid)), [agentOptions])
  const allAgentUuids = useMemo(() => agentOptions.map((option) => option.agentUuid), [agentOptions])
  const effectiveSelectedAgentUuids = useMemo(
    () => (selectedAgentUuids ?? allAgentUuids).filter((agentUuid) => availableAgentUuids.has(agentUuid)),
    [allAgentUuids, availableAgentUuids, selectedAgentUuids],
  )

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
        <EmptyProtocolState protocol={protocolLabel(protocol)} />
      ) : filteredTasks.length === 0 ? (
        <div className="p-8 text-center">
          <Users className="mx-auto h-7 w-7 text-text-dim" />
          <NoAgentSelectedText />
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
  const { t } = useTranslation()
  const agentOptions = useMemo(() => buildAgentFilterOptions(tasks), [tasks])
  const [selectedAgentUuids, setSelectedAgentUuids] = useState<string[] | null>(null)
  const availableAgentUuids = useMemo(() => new Set(agentOptions.map((option) => option.agentUuid)), [agentOptions])
  const allAgentUuids = useMemo(() => agentOptions.map((option) => option.agentUuid), [agentOptions])
  const effectiveSelectedAgentUuids = useMemo(
    () => (selectedAgentUuids ?? allAgentUuids).filter((agentUuid) => availableAgentUuids.has(agentUuid)),
    [allAgentUuids, availableAgentUuids, selectedAgentUuids],
  )
  const filteredTasks = useMemo(
    () => filterTasksBySelectedAgents(tasks, effectiveSelectedAgentUuids),
    [effectiveSelectedAgentUuids, tasks],
  )
  const { combinedResults, total, isLoading, error } = useMtrListsForTasks(filteredTasks, timeRange)
  const [selectedResultUuid, setSelectedResultUuid] = useState<string>('')
  const selectedResult = combinedResults.some((result) => result.result_uuid === selectedResultUuid)
    ? selectedResultUuid
    : combinedResults[0]?.result_uuid || ''
  const { data: mtrDetail, isLoading: detailLoading } = useMtrDetail(selectedResult)

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-bg-surface">
      <MtrEvidenceToolbar
        tasks={tasks}
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
          <NoAgentSelectedText />
        </div>
      ) : error ? (
        <div className="p-6 text-sm text-status-error-fg">{t('monitoring.mtrDataLoadFailed', { message: error.message })}</div>
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

function Iperf3ProtocolPanel({
  tasks,
  timeRange,
  onTimeRangeChange,
}: {
  tasks: MonitoringTask[]
  timeRange: MonitoringTimeRange
  onTimeRangeChange: (range: MonitoringTimeRange) => void
}) {
  const { t } = useTranslation()
  const agentOptions = useMemo(() => buildAgentFilterOptions(tasks), [tasks])
  const [selectedAgentUuids, setSelectedAgentUuids] = useState<string[] | null>(null)
  const availableAgentUuids = useMemo(() => new Set(agentOptions.map((option) => option.agentUuid)), [agentOptions])
  const allAgentUuids = useMemo(() => agentOptions.map((option) => option.agentUuid), [agentOptions])
  const effectiveSelectedAgentUuids = useMemo(
    () => (selectedAgentUuids ?? allAgentUuids).filter((agentUuid) => availableAgentUuids.has(agentUuid)),
    [allAgentUuids, availableAgentUuids, selectedAgentUuids],
  )
  const filteredTasks = useMemo(
    () => filterTasksBySelectedAgents(tasks, effectiveSelectedAgentUuids),
    [effectiveSelectedAgentUuids, tasks],
  )
  const { combinedResults, total, isLoading, error } = useIperf3ListsForTasks(filteredTasks, timeRange)
  const [selectedResultUuid, setSelectedResultUuid] = useState<string>('')
  const selectedResult = combinedResults.some((result) => result.result_uuid === selectedResultUuid)
    ? selectedResultUuid
    : combinedResults[0]?.result_uuid || ''

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-bg-surface">
      <Iperf3EvidenceToolbar
        tasks={tasks}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
        agentOptions={agentOptions}
        selectedAgentUuids={effectiveSelectedAgentUuids}
        onSelectedAgentUuidsChange={setSelectedAgentUuids}
      />
      {tasks.length === 0 ? (
        <EmptyProtocolState protocol={protocolLabel('iperf3')} />
      ) : filteredTasks.length === 0 ? (
        <div className="p-8 text-center">
          <Users className="mx-auto h-7 w-7 text-text-dim" />
          <NoAgentSelectedText />
        </div>
      ) : error ? (
        <div className="p-6 text-sm text-status-error-fg">{t('monitoring.iperf3DataLoadFailed', { message: error.message })}</div>
      ) : (
        <div className="p-4">
          <Iperf3ResultViews
            tasks={filteredTasks}
            results={combinedResults}
            total={total}
            selectedResultUuid={selectedResult}
            onSelectResult={setSelectedResultUuid}
            listLoading={isLoading}
          />
        </div>
      )}
    </section>
  )
}

function TargetSummary({ group }: { group: MonitoringTargetGroup }) {
  const { t, i18n } = useTranslation()
  const status = statusCopy(t)[group.status]
  const statusLabel = group.status === 'missing'
    ? `${t('common.lastUpdated')} ${formatLatestSample(latestTaskUpdate(group.tasks), i18n.language, t('monitoring.noSample'))}`
    : status.label
  const targetDescription = group.target.comment?.trim() || group.target.description?.trim() || t('monitoring.targetDescriptionEmpty')
  return (
    <section aria-label={group.target.name} className="rounded-xl border border-border bg-bg-surface">
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
              {formatTargetLocation(group.target, t('monitoring.locationUnknown'))}
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
      <div className="p-4">
        <div className="rounded-lg border border-border bg-bg-surface-light px-3 py-2.5">
          <div className="text-[10px] uppercase text-text-dim">{t('monitoring.targetDescription')}</div>
          <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{targetDescription}</div>
        </div>
      </div>
    </section>
  )
}

export function TargetMonitoringPanel({
  targetUuid,
  fallbackGroup,
}: {
  targetUuid: string
  fallbackGroup?: MonitoringTargetGroup
  basePath: '/monitoring' | '/app/monitoring'
}) {
  const { t } = useTranslation()
  const { data, isLoading, error, refetch } = usePublicMonitoringTasks({
    pageSize: 100,
    targetUuid,
  })
  const [icmpTimeRange, setIcmpTimeRange] = useState<MonitoringTimeRange>(() => createRelativeTimeRange())
  const [tcpTimeRange, setTcpTimeRange] = useState<MonitoringTimeRange>(() => createRelativeTimeRange())
  const [mtrTimeRange, setMtrTimeRange] = useState<MonitoringTimeRange>(() => createRelativeTimeRange())
  const [iperf3TimeRange, setIperf3TimeRange] = useState<MonitoringTimeRange>(() => createRelativeTimeRange())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIcmpTimeRange((current) => refreshRelativeTimeRange(current))
      setTcpTimeRange((current) => refreshRelativeTimeRange(current))
      setMtrTimeRange((current) => refreshRelativeTimeRange(current))
      setIperf3TimeRange((current) => refreshRelativeTimeRange(current))
    }, AUTO_REFRESH_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [])

  const group = data?.groups[0] ?? fallbackGroup
  const icmpTasks = useMemo(() => protocolTasks(group?.tasks ?? [], 'icmp'), [group?.tasks])
  const tcpTasks = useMemo(() => protocolTasks(group?.tasks ?? [], 'tcp'), [group?.tasks])
  const mtrTasks = useMemo(() => protocolTasks(group?.tasks ?? [], 'mtr'), [group?.tasks])
  const iperf3Tasks = useMemo(() => protocolTasks(group?.tasks ?? [], 'iperf3'), [group?.tasks])

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
        <div className="text-sm font-medium text-status-error-fg">{t('monitoring.targetDataLoadFailed')}</div>
        <div className="mt-1 text-xs text-status-error-fg/80">{t('monitoring.targetDataLoadFailedDesc')}</div>
        <Button className="mt-3" size="sm" variant="outline" onClick={() => void refetch()}>
          {t('common.retry')}
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
      <Iperf3ProtocolPanel tasks={iperf3Tasks} timeRange={iperf3TimeRange} onTimeRangeChange={setIperf3TimeRange} />
    </div>
  )
}

function NoAgentSelectedText() {
  const { t } = useTranslation()
  return (
    <>
      <div className="mt-3 text-sm font-medium text-text-primary">{t('monitoring.noAgentSelectedTitle')}</div>
      <div className="mt-1 text-xs text-text-muted">{t('monitoring.noAgentSelectedDesc')}</div>
    </>
  )
}
