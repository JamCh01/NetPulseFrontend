import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'
import { useThemeStore } from '@/stores/theme-store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ClipboardList,
  Radio,
  Bell,
  Link2,
  Users,

  LogOut,
  ChevronLeft,
  Moon,
  Sun,
  Zap,
} from 'lucide-react'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Tasks', path: '/tasks', icon: <ClipboardList className="w-4 h-4" /> },
  { label: 'Agents', path: '/agents', icon: <Radio className="w-4 h-4" />, adminOnly: true },
  { label: 'Alerts', path: '/alerts', icon: <Bell className="w-4 h-4" /> },
  { label: 'Webhooks', path: '/webhooks', icon: <Link2 className="w-4 h-4" /> },
]

const adminNavItems: NavItem[] = [
  { label: 'Users', path: '/users', icon: <Users className="w-4 h-4" />, adminOnly: true },
]

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const user = useAuthStore((s) => s.user)
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const logout = useAuthStore((s) => s.logout)
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const visibleNav = navItems.filter((item) => !item.adminOnly || isAdmin)
  const visibleAdminNav = adminNavItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <div className="min-h-screen gradient-bg grid-pattern flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen glass flex flex-col z-40 transition-all duration-300',
          collapsed ? 'w-(--sidebar-collapsed-width)' : 'w-(--sidebar-width)'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-16 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-gray-950" />
          </div>
          {!collapsed && (
            <span className="text-sm font-bold text-text-primary tracking-tight">NetPulse</span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
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

          {/* Admin section divider */}
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
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-text-muted hover:text-text-secondary hover:bg-white/5 transition-colors w-full"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-text-muted hover:text-red-400 hover:bg-red-500/5 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full glass flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors"
        >
          <ChevronLeft className={cn('w-3 h-3 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          'flex-1 transition-all duration-300',
          collapsed ? 'ml-(--sidebar-collapsed-width)' : 'ml-(--sidebar-width)'
        )}
      >
        {/* Header */}
        <header className="nav-blur sticky top-0 z-30 h-14 flex items-center justify-between px-6">
          <div />
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">{user.username}</span>
                <span className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-medium',
                  user.role === 'admin'
                    ? 'bg-accent-dim text-accent'
                    : 'bg-secondary-dim text-secondary'
                )}>
                  {user.role}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
