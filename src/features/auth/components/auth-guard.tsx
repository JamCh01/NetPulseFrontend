import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'
import { LoadingState } from '@/components/ui/loading-state'

export function AuthGuard() {
  const initialized = useAuthStore((s) => s.initialized)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const location = useLocation()

  // Wait for auth state to be restored from localStorage
  if (!initialized) {
    return <LoadingState fullscreen label="Restoring session" hint="Checking login state" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
