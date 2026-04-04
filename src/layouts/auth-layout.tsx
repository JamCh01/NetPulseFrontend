import { Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'

export function AuthLayout() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen gradient-bg grid-pattern flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xl font-bold text-text-primary tracking-tight">{t('nav.brand')}</span>
        </div>

        {/* Form container */}
        <div className="glass rounded-2xl p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
