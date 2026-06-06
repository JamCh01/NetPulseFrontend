import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { TargetGeoSidebarTree } from '@/features/monitoring/components/navigation/target-geo-sidebar-tree'
import {
  LogIn,
  Languages,
  Menu,
  X,
  Zap,
} from 'lucide-react'

export function PublicLayout() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const [tasksExpanded, setTasksExpanded] = useState(true)
  const [mobileMenuAnchorPath, setMobileMenuAnchorPath] = useState<string | null>(null)
  const mobileMenuOpen = mobileMenuAnchorPath === location.pathname
  const hideHeader = location.pathname.startsWith('/monitoring')

  return (
    <div className="min-h-screen gradient-bg grid-pattern flex">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuAnchorPath(null)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen glass flex flex-col z-40 w-(--sidebar-width) transition-transform duration-300',
          !mobileMenuOpen && '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-16 border-b border-border relative">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-gray-950" />
          </div>
          <span className="text-sm font-bold text-text-primary tracking-tight">{t('nav.brand')}</span>
          <button
            aria-label="Close menu"
            className="absolute right-3 p-1.5 md:hidden text-text-muted hover:text-text-primary"
            onClick={() => setMobileMenuAnchorPath(null)}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Tasks nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          <TargetGeoSidebarTree
            basePath="/monitoring"
            expanded={tasksExpanded}
            onToggle={() => setTasksExpanded(!tasksExpanded)}
            compact
          />
        </nav>

        {/* Bottom actions */}
        <div className="px-2 py-4 border-t border-border space-y-1">
          <button
            onClick={() => { const next = i18n.language === 'zh' ? 'en' : 'zh'; i18n.changeLanguage(next) }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-text-muted hover:text-text-secondary hover:bg-muted transition-colors w-full cursor-pointer"
          >
            <Languages className="w-4 h-4" />
            <span>{i18n.language === 'zh' ? 'English' : '中文'}</span>
          </button>
          {!isAuthenticated && (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-accent-foreground hover:bg-accent transition-colors w-full cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{t('auth.signIn')}</span>
            </button>
          )}
          {isAuthenticated && (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-accent-foreground hover:bg-accent transition-colors w-full cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>{t('nav.dashboard')}</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 overflow-x-hidden md:ml-(--sidebar-width) md:w-[calc(100%-var(--sidebar-width))]">
        {!hideHeader && (
          <header className="nav-blur sticky top-0 z-30 h-14 flex items-center justify-between px-4 md:px-6">
            <button
              aria-label="Open menu"
              className="p-1.5 md:hidden text-text-muted hover:text-text-primary rounded-md hover:bg-muted"
              onClick={() => setMobileMenuAnchorPath(location.pathname)}
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
            <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-text-dim/70 select-none">
              <span className="uppercase tracking-wide">Tips</span>
              <span>Tab / Shift+Tab</span>
              <span>·</span>
              <span>Enter</span>
            </div>
            <div />
          </header>
        )}
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
