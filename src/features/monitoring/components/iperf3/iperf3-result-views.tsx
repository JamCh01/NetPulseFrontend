import { Activity, Clock3, Gauge, GitBranch, HardDriveDownload, RadioTower, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { buildIperf3TimelineItems, colorForIperf3Agent } from '@/features/monitoring/lib/iperf3-views'
import { formatLatestSample, type Iperf3ResultSummaryView, type MonitoringTask } from '@/features/monitoring/lib/monitoring-models'

export function Iperf3ResultViews({
  tasks,
  results,
  total,
  selectedResultUuid,
  onSelectResult,
  listLoading,
}: {
  tasks: MonitoringTask[]
  results: Iperf3ResultSummaryView[]
  total: number
  selectedResultUuid: string
  onSelectResult: (resultUuid: string) => void
  listLoading?: boolean
}) {
  const successCount = results.filter((result) => result.success).length
  const failedCount = results.length - successCount
  const latest = results[0]
  const selectedResult = results.find((result) => result.result_uuid === selectedResultUuid)
  const peakMbps = results.reduce<number | null>((peak, result) => {
    if (typeof result.throughput_mbps !== 'number') return peak
    return peak === null ? result.throughput_mbps : Math.max(peak, result.throughput_mbps)
  }, null)
  const timelineItems = buildIperf3TimelineItems(tasks, results)
  const timelineAgents = Array.from(
    new Map(timelineItems.map((item) => [item.agentUuid, item.agentName])).entries(),
  ).map(([agentUuid, agentName]) => ({ agentUuid, agentName, color: colorForIperf3Agent(agentUuid) }))

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-5">
        <Iperf3SummaryPill label="Result" value={String(total)} icon={RadioTower} />
        <Iperf3SummaryPill label="成功" value={String(successCount)} icon={Activity} tone="success" />
        <Iperf3SummaryPill label="失败" value={String(failedCount)} icon={Activity} tone={failedCount > 0 ? 'error' : 'success'} />
        <Iperf3SummaryPill label="峰值 Mbps" value={formatMbps(peakMbps)} icon={Gauge} />
        <Iperf3SummaryPill label="最近" value={formatLatestSample(latest?.timestamp)} icon={Clock3} />
      </div>

      <Iperf3ResultTimeline
        items={timelineItems}
        agents={timelineAgents}
        selectedResultUuid={selectedResultUuid}
        onSelectResult={onSelectResult}
        isLoading={listLoading}
      />

      <Iperf3DetailPanel result={selectedResultUuid ? selectedResult : undefined} isLoading={listLoading && !selectedResult} />
    </div>
  )
}

function Iperf3SummaryPill({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  tone?: 'success' | 'error'
}) {
  const toneClass = tone === 'success' ? 'text-status-success-fg' : tone === 'error' ? 'text-status-error-fg' : 'text-text-primary'
  return (
    <div className="rounded-md border border-border bg-bg-surface-light px-2.5 py-2">
      <div className="flex items-center justify-between gap-2 text-[10px] uppercase text-text-dim">
        {label}
        <Icon className={`h-3.5 w-3.5 ${toneClass}`} />
      </div>
      <div className={`mt-1 truncate font-mono text-xs font-semibold ${toneClass}`}>{value}</div>
    </div>
  )
}

