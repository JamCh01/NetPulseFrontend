import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { AgentSeriesData } from '@/features/monitoring/lib/build-multi-agent-option'
import type { MonitoringMetricProtocol } from '@/features/monitoring/lib/monitoring-data-point'
import { formatMetricValue, getMetricColumns, normalizeProtocol, summarizeAgentMetricRows } from '@/features/monitoring/lib/protocol-metrics'
import { cn } from '@/lib/utils'

interface MetricDetailTableProps {
  protocol: MonitoringMetricProtocol
  agentSeries: AgentSeriesData[]
  isLoading?: boolean
  isUpdating?: boolean
  className?: string
}

function MetricDetailTableInner({
  protocol,
  agentSeries,
  isLoading = false,
  isUpdating = false,
  className,
}: MetricDetailTableProps) {
  const { t } = useTranslation()
  const normalizedProtocol = normalizeProtocol(protocol)
  const columns = useMemo(() => getMetricColumns(normalizedProtocol), [normalizedProtocol])
  const rows = useMemo(() => summarizeAgentMetricRows(agentSeries, normalizedProtocol), [agentSeries, normalizedProtocol])
  const hasRows = rows.length > 0
  const title = t('monitoring.detailMetricsTitle', { protocol: normalizedProtocol.toUpperCase() })

  if (isLoading && !hasRows) {
    return (
      <div className={cn('rounded-xl border border-border bg-bg-surface p-4', className)}>
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="mt-3 h-32 rounded bg-muted/60" />
      </div>
    )
  }

  return (
    <section className={cn('overflow-hidden rounded-xl border border-border bg-bg-surface', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <p className="mt-0.5 text-xs text-text-muted">{t('monitoring.detailMetricsDesc')}</p>
        </div>
        {isUpdating && hasRows && (
          <span className="rounded border border-accent-border bg-accent/10 px-2 py-1 text-[10px] font-medium text-accent">
            {t('common.loading')}
          </span>
        )}
      </div>

      {!hasRows ? (
        <div className="p-6 text-center text-sm text-text-muted">{t('monitoring.noDetailMetrics')}</div>
      ) : (
        <div className="max-h-[420px] overflow-auto">
          <table aria-label={title} className="min-w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-bg-surface">
              <tr className="border-b border-border">
                <th className="whitespace-nowrap px-3 py-2 font-medium text-text-muted">{t('monitoring.agent')}</th>
                {columns.map((column) => (
                  <th key={String(column.key)} className="whitespace-nowrap px-3 py-2 text-right font-medium text-text-muted">
                    {t(column.labelKey)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.agentUuid} className="border-b border-border/60 hover:bg-muted/30">
                  <td className="whitespace-nowrap px-3 py-2 text-text-primary">{row.agentName}</td>
                  {columns.map((column) => (
                    <td key={String(column.key)} className="whitespace-nowrap px-3 py-2 text-right font-[family-name:var(--font-mono)] text-text-secondary">
                      {formatMetricValue(row.point[column.key], column.kind)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export const MetricDetailTable = memo(MetricDetailTableInner)
MetricDetailTable.displayName = 'MetricDetailTable'
