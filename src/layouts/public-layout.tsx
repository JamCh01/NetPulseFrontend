import { Outlet, NavLink, useNavigate, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { usePublicMonitoringTasks } from '@/api/hooks/use-public-monitoring-tasks'
import { cn } from '@/lib/utils'
import {
  Activity,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  LogIn,
  Languages,
  Menu,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'

const protocolIcon: Record<string, string> = {
  icmp: 'text-cyan-400',
  tcp: 'text-purple-400',
  http: 'text-emerald-400',
  udp: 'text-amber-400',
}

const protocolIconDim: Record<string, string> = {
  icmp: 'text-cyan-400/60',
  tcp: 'text-purple-400/60',
  http: 'text-emerald-400/60',
  udp: 'text-amber-400/60',
}

export function PublicLayout() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const [tasksExpanded, setTasksExpanded] = useState(true)
  const [mobileMenuAnchorPath, setMobileMenuAnchorPath] = useState<string | null>(null)
  const mobileMenuOpen = mobileMenuAnchorPath === location.pathname

  const { data: tasks = [] } = usePublicMonitoringTasks(200)

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
        <div className="flex items-center gap-2 px-4 h-16 border-b border-white/5 relative">
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
          <div>
            <button
              onClick={() => setTasksExpanded(!tasksExpanded)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full',
                'bg-accent-dim text-accent'
              )}
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{t('nav.tasks')}</span>
              <span className="text-[11px] text-text-dim font-mono">{tasks.length}</span>
              {tasksExpanded ? (
                <ChevronDown className="w-3 h-3 text-text-dim" />
              ) : (
                <ChevronRight className="w-3 h-3 text-text-dim" />
              )}
            </button>

            {tasksExpanded && (
              <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/5 pl-3">
                {tasks.map((task) => {
                  const protoColor = protocolIcon[task.protocol.toLowerCase()] ?? 'text-gray-400'
                  const taskPath = `/monitoring/${task.task_uuid}`
                  const isActive = location.pathname === taskPath

                  return (
                    <NavLink
                      key={task.task_uuid}
                      to={taskPath}
                      className={cn(
                        'flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-colors group',
                        isActive
                          ? 'bg-accent-dim/50 text-accent'
                          : 'text-text-dim hover:text-text-secondary hover:bg-white/5'
                      )}
                    >
                      <Activity className={cn('w-3 h-3 shrink-0', isActive ? 'text-accent' : protoColor)} />
                      <span className="truncate flex-1">{task.task_name}</span>
                      <span className={cn(
                        'text-[10px] px-1 py-px rounded font-mono uppercase shrink-0',
                        isActive ? 'text-accent/60' : (protocolIconDim[task.protocol.toLowerCase()] ?? 'text-gray-400/60')
                      )}>
                        {task.protocol}
                      </span>
                    </NavLink>
                  )
                })}
                {tasks.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-text-dim">{t('nav.noTasks')}</div>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Bottom actions */}
        <div className="px-2 py-4 border-t border-white/5 space-y-1">
          <button
            onClick={() => { const next = i18n.language === 'zh' ? 'en' : 'zh'; i18n.changeLanguage(next) }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-text-muted hover:text-text-secondary hover:bg-white/5 transition-colors w-full"
          >
            <Languages className="w-4 h-4" />
            <span>{i18n.language === 'zh' ? 'English' : '中文'}</span>
          </button>
          {!isAuthenticated && (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-accent hover:text-accent-hover hover:bg-accent-dim transition-colors w-full"
            >
              <LogIn className="w-4 h-4" />
              <span>{t('auth.signIn')}</span>
            </button>
          )}
          {isAuthenticated && (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-accent hover:text-accent-hover hover:bg-accent-dim transition-colors w-full"
            >
              <Zap className="w-4 h-4" />
              <span>{t('nav.dashboard')}</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-(--sidebar-width)">
        <header className="nav-blur sticky top-0 z-30 h-14 flex items-center justify-between px-4 md:px-6">
          <button
            aria-label="Open menu"
            className="p-1.5 md:hidden text-text-muted hover:text-text-primary rounded-md hover:bg-white/5"
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
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
