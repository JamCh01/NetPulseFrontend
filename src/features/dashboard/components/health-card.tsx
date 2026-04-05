import { useTranslation } from 'react-i18next'
import { useHealth } from '@/api/hooks/use-health'
import { Skeleton } from '@/components/ui/skeleton'

const COMPONENT_KEYS = ['postgres', 'redis', 'nats', 'victoriametrics'] as const

export function HealthCard() {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useHealth()

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />
  }

  if (isError || !data) {
    return (
      <div className="glass-light rounded-xl p-4">
        <p className="text-red-400 text-xs">{t('health.failedToLoad')}</p>
      </div>
    )
  }

  const health = data as { status: string; components: Record<string, string> }
  const isOk = health.status === 'ok'

  return (
    <div className="glass-light rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">{t('health.title')}</h3>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
          isOk ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'
        }`}>
          {isOk ? t('health.ok') : t('health.degraded')}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {COMPONENT_KEYS.map((key) => {
          const status = health.components?.[key] ?? 'error'
          const isComponentOk = status === 'ok'
          return (
            <div key={key} className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isComponentOk ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <span className="text-[11px] text-text-secondary">{t(`health.${key}`)}</span>
              {!isComponentOk && (
                <span className="text-[9px] text-red-400 ml-auto">{t(`health.${status}`)}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
