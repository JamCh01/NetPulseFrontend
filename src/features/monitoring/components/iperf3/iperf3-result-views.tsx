import { useTranslation } from 'react-i18next'
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
  const { t, i18n } = useTranslation()
  const successCount = results.filter((result) => result.success).length
  const failedCount = results.length - successCount
  const latest = results[0]
  const selectedResult = results.find((result) => result.result_uuid === selectedResultUuid)
  const peakUploadMbps = results.reduce<number | null>((peak, result) => {
    if (typeof result.upload_mbps !== 'number') return peak
    return peak === null ? result.upload_mbps : Math.max(peak, result.upload_mbps)
  }, null)
  const peakDownloadMbps = results.reduce<number | null>((peak, result) => {
    if (typeof result.download_mbps !== 'number') return peak
    return peak === null ? result.download_mbps : Math.max(peak, result.download_mbps)
  }, null)
  const timelineItems = buildIperf3TimelineItems(tasks, results)
  const timelineAgents = Array.from(
    new Map(timelineItems.map((item) => [item.agentUuid, item.agentName])).entries(),
  ).map(([agentUuid, agentName]) => ({ agentUuid, agentName, color: colorForIperf3Agent(agentUuid) }))

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-6">
        <Iperf3SummaryPill label="Result" value={String(total)} icon={RadioTower} />
        <Iperf3SummaryPill label={t('common.success')} value={String(successCount)} icon={Activity} tone="success" />
        <Iperf3SummaryPill label={t('common.failed')} value={String(failedCount)} icon={Activity} tone={failedCount > 0 ? 'error' : 'success'} />
        <Iperf3SummaryPill label={t('monitoring.uploadPeak')} value={formatMbps(peakUploadMbps)} icon={Gauge} />
        <Iperf3SummaryPill label={t('monitoring.downloadPeak')} value={formatMbps(peakDownloadMbps)} icon={HardDriveDownload} />
        <Iperf3SummaryPill label={t('monitoring.latest')} value={formatLatestSample(latest?.timestamp, i18n.language, t('monitoring.noSample'))} icon={Clock3} />
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
  const { t, i18n } = useTranslation()
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
        <div className="text-xs font-semibold text-text-primary">{t('monitoring.resultTimeline', { name: 'iperf3' })}</div>
        <div className="flex flex-wrap gap-3 text-[11px] text-text-muted">
          {agents.map((agent) => (
            <span key={agent.agentUuid} className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: agent.color }} />
              {agent.agentName}
            </span>
          ))}
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-status-error-fg" />
            {t('common.failed')}
          </span>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="px-3 py-6 text-center text-xs text-text-muted">{t('monitoring.noIperf3ResultInRange')}</div>
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
                  title={t('monitoring.timelineTitleUploadDownload', {
                    agent: item.agentName,
                    time: new Date(item.timestamp).toLocaleString(),
                    upload: formatMbps(item.uploadMbps),
                    download: formatMbps(item.downloadMbps),
                  })}
                >
                  <span
                    style={{ backgroundColor: agentColor, borderColor: item.success ? agentColor : 'var(--status-error-fg)' }}
                    className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-transform group-hover:scale-110 ${
                      active ? 'ring-2 ring-accent-foreground ring-offset-2 ring-offset-bg-surface' : ''
                    }`}
                  >
                    {active && <Clock3 className="h-3 w-3 text-bg-surface" />}
                  </span>
                  <span className="line-clamp-1 text-[11px] font-medium text-text-primary">{formatLatestSample(item.timestamp, i18n.language, t('monitoring.noSample'))}</span>
                  <span className="line-clamp-1 text-[10px] text-text-muted">{item.agentName}</span>
                  <span className="font-mono text-[10px] text-text-dim">↑ {formatMbps(item.uploadMbps)}</span>
                  <span className="font-mono text-[10px] text-text-dim">↓ {formatMbps(item.downloadMbps)}</span>
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
  const { t } = useTranslation()
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
        <div className="text-sm font-medium text-text-primary">{t('monitoring.selectIperf3Result')}</div>
        <div className="mt-1 text-xs text-text-muted">{t('monitoring.selectIperf3ResultDesc')}</div>
      </div>
    )
  }

  const modeLabel = result.mode === 'multi_thread' ? t('monitoring.multiThread') : t('monitoring.singleThread')

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-bg-surface">
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={result.success ? 'success' : 'error'}>
            {result.success ? t('monitoring.runSuccess') : t('monitoring.runFailed')}
          </Badge>
          <Badge variant="info">{modeLabel}</Badge>
          <span className="font-mono text-xs text-text-muted">{result.result_uuid}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
          <span>{new Date(result.timestamp).toLocaleString()}</span>
          <span>{t('monitoring.threads', { count: result.parallel })}</span>
          <span>{result.duration_sec}s</span>
          <span>:{result.port}</span>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
        <Iperf3DetailMetric label={t('monitoring.uploadBandwidth')} value={formatMbps(result.upload_mbps)} icon={Gauge} prominent />
        <Iperf3DetailMetric label={t('monitoring.downloadBandwidth')} value={formatMbps(result.download_mbps)} icon={HardDriveDownload} prominent />
        <Iperf3DetailMetric label={t('monitoring.uploadBytes')} value={formatBytes(result.upload_bytes)} icon={HardDriveDownload} />
        <Iperf3DetailMetric label={t('monitoring.downloadBytes')} value={formatBytes(result.download_bytes)} icon={HardDriveDownload} />
        <Iperf3DetailMetric label={t('monitoring.uploadRetransmits')} value={result.upload_retransmits === null || result.upload_retransmits === undefined ? '-' : String(result.upload_retransmits)} icon={RotateCcw} />
        <Iperf3DetailMetric label={t('monitoring.downloadRetransmits')} value={result.download_retransmits === null || result.download_retransmits === undefined ? '-' : String(result.download_retransmits)} icon={RotateCcw} />
        <Iperf3DetailMetric label={t('monitoring.parallelThreads')} value={String(result.parallel)} icon={GitBranch} />
        <Iperf3DetailMetric label={t('monitoring.port')} value={String(result.port)} icon={RadioTower} />
        <Iperf3DetailMetric label={t('monitoring.duration')} value={`${result.duration_sec}s`} icon={Clock3} />
        <Iperf3DetailMetric label={t('monitoring.runStatus')} value={result.latest_run_status || '-'} icon={Activity} />
      </div>

      <Iperf3ProcessPanel result={result} />

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

function Iperf3ProcessPanel({ result }: { result: Iperf3ResultSummaryView }) {
  const { t } = useTranslation()
  const uploadCpu = readNestedNumber(result.upload_end, ['cpu_utilization_percent', 'host_total'])
  const downloadCpu = readNestedNumber(result.download_end, ['cpu_utilization_percent', 'host_total'])
  const uploadCongestion = readNestedString(result.upload_end, ['sender_tcp_congestion'])
  const downloadCongestion = readNestedString(result.download_end, ['receiver_tcp_congestion'])

  return (
    <div className="border-t border-border p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_18rem]">
        <Iperf3IntervalTable title={t('monitoring.uploadProcess')} intervals={result.upload_intervals} />
        <Iperf3IntervalTable title={t('monitoring.downloadProcess')} intervals={result.download_intervals} />
        <div className="rounded-lg border border-border bg-bg-surface-light p-3">
          <div className="text-xs font-semibold text-text-primary">{t('monitoring.finalStats')}</div>
          <div className="mt-3 space-y-2 text-xs text-text-muted">
            <div className="flex justify-between gap-3">
              <span>{t('monitoring.uploadCpu')}</span>
              <span className="font-mono text-text-secondary">{formatPercent(uploadCpu)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>{t('monitoring.downloadCpu')}</span>
              <span className="font-mono text-text-secondary">{formatPercent(downloadCpu)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>{t('monitoring.senderCongestion')}</span>
              <span className="font-mono text-text-secondary">{uploadCongestion ?? '-'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>{t('monitoring.receiverCongestion')}</span>
              <span className="font-mono text-text-secondary">{downloadCongestion ?? '-'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>{t('monitoring.uploadInterval')}</span>
              <span className="font-mono text-text-secondary">{result.upload_intervals.length}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>{t('monitoring.downloadInterval')}</span>
              <span className="font-mono text-text-secondary">{result.download_intervals.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Iperf3IntervalTable({
  title,
  intervals,
}: {
  title: string
  intervals: Iperf3ResultSummaryView['upload_intervals']
}) {
  const { t } = useTranslation()
  const visibleIntervals = intervals.slice(0, 12)
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-bg-surface-light">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="text-xs font-semibold text-text-primary">{title}</div>
        <div className="font-mono text-[11px] text-text-muted">{intervals.length} slices</div>
      </div>
      {visibleIntervals.length === 0 ? (
        <div className="px-3 py-6 text-center text-xs text-text-muted">{t('monitoring.noProcessSlices')}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[30rem] text-left text-[11px]">
            <thead className="bg-bg-surface text-text-dim">
              <tr>
                <th className="px-3 py-2 font-medium">{t('monitoring.interval')}</th>
                <th className="px-3 py-2 font-medium">{t('monitoring.bandwidth')}</th>
                <th className="px-3 py-2 font-medium">{t('monitoring.bytes')}</th>
                <th className="px-3 py-2 font-medium">{t('monitoring.retransmits')}</th>
                <th className="px-3 py-2 font-medium">RTT</th>
                <th className="px-3 py-2 font-medium">RTTVar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleIntervals.map((interval, index) => (
                <tr key={`${interval.start ?? index}-${interval.end ?? index}`} className="text-text-secondary">
                  <td className="px-3 py-2 font-mono">{formatIntervalRange(interval.start, interval.end)}</td>
                  <td className="px-3 py-2 font-mono">{formatMbps(interval.mbps)}</td>
                  <td className="px-3 py-2 font-mono">{formatBytes(interval.bytes)}</td>
                  <td className="px-3 py-2 font-mono">{formatOptionalNumber(interval.retransmits)}</td>
                  <td className="px-3 py-2 font-mono">{formatMicroseconds(interval.rtt)}</td>
                  <td className="px-3 py-2 font-mono">{formatMicroseconds(interval.rttvar)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {intervals.length > visibleIntervals.length && (
        <div className="border-t border-border px-3 py-2 text-[11px] text-text-muted">{t('monitoring.showingFirstIntervals', { count: visibleIntervals.length })}</div>
      )}
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

function formatIntervalRange(start?: number | null, end?: number | null): string {
  if (typeof start !== 'number' || typeof end !== 'number') return '-'
  return `${start.toFixed(1)}-${end.toFixed(1)}s`
}

function formatOptionalNumber(value?: number | null): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '-'
}

function formatMicroseconds(value?: number | null): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${value} us` : '-'
}

function formatPercent(value?: number | null): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(1)}%` : '-'
}

function readNestedNumber(source: Record<string, unknown>, path: string[]): number | null {
  const value = readNestedValue(source, path)
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readNestedString(source: Record<string, unknown>, path: string[]): string | null {
  const value = readNestedValue(source, path)
  return typeof value === 'string' ? value : null
}

function readNestedValue(source: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = source
  for (const segment of path) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return null
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}
