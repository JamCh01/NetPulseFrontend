import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'

export function AuthGuard() {
  const initialized = useAuthStore((s) => s.initialized)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const location = useLocation()

  // Wait for auth state to be restored from localStorage
  if (!initialized) {
    return (
      <div className="min-h-screen gradient-bg grid-pattern flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
