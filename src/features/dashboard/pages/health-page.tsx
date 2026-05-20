import { useTranslation } from 'react-i18next'
import { useHealth } from '@/api/hooks/use-health'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCcw, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { formatDateTime } from '@/lib/format'

const COMPONENT_KEYS = ['postgres', 'redis', 'nats', 'victoriametrics'] as const

export default function HealthPage() {
  const { t, i18n } = useTranslation()
  const { data, isLoading, isError, refetch, isFetching } = useHealth()
  const healthApiUnsupported = Boolean((data as { __unsupported?: boolean } | undefined)?.__unsupported)

  const health = data as { status: string; components: Record<string, string>; timestamp?: string }
  const isOk = health?.status === 'ok'

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 className="w-5 h-5 text-status-success-solid" />
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-status-warning-solid" />
      default:
        return <XCircle className="w-5 h-5 text-status-error-solid" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variant = status === 'ok' ? 'success' : status === 'degraded' ? 'warning' : 'error'
    return (
      <Badge variant={variant} className="text-[10px] px-2 py-0.5">
        {t(`health.${status}`)}
      </Badge>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t('health.title')}</h1>
          <p className="text-sm text-text-muted mt-1">
            {health?.timestamp ? (
              <>
                {t('health.lastChecked')}: {formatDateTime(health.timestamp, i18n.language)}
              </>
            ) : (
              t('common.loading')
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCcw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          {i18n.language === 'en' ? 'Refresh' : '刷新'}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : isError || !data ? (
        <div className="glass-light rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-status-error-solid mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary">{t('health.failedToLoad')}</h3>
          <Button variant="link" onClick={() => refetch()} className="mt-2 text-accent-foreground">
            {t('common.retry') || 'Retry'}
          </Button>
        </div>
      ) : (
        <div>
          {healthApiUnsupported && (
            <div className="mb-4 rounded-lg border border-status-warning-border bg-status-warning-bg px-3 py-2 text-xs text-status-warning-fg">
              Missing API: <code>/api/v1/health</code> (fallback to <code>/health</code>)
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COMPONENT_KEYS.map((key) => {
            const status = health.components?.[key] ?? 'error'
            return (
              <div key={key} className="glass-light rounded-xl p-5 border border-border flex items-start gap-4 shadow-sm hover:shadow transition-shadow">
                <div className="p-2.5 rounded-lg bg-muted">
                  {getStatusIcon(status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-base font-bold text-text-primary tracking-tight">{t(`health.${key}`)}</h3>
                    {getStatusBadge(status)}
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {status === 'ok' 
                      ? (i18n.language === 'zh' ? '服务运行正常，连接响应及时。' : 'Service is healthy and responding normally.')
                      : (i18n.language === 'zh' ? '检测到服务异常，请检查后端日志。' : 'Service anomaly detected. Please check backend logs.')
                    }
                  </p>
                </div>
              </div>
            )
          })}
          </div>
        </div>
      )}

      {!isLoading && !isError && (
        <div className={`mt-8 p-4 rounded-xl border ${
          isOk 
            ? 'bg-status-success-bg/50 border-status-success-border' 
            : 'bg-status-warning-bg/50 border-status-warning-border'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isOk ? 'bg-status-success-solid' : 'bg-status-warning-solid'}`} />
            <p className="text-sm font-medium text-text-primary">
              {isOk 
                ? (i18n.language === 'zh' ? '所有核心系统组件均已就绪。' : 'All core system components are operational.')
                : (i18n.language === 'zh' ? '系统部分组件运行异常，可能影响部分功能。' : 'Some system components are degraded. This may affect some features.')
              }
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

