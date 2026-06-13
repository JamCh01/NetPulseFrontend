import { useTranslation } from 'react-i18next'
import { Activity, Clock3, Route, Waypoints } from 'lucide-react'
import { MtrDetailTable } from '@/features/monitoring/components/mtr/mtr-detail-table'
import { buildMtrTimelineItems, colorForMtrAgent } from '@/features/monitoring/lib/mtr-views'
import { formatLatestSample, type MonitoringTask, type MtrResultDetailView, type MtrResultSummaryView } from '@/features/monitoring/lib/monitoring-models'

export function MtrResultViews({
  tasks,
  results,
  total,
  selectedResultUuid,
  onSelectResult,
  selectedResult,
  detailLoading,
  listLoading,
  resultName = 'MTR',
  noResultText,
  selectResultTitle,
  selectResultDesc,
}: {
  tasks: MonitoringTask[]
  results: MtrResultSummaryView[]
  total: number
  selectedResultUuid: string
  onSelectResult: (resultUuid: string) => void
  selectedResult?: MtrResultDetailView
  detailLoading?: boolean
  listLoading?: boolean
  resultName?: string
  noResultText?: string
  selectResultTitle?: string
  selectResultDesc?: string
}) {
  const { t, i18n } = useTranslation()
  const reachedCount = results.filter((result) => result.target_reached).length
  const failedCount = results.length - reachedCount
  const latest = results[0]
  const timelineItems = buildMtrTimelineItems(tasks, results)
  const timelineAgents = Array.from(
    new Map(timelineItems.map((item) => [item.agentUuid, item.agentName])).entries(),
  ).map(([agentUuid, agentName]) => ({ agentUuid, agentName, color: colorForMtrAgent(agentUuid) }))

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-4">
        <MtrSummaryPill label="Result" value={String(total)} icon={Waypoints} />
        <MtrSummaryPill label={t('monitoring.reached')} value={String(reachedCount)} icon={Activity} tone="success" />
        <MtrSummaryPill label={t('monitoring.unreached')} value={String(failedCount)} icon={Activity} tone={failedCount > 0 ? 'error' : 'success'} />
        <MtrSummaryPill label={t('monitoring.latest')} value={formatLatestSample(latest?.timestamp, i18n.language, t('monitoring.noSample'))} icon={Route} />
      </div>

      <MtrResultTimeline
        items={timelineItems}
        agents={timelineAgents}
        selectedResultUuid={selectedResultUuid}
        onSelectResult={onSelectResult}
        isLoading={listLoading}
        resultName={resultName}
        noResultText={noResultText}
      />

      <MtrDetailTable
        result={selectedResultUuid ? selectedResult : undefined}
        isLoading={selectedResultUuid ? detailLoading : false}
        showHeader={false}
        selectTitle={selectResultTitle}
        selectDescription={selectResultDesc}
      />
    </div>
  )
}

function MtrSummaryPill({
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

function MtrResultTimeline({
  items,
  agents,
  selectedResultUuid,
  onSelectResult,
  isLoading,
  resultName,
  noResultText,
}: {
  items: ReturnType<typeof buildMtrTimelineItems>
  agents: Array<{ agentUuid: string; agentName: string; color: string }>
  selectedResultUuid: string
  onSelectResult: (resultUuid: string) => void
  isLoading?: boolean
  resultName: string
  noResultText?: string
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
    <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-bg-surface">
      <div className="flex flex-col gap-1 border-b border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs font-semibold text-text-primary">{t('monitoring.resultTimeline', { name: resultName })}</div>
        <div className="flex flex-wrap gap-3 text-[11px] text-text-muted">
          {agents.map((agent) => (
            <span key={agent.agentUuid} className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: agent.color }} />
              {agent.agentName}
            </span>
          ))}
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-status-error-fg" />
            {t('monitoring.unreached')}
          </span>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="px-3 py-6 text-center text-xs text-text-muted">{noResultText ?? t('monitoring.noMtrResultInRange')}</div>
      ) : (
        <div data-testid="mtr-result-timeline-scroll" className="max-w-full overflow-x-auto px-4 py-5">
          <div className="relative flex w-max min-w-full items-start gap-8">
            <div className="absolute left-0 right-0 top-[0.65rem] h-px bg-border" />
            {items.map((item) => {
              const active = item.resultUuid === selectedResultUuid
              const agentColor = colorForMtrAgent(item.agentUuid)
              return (
                <button
                  key={item.resultUuid}
                  type="button"
                  onClick={() => onSelectResult(item.resultUuid)}
                  className="group relative flex w-28 flex-col items-center gap-2 text-center"
                  title={`${item.agentName} ${new Date(item.timestamp).toLocaleString()} ${item.totalHops} hops`}
                >
                  <span
                    style={{ backgroundColor: agentColor, borderColor: item.reached ? agentColor : 'var(--status-error-fg)' }}
                    className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-transform group-hover:scale-110 ${
                      active ? 'ring-2 ring-accent-foreground ring-offset-2 ring-offset-bg-surface' : ''
                    }`}
                  >
                    {active && <Clock3 className="h-3 w-3 text-bg-surface" />}
                  </span>
                  <span className="line-clamp-1 text-[11px] font-medium text-text-primary">{formatLatestSample(item.timestamp, i18n.language, t('monitoring.noSample'))}</span>
                  <span className="line-clamp-1 text-[10px] text-text-muted">{item.agentName}</span>
                  <span className="font-mono text-[10px] text-text-dim">{item.totalHops} hops</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
