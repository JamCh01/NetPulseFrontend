import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useHealth } from '@/api/hooks/use-health'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'

const COMPONENT_KEYS = ['postgres', 'redis', 'nats', 'victoriametrics'] as const

export function HealthCard() {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useHealth()
  const healthApiUnsupported = Boolean((data as { __unsupported?: boolean } | undefined)?.__unsupported)

  if (isLoading) {
    return <Skeleton className="h-24 w-full rounded-xl" />
  }

  if (isError || !data) {
    return (
      <div className="glass-light rounded-xl p-4">
        <p className="text-status-error-fg text-xs">{t('health.failedToLoad')}</p>
      </div>
    )
  }

  const health = data as { status: string; components: Record<string, string> }
  const isOk = health.status === 'ok'

  return (
    <div className="glass-light rounded-xl p-4 relative group">
      {healthApiUnsupported && (
        <div className="mb-3 rounded-md border border-status-warning-border bg-status-warning-bg px-2 py-1 text-[10px] text-status-warning-fg">
          Missing API: <code>/api/v1/health</code> (fallback to <code>/health</code>)
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <Link to="/system/health" className="flex items-center gap-1 group/title">
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider group-hover/title:text-text-primary transition-colors">
            {t('health.title')}
          </h3>
          <ChevronRight className="w-3 h-3 text-text-dim group-hover/title:text-accent-foreground transition-all group-hover/title:translate-x-0.5 opacity-0 group-hover/title:opacity-100" />
        </Link>
        <Badge variant={isOk ? 'success' : 'warning'} className="text-[10px]">
          {isOk ? t('health.ok') : t('health.degraded')}
        </Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {COMPONENT_KEYS.map((key) => {
          const status = health.components?.[key] ?? 'error'
          const isComponentOk = status === 'ok'
          return (
            <div key={key} className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isComponentOk ? 'bg-status-success-solid' : 'bg-status-error-solid'
              }`} />
              <span className="text-xs text-text-secondary font-medium">{t(`health.${key}`)}</span>
              {!isComponentOk && (
                <span className="text-[10px] text-status-error-fg ml-auto">{t(`health.${status}`)}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
