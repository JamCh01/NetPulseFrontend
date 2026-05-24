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
const TargetsPage = lazy(() => import('@/features/targets/pages/targets-page'))
const TasksPage = lazy(() => import('@/features/tasks/pages/tasks-page'))
const TaskDetailPage = lazy(() => import('@/features/tasks/pages/task-detail-page'))
const AgentsPage = lazy(() => import('@/features/agents/pages/agents-page'))
const AgentDetailPage = lazy(() => import('@/features/agents/pages/agent-detail-page'))
const ReleasesPage = lazy(() => import('@/features/agents/pages/releases-page'))
const ResultIngestionEventsPage = lazy(() => import('@/features/results/pages/result-ingestion-events-page'))
const GeoManagementPage = lazy(() => import('@/features/admin/pages/geo-management-page'))
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

            {/* Admin-only routes */}
            <Route element={<AdminGuard />}>
              <Route path="/targets" element={<TargetsPage />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/agents/releases" element={<ReleasesPage />} />
              <Route path="/agents/:agentUuid" element={<AgentDetailPage />} />
              <Route path="/geo" element={<GeoManagementPage />} />
              <Route path="/results/ingestion-events" element={<ResultIngestionEventsPage />} />
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
