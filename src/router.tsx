import { Routes, Route, Navigate } from 'react-router'
import { lazy, Suspense } from 'react'
import { AppLayout } from '@/layouts/app-layout'
import { AuthLayout } from '@/layouts/auth-layout'
import { PublicLayout } from '@/layouts/public-layout'
import { AuthGuard } from '@/features/auth/components/auth-guard'
import { AdminGuard } from '@/features/auth/components/admin-guard'
import { LoadingState } from '@/components/ui/loading-state'

// Auth pages
const LoginPage = lazy(() => import('@/features/auth/pages/login-page'))
const RegisterPage = lazy(() => import('@/features/auth/pages/register-page'))

// App pages
const DashboardPage = lazy(() => import('@/features/dashboard/pages/dashboard-page'))
const TasksPage = lazy(() => import('@/features/tasks/pages/tasks-page'))
const TaskDetailPage = lazy(() => import('@/features/tasks/pages/task-detail-page'))
const AgentsPage = lazy(() => import('@/features/agents/pages/agents-page'))
const AgentDetailPage = lazy(() => import('@/features/agents/pages/agent-detail-page'))
const ReleasesPage = lazy(() => import('@/features/agents/pages/releases-page'))
const AlertsPage = lazy(() => import('@/features/alerts/pages/alerts-page'))
const WebhooksPage = lazy(() => import('@/features/webhooks/pages/webhooks-page'))
const AlertEventsPage = lazy(() => import('@/features/alerts/pages/alert-events-page'))
const UsersPage = lazy(() => import('@/features/users/pages/users-page'))
const AuditPage = lazy(() => import('@/features/audit/pages/audit-page'))
const GroupsPage = lazy(() => import('@/features/groups/pages/groups-page'))
const HealthPage = lazy(() => import('@/features/dashboard/pages/health-page'))
const MonitoringIndexPage = lazy(() => import('@/features/monitoring/pages/monitoring-index-page'))
const MonitoringDetailPage = lazy(() => import('@/features/monitoring/pages/monitoring-detail-page'))
const MtrDetailPage = lazy(() => import('@/features/monitoring/pages/mtr-detail-page'))
const NotFoundPage = lazy(() => import('@/features/system/pages/not-found-page'))

function PageLoader() {
  return <LoadingState label="Loading page" hint="Fetching module and route data" />
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Public monitoring routes (no login required) */}
        <Route element={<PublicLayout />}>
          <Route path="/monitoring" element={<MonitoringIndexPage />} />
          <Route path="/monitoring/:taskUuid" element={<MonitoringDetailPage />} />
          <Route path="/monitoring/:taskUuid/mtr" element={<MtrDetailPage />} />
        </Route>

        {/* Protected routes */}
        <Route element={<AuthGuard />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/:taskUuid" element={<TaskDetailPage />} />
            <Route path="/app/monitoring" element={<MonitoringIndexPage />} />
            <Route path="/app/monitoring/:taskUuid" element={<MonitoringDetailPage />} />
            <Route path="/app/monitoring/:taskUuid/mtr" element={<MtrDetailPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/alerts/events" element={<AlertEventsPage />} />
            <Route path="/webhooks" element={<WebhooksPage />} />

            {/* Admin-only routes */}
            <Route element={<AdminGuard />}>
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/agents/releases" element={<ReleasesPage />} />
              <Route path="/agents/:agentUuid" element={<AgentDetailPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/audit" element={<AuditPage />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/system/health" element={<HealthPage />} />
            </Route>
          </Route>
        </Route>

        {/* Default redirect to public monitoring */}
        <Route path="/" element={<Navigate to="/monitoring" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
