import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { useLogout } from '@/api/hooks/use-auth'
import { useTasks } from '@/api/hooks/use-tasks'
import { cn } from '@/lib/utils'
import type { TaskResponse } from '@/api/generated/types.gen'
import {
  LayoutDashboard,
  ClipboardList,
  Radio,
  Bell,
  Link2,
  Users,
  LogOut,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Zap,
  Activity,
  Languages,
  Plus,
  ScrollText,
  BellRing,
  FolderOpen,
  User as UserIcon,
  Menu,
  X,
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

  const mobileMenuOpen = mobileMenuAnchorPath === location.pathname

  const { data: tasksData } = useTasks({ limit: 200 })
  const tasks = ((tasksData as { items?: TaskResponse[] })?.items ?? []) as TaskResponse[]

  const staticNavItems: NavItem[] = [
    { label: t('nav.agents'), path: '/agents', icon: <Radio className="w-4 h-4" />, adminOnly: true },
    { label: t('nav.alerts'), path: '/alerts', icon: <Bell className="w-4 h-4" /> },
    { label: t('nav.alertEvents'), path: '/alerts/events', icon: <BellRing className="w-4 h-4" /> },
    { label: t('nav.webhooks'), path: '/webhooks', icon: <Link2 className="w-4 h-4" /> },
  ]

  const adminNavItems: NavItem[] = [
    { label: t('nav.users'), path: '/users', icon: <Users className="w-4 h-4" />, adminOnly: true },
    { label: t('nav.audit'), path: '/audit', icon: <ScrollText className="w-4 h-4" />, adminOnly: true },
    { label: t('nav.groups'), path: '/groups', icon: <FolderOpen className="w-4 h-4" />, adminOnly: true },
    { label: t('nav.systemHealth'), path: '/system/health', icon: <Activity className="w-4 h-4" />, adminOnly: true },
  ]

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        navigate('/login')
      },
    })
  }

  const visibleNav = staticNavItems.filter((item) => !item.adminOnly || isAdmin)
  const visibleAdminNav = adminNavItems.filter((item) => !item.adminOnly || isAdmin)

  const isTaskActive = location.pathname.startsWith('/tasks') || location.pathname.startsWith('/app/monitoring/')

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
        <div className="flex items-center gap-2 px-4 h-14 border-b border-white/5 relative">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-gray-950" />
          </div>
          {!collapsed && (
            <span className="text-sm font-bold text-text-primary tracking-tight">{t('nav.brand')}</span>
          )}
          {/* Close button for mobile */}
          <button 
            aria-label="Close menu"
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
                'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                isActive
                  ? 'bg-accent-dim text-accent'
                  : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
              )
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            {!collapsed && <span>{t('nav.dashboard')}</span>}
          </NavLink>

          {/* Tasks with expandable sub-items */}
          <div>
            <button
              onClick={() => collapsed ? navigate('/tasks') : setTasksExpanded(!tasksExpanded)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full',
                isTaskActive
                  ? 'bg-accent-dim text-accent'
                  : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
              )}
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{t('nav.tasks')}</span>
                  <span className="text-[11px] text-text-dim font-mono">{tasks.length}</span>
                  {tasksExpanded ? (
                    <ChevronDown className="w-3 h-3 text-text-dim" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-text-dim" />
                  )}
                </>
              )}
            </button>

            {!collapsed && tasksExpanded && (
              <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/5 pl-3">
                {tasks.map((task) => {
                  const protocolKey = (task.protocol ?? 'icmp').toLowerCase()
                  const protoColor = protocolIcon[protocolKey] ?? 'text-gray-400'
                  const taskPath = `/app/monitoring/${task.task_uuid}`
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
                        isActive ? 'text-accent/60' : (protocolIconDim[protocolKey] ?? 'text-gray-400/60')
                      )}>
                        {(task.protocol ?? 'icmp').toUpperCase()}
                      </span>
                    </NavLink>
                  )
                })}

                {tasks.length === 0 && (
                  <div className="px-2 py-1.5">
                    <div className="text-xs text-text-dim">{t('nav.noTasks')}</div>
                    {isAdmin && (
                      <NavLink
                        to="/tasks"
                        className="mt-1 flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        {t('tasks.createTask')}
                      </NavLink>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Remaining nav items */}
          {visibleNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-accent-dim text-accent'
                    : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
                )
              }
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}

          {/* Admin section */}
          {visibleAdminNav.length > 0 && (
            <>
              <div className="my-3 border-t border-white/5" />
              {visibleAdminNav.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-accent-dim text-accent'
                        : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
                    )
                  }
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Bottom actions */}
        <div className="px-2 py-4 border-t border-white/5 space-y-1">
          <button
            onClick={() => {
              const next = i18n.language === 'zh' ? 'en' : 'zh'
              i18n.changeLanguage(next)
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-text-muted hover:text-text-secondary hover:bg-white/5 transition-colors w-full"
          >
            <Languages className="w-4 h-4" />
            {!collapsed && <span>{i18n.language === 'zh' ? 'English' : '中文'}</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-text-muted hover:text-red-400 hover:bg-red-500/5 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>{t('common.logout')}</span>}
          </button>
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full glass hidden md:flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors"
        >
          <ChevronLeft className={cn('w-3 h-3 transition-transform', collapsed && 'rotate-180')} aria-hidden="true" />
        </button>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          'flex-1 transition-all duration-300 w-full',
          collapsed ? 'md:ml-(--sidebar-collapsed-width)' : 'md:ml-(--sidebar-width)'
        )}
      >
        {/* Header */}
        <header className="nav-blur sticky top-0 z-30 h-14 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
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
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 outline-none hover:bg-white/5 py-1 px-2 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-white/10">
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <UserIcon className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-xs font-medium text-text-primary leading-tight">{user.username}</span>
                    <span className="text-[10px] text-text-muted leading-tight capitalize">{user.role}</span>
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
                    {t('users.changePassword') || 'Change Password'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('common.logout') || 'Log out'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

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
