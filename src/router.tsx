import { Routes, Route, Navigate } from 'react-router'
import { lazy, Suspense } from 'react'
import { AppLayout } from '@/layouts/app-layout'
import { AuthLayout } from '@/layouts/auth-layout'
import { AuthGuard } from '@/features/auth/components/auth-guard'
import { AdminGuard } from '@/features/auth/components/admin-guard'

// Auth pages
const LoginPage = lazy(() => import('@/features/auth/pages/login-page'))
const RegisterPage = lazy(() => import('@/features/auth/pages/register-page'))

// App pages
const DashboardPage = lazy(() => import('@/features/dashboard/pages/dashboard-page'))
const TasksPage = lazy(() => import('@/features/tasks/pages/tasks-page'))
const TaskDetailPage = lazy(() => import('@/features/tasks/pages/task-detail-page'))
const AgentsPage = lazy(() => import('@/features/agents/pages/agents-page'))
const AgentDetailPage = lazy(() => import('@/features/agents/pages/agent-detail-page'))
const AlertsPage = lazy(() => import('@/features/alerts/pages/alerts-page'))
const WebhooksPage = lazy(() => import('@/features/webhooks/pages/webhooks-page'))
const UsersPage = lazy(() => import('@/features/users/pages/users-page'))
const MonitoringDetailPage = lazy(() => import('@/features/monitoring/pages/monitoring-detail-page'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  )
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected routes */}
        <Route element={<AuthGuard />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/:taskUuid" element={<TaskDetailPage />} />
            <Route path="/monitoring/:taskUuid" element={<MonitoringDetailPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/webhooks" element={<WebhooksPage />} />

            {/* Admin-only routes */}
            <Route element={<AdminGuard />}>
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/agents/:agentUuid" element={<AgentDetailPage />} />
              <Route path="/users" element={<UsersPage />} />
            </Route>
          </Route>
        </Route>

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
