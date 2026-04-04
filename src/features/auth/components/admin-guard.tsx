import { Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'

export function AdminGuard() {
  const { t } = useTranslation()
  const isAdmin = useAuthStore((s) => s.isAdmin())

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-6xl font-bold text-text-muted font-mono">403</div>
        <p className="text-text-muted text-sm">{t('auth.forbidden')}</p>
      </div>
    )
  }

  return <Outlet />
}
