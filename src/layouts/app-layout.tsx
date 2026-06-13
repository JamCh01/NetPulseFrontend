import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { useThemeStore } from '@/stores/theme-store'
import { useLogout } from '@/api/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TargetGeoSidebarTree } from '@/features/monitoring/components/navigation/target-geo-sidebar-tree'
import {
  LayoutDashboard,
  Radio,
  ListChecks,
  LogOut,
  ChevronLeft,
  ChevronDown,
  Zap,
  Languages,
  User as UserIcon,
  Menu,
  X,
  Sun,
  Moon,
  Crosshair,
  DatabaseZap,
  Map,
  Settings as SettingsIcon,
} from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { ChangePasswordDialog } from '@/features/auth/components/change-password-dialog'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  adminOnly?: boolean
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuAnchorPath, setMobileMenuAnchorPath] = useState<string | null>(null)
  const [tasksExpanded, setTasksExpanded] = useState(true)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const { t, i18n } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const navigate = useNavigate()
  const logoutMutation = useLogout()
  const location = useLocation()
  const { theme, toggleTheme } = useThemeStore()

  const mobileMenuOpen = mobileMenuAnchorPath === location.pathname
  const hideHeader = location.pathname.startsWith('/app/monitoring')

  const staticNavItems: NavItem[] = [
    { label: t('nav.targets'), path: '/targets', icon: <Crosshair className="w-4 h-4" />, adminOnly: true },
    { label: t('nav.agents'), path: '/agents', icon: <Radio className="w-4 h-4" />, adminOnly: true },
    { label: t('nav.tasks'), path: '/tasks', icon: <ListChecks className="w-4 h-4" />, adminOnly: true },
    { label: 'GEO', path: '/geo', icon: <Map className="w-4 h-4" />, adminOnly: true },
    { label: t('nav.results'), path: '/results/ingestion-events', icon: <DatabaseZap className="w-4 h-4" />, adminOnly: true },
    { label: t('nav.settings'), path: '/settings', icon: <SettingsIcon className="w-4 h-4" />, adminOnly: true },
  ]

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        navigate('/login')
      },
    })
  }

  const visibleNav = staticNavItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <div className="min-h-screen gradient-bg grid-pattern flex">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuAnchorPath(null)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen glass flex flex-col z-50 transition-transform duration-300',
          collapsed ? 'w-(--sidebar-collapsed-width)' : 'w-(--sidebar-width)',
          !mobileMenuOpen && '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-border relative">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-gray-950" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold text-text-primary tracking-tight">{t('nav.brand')}</span>
          )}
          {/* Close button for mobile */}
          <button 
            aria-label={t('nav.closeMenu')}
            className="absolute right-3 p-1.5 md:hidden text-text-muted hover:text-text-primary"
            onClick={() => setMobileMenuAnchorPath(null)}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {/* Dashboard */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-text-muted hover:text-text-secondary hover:bg-muted'
              )
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            {!collapsed && <span>{t('dashboard.healthEyebrow')}</span>}
          </NavLink>

          <NavLink
            to="/app/monitoring"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive || location.pathname.startsWith('/app/monitoring')
                  ? 'bg-accent text-accent-foreground'
                  : 'text-text-muted hover:text-text-secondary hover:bg-muted'
              )
            }
          >
            <Crosshair className="w-4 h-4" />
            {!collapsed && <span>{t('nav.monitoring')}</span>}
          </NavLink>

          {!collapsed && (
            <TargetGeoSidebarTree
              basePath="/app/monitoring"
              expanded={tasksExpanded}
              onToggle={() => setTasksExpanded(!tasksExpanded)}
            />
          )}

          {/* Remaining nav items */}
          {visibleNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-text-muted hover:text-text-secondary hover:bg-muted'
                )
              }
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}

        </nav>

        {/* Bottom actions */}
        <div className="px-2 py-4 border-t border-border space-y-1">
          <button
            onClick={() => {
              const next = i18n.language === 'zh' ? 'en' : 'zh'
              i18n.changeLanguage(next)
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-text-secondary hover:bg-muted transition-colors w-full cursor-pointer"
          >
            <Languages className="w-4 h-4" />
            {!collapsed && <span>{i18n.language === 'zh' ? 'English' : '中文'}</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-red-300 hover:bg-red-500/10 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>{t('common.logout')}</span>}
          </button>
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          aria-label={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full glass hidden md:flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors"
        >
          <ChevronLeft className={cn('w-3 h-3 transition-transform', collapsed && 'rotate-180')} aria-hidden="true" />
        </button>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          'min-w-0 flex-1 transition-all duration-300 w-full overflow-x-hidden',
          collapsed
            ? 'md:ml-(--sidebar-collapsed-width) md:w-[calc(100%-var(--sidebar-collapsed-width))]'
            : 'md:ml-(--sidebar-width) md:w-[calc(100%-var(--sidebar-width))]'
        )}
      >
        {!hideHeader && (
          <header className="nav-blur sticky top-0 z-30 h-14 flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <button
                aria-label={t('nav.openMenu')}
                className="p-1.5 md:hidden text-text-muted hover:text-text-primary rounded-md hover:bg-muted"
                onClick={() => setMobileMenuAnchorPath(location.pathname)}
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-text-muted/80 select-none">
                <span className="uppercase tracking-wide">{t('nav.tips')}</span>
                <span>{t('nav.tabNavigation')}</span>
                <span>·</span>
                <span>{t('nav.enter')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleTheme}
                className="text-text-muted hover:text-text-primary rounded-lg cursor-pointer"
                aria-label={t('nav.toggleTheme')}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 outline-none hover:bg-muted py-1 px-2 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-border">
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <UserIcon className="w-3.5 h-3.5 text-accent-foreground" />
                    </div>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-medium text-text-primary leading-tight">{user.username}</span>
                      <span className="text-xs text-text-muted leading-tight capitalize">{user.role}</span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-text-dim ml-1" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-text-primary">{user.username}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer" onClick={() => setPasswordDialogOpen(true)}>
                      {t('users.changePassword')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer" variant="destructive" onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('common.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </header>
        )}

        {/* Page content */}
        <div className="p-4 md:p-6 max-w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>

      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </div>
  )
}
