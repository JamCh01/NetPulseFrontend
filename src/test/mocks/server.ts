import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/auth'
import { agentHandlers } from './handlers/agents'
import { taskHandlers } from './handlers/tasks'
import { monitoringHandlers } from './handlers/monitoring'
import { userHandlers } from './handlers/users'
import { dashboardHandlers } from './handlers/dashboard'
import { releaseHandlers } from './handlers/releases'
import { routeTraceTargetHandlers } from './handlers/route-trace-targets'

export const server = setupServer(
  ...authHandlers,
  ...agentHandlers,
  ...taskHandlers,
  ...monitoringHandlers,
  ...userHandlers,
  ...dashboardHandlers,
  ...releaseHandlers,
  ...routeTraceTargetHandlers,
)