function Iperf3ResultTimeline({
  items,
  agents,
  selectedResultUuid,
  onSelectResult,
  isLoading,
}: {
  items: ReturnType<typeof buildIperf3TimelineItems>
  agents: Array<{ agentUuid: string; agentName: string; color: string }>
  selectedResultUuid: string
  onSelectResult: (resultUuid: string) => void
  isLoading?: boolean
}) {
  if (isLoading && items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface-light p-4">
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-bg-surface">
      <div className="flex flex-col gap-1 border-b border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs font-semibold text-text-primary">iperf3 Result 时间轴</div>
        <div className="flex flex-wrap gap-3 text-[11px] text-text-muted">
          {agents.map((agent) => (
            <span key={agent.agentUuid} className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: agent.color }} />
              {agent.agentName}
            </span>
          ))}
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-status-error-fg" />
            失败
          </span>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="px-3 py-6 text-center text-xs text-text-muted">当前 Agent 和时间范围内没有 iperf3 result。</div>
      ) : (
        <div className="overflow-x-auto px-4 py-5">
          <div className="relative flex min-w-max items-start gap-8">
            <div className="absolute left-0 right-0 top-[0.65rem] h-px bg-border" />
            {items.map((item) => {
              const active = item.resultUuid === selectedResultUuid
              const agentColor = colorForIperf3Agent(item.agentUuid)
              return (
                <button
                  key={item.resultUuid}
                  type="button"
                  onClick={() => onSelectResult(item.resultUuid)}
                  className="group relative flex w-28 flex-col items-center gap-2 text-center"
                  title={`${item.agentName} ${new Date(item.timestamp).toLocaleString()} ${formatMbps(item.throughputMbps)}`}
                >
                  <span
                    style={{ backgroundColor: agentColor, borderColor: item.success ? agentColor : 'var(--status-error-fg)' }}
                    className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-transform group-hover:scale-110 ${
                      active ? 'ring-2 ring-accent-foreground ring-offset-2 ring-offset-bg-surface' : ''
                    }`}
                  >
                    {active && <Clock3 className="h-3 w-3 text-bg-surface" />}
                  </span>
                  <span className="line-clamp-1 text-[11px] font-medium text-text-primary">{formatLatestSample(item.timestamp)}</span>
                  <span className="line-clamp-1 text-[10px] text-text-muted">{item.agentName}</span>
                  <span className="font-mono text-[10px] text-text-dim">{formatMbps(item.throughputMbps)}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function Iperf3DetailPanel({
  result,
  isLoading,
}: {
  result?: Iperf3ResultSummaryView
  isLoading?: boolean
}) {
  if (isLoading && !result) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-4">
        <Skeleton className="h-6 w-48" />
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-16 w-full" />)}
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-8 text-center">
        <div className="text-sm font-medium text-text-primary">选择一个 iperf3 result</div>
        <div className="mt-1 text-xs text-text-muted">从上方时间线选择一次执行结果后查看吞吐、重传和执行参数。</div>
      </div>
    )
  }

  const modeLabel = result.mode === 'multi_thread' ? '多线程' : '单线程'

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-bg-surface">
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={result.success ? 'success' : 'error'}>
            {result.success ? '执行成功' : '执行失败'}
          </Badge>
          <Badge variant="info">{modeLabel}</Badge>
          <span className="font-mono text-xs text-text-muted">{result.result_uuid}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
          <span>{new Date(result.timestamp).toLocaleString()}</span>
          <span>{result.parallel} 线程</span>
          <span>{result.duration_sec}s</span>
          <span>:{result.port}</span>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
        <Iperf3DetailMetric label="吞吐" value={formatMbps(result.throughput_mbps)} icon={Gauge} prominent />
        <Iperf3DetailMetric label="传输字节" value={formatBytes(result.bytes)} icon={HardDriveDownload} />
        <Iperf3DetailMetric label="重传" value={result.retransmits === null || result.retransmits === undefined ? '-' : String(result.retransmits)} icon={RotateCcw} />
        <Iperf3DetailMetric label="并发线程" value={String(result.parallel)} icon={GitBranch} />
        <Iperf3DetailMetric label="端口" value={String(result.port)} icon={RadioTower} />
        <Iperf3DetailMetric label="执行时长" value={`${result.duration_sec}s`} icon={Clock3} />
        <Iperf3DetailMetric label="Resolved IP" value={result.resolved_ip ?? '-'} icon={Activity} />
        <Iperf3DetailMetric label="运行状态" value={result.latest_run_status || '-'} icon={Activity} />
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="grid gap-2 text-xs text-text-muted md:grid-cols-3">
          <span>Started: {result.started_at ? new Date(result.started_at).toLocaleString() : '-'}</span>
          <span>Finished: {result.finished_at ? new Date(result.finished_at).toLocaleString() : '-'}</span>
          <span>Duration: {typeof result.duration_ms === 'number' ? `${result.duration_ms}ms` : '-'}</span>
        </div>
      </div>
    </div>
  )
}

function Iperf3DetailMetric({
  label,
  value,
  icon: Icon,
  prominent,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  prominent?: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-bg-surface-light px-3 py-2.5">
      <div className="flex items-center justify-between gap-2 text-[10px] uppercase text-text-dim">
        {label}
        <Icon className="h-3.5 w-3.5 text-accent-foreground" />
      </div>
      <div className={`mt-1 truncate font-mono font-semibold ${prominent ? 'text-lg text-text-primary' : 'text-sm text-text-secondary'}`}>
        {value}
      </div>
    </div>
  )
}

function formatMbps(value?: number | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-'
  if (value >= 1000) return `${(value / 1000).toFixed(2)} Gbps`
  return `${value.toFixed(value >= 100 ? 0 : 1)} Mbps`
}

function formatBytes(value?: number | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let current = value
  let unitIndex = 0
  while (current >= 1024 && unitIndex < units.length - 1) {
    current /= 1024
    unitIndex += 1
  }
  return `${current.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}
