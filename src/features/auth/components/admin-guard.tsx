import { Outlet } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'

export function AdminGuard() {
  const isAdmin = useAuthStore((s) => s.isAdmin())

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-6xl font-bold text-text-muted font-mono">403</div>
        <p className="text-text-muted text-sm">You don't have permission to access this page.</p>
      </div>
    )
  }

  return <Outlet />
}
