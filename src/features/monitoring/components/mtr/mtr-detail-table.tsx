import { useTranslation } from 'react-i18next'
import type { MtrResultDetailView } from '@/features/monitoring/lib/monitoring-models'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface MtrDetailTableProps {
  result?: MtrResultDetailView
  isLoading?: boolean
  showHeader?: boolean
}

export function MtrDetailTable({ result, isLoading, showHeader = true }: MtrDetailTableProps) {
  const { t } = useTranslation()
  if (isLoading && !result) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-4">
        <Skeleton className="h-6 w-48" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-9 w-full" />)}
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-8 text-center">
        <div className="text-sm font-medium text-text-primary">{t('monitoring.selectMtrResult')}</div>
        <div className="mt-1 text-xs text-text-muted">{t('monitoring.selectMtrResultDesc')}</div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-bg-surface">
      {showHeader && (
        <div className="flex flex-col gap-2 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={result.target_reached ? 'success' : 'error'}>
              {result.target_reached ? t('monitoring.targetReached') : t('monitoring.targetUnreached')}
            </Badge>
            <span className="font-mono text-xs text-text-muted">{result.result_uuid}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
            <span>{new Date(result.timestamp).toLocaleString()}</span>
            <span>{result.total_hops} hops</span>
            {result.resolved_ip && <span>resolved {result.resolved_ip}</span>}
            {typeof result.duration_ms === 'number' && <span>{result.duration_ms}ms</span>}
          </div>
        </div>
      )}

      {result.as_path.length > 0 && (
        <div className="border-b border-border px-4 py-3">
          <div className="mb-2 text-[10px] font-medium uppercase text-text-dim">AS Path</div>
          <div className="flex flex-wrap gap-1.5">
            {result.as_path.map((asn, index) => (
              <span key={`${asn}-${index}`} className="rounded-md border border-border bg-bg-surface-light px-2 py-1 font-mono text-xs text-text-secondary">
                {asn}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-border bg-bg-surface-light">
              <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase text-text-muted">Hop</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-medium uppercase text-text-muted">IP</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-medium uppercase text-text-muted">Hostname</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-medium uppercase text-text-muted">ASN</th>
              <th className="px-3 py-2.5 text-right text-[10px] font-medium uppercase text-text-muted">Loss</th>
              <th className="px-3 py-2.5 text-right text-[10px] font-medium uppercase text-text-muted">Avg</th>
              <th className="px-3 py-2.5 text-right text-[10px] font-medium uppercase text-text-muted">Best</th>
              <th className="px-4 py-2.5 text-right text-[10px] font-medium uppercase text-text-muted">Worst</th>
            </tr>
          </thead>
          <tbody>
            {result.hops.map((hop, index) => (
              <tr key={`${hop.hop}-${hop.ip}-${index}`} className="border-b border-border/70 hover:bg-bg-surface-light">
                <td className="px-4 py-2.5 font-mono text-xs font-semibold text-text-primary">{hop.hop}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-text-primary">{hop.ip}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-text-secondary">{hop.hostname ?? '-'}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-text-secondary">{hop.asn ?? '-'}</td>
                <td className={`px-3 py-2.5 text-right font-mono text-xs ${hop.packet_loss_pct > 0 ? 'text-status-error-fg' : 'text-status-success-fg'}`}>
                  {hop.packet_loss_pct.toFixed(1)}%
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-text-secondary">{hop.avg_ms.toFixed(1)}ms</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-text-secondary">{hop.best_ms.toFixed(1)}ms</td>
                <td className="px-4 py-2.5 text-right font-mono text-xs text-text-secondary">{hop.worst_ms.toFixed(1)}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
