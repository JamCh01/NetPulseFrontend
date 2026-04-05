import { useTranslation } from 'react-i18next'
import type { MtrResultDetail } from '@/api/generated/types.gen'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

interface MtrDetailTableProps {
  result?: MtrResultDetail
  isLoading?: boolean
}

export function MtrDetailTable({ result, isLoading }: MtrDetailTableProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="glass-light rounded-xl overflow-hidden">
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="glass-light rounded-xl p-6 text-center">
        <p className="text-text-muted text-sm">
          {t('monitoring.selectMtrResult')}
        </p>
      </div>
    )
  }

  return (
    <div className="glass-light rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge
              className={`border text-xs uppercase ${
                result.target_reached
                  ? 'border-emerald-500/50 text-emerald-400'
                  : 'border-red-500/50 text-red-400'
              }`}
            >
              {result.target_reached ? t('monitoring.targetReached') : t('monitoring.targetFailed')}
            </Badge>
            <span className="text-xs text-text-secondary font-[family-name:var(--font-mono)]">
              {t('monitoring.totalHops')}: {result.total_hops}
            </span>
          </div>
          <span className="text-xs text-text-muted font-[family-name:var(--font-mono)]">
            {new Date(result.timestamp).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-2.5 text-[10px] text-text-muted uppercase tracking-wider font-medium">
                {t('monitoring.hop')}
              </th>
              <th className="text-left px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider font-medium">
                {t('monitoring.ip')}
              </th>
              <th className="text-left px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider font-medium">
                {t('monitoring.hostname')}
              </th>
              <th className="text-right px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider font-medium">
                {t('monitoring.avg')}
              </th>
              <th className="text-right px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider font-medium">
                {t('monitoring.min')}
              </th>
              <th className="text-right px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider font-medium">
                {t('monitoring.max')}
              </th>
              <th className="text-right px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider font-medium">
                {t('monitoring.loss')}
              </th>
              <th className="text-right px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider font-medium">
                {t('monitoring.sent')}
              </th>
              <th className="text-right px-4 py-2.5 text-[10px] text-text-muted uppercase tracking-wider font-medium">
                {t('monitoring.received')}
              </th>
            </tr>
          </thead>
          <tbody>
            {result.hops.map((hop) => (
              <tr
                key={hop.hop}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-4 py-2.5">
                  <span className="text-xs text-text-primary font-medium font-[family-name:var(--font-mono)]">
                    {hop.hop}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="text-xs text-text-primary font-[family-name:var(--font-mono)]">
                    {hop.ip}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="text-xs text-text-secondary font-[family-name:var(--font-mono)]">
                    {hop.hostname || hop.ptr || '-'}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className="text-xs text-text-secondary font-[family-name:var(--font-mono)]">
                    {hop.avg_rtt.toFixed(1)}ms
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className="text-xs text-text-secondary font-[family-name:var(--font-mono)]">
                    {hop.min_rtt.toFixed(1)}ms
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className="text-xs text-text-secondary font-[family-name:var(--font-mono)]">
                    {hop.max_rtt.toFixed(1)}ms
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span
                    className={`text-xs font-[family-name:var(--font-mono)] ${
                      hop.packet_loss_pct > 0 ? 'text-red-400' : 'text-green-400'
                    }`}
                  >
                    {hop.packet_loss_pct.toFixed(1)}%
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className="text-xs text-text-dim font-[family-name:var(--font-mono)]">
                    {hop.sent ?? '-'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="text-xs text-text-dim font-[family-name:var(--font-mono)]">
                    {hop.received ?? '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
