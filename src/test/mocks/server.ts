import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/auth'
import { agentHandlers } from './handlers/agents'
import { taskHandlers } from './handlers/tasks'
import { monitoringHandlers } from './handlers/monitoring'
import { alertHandlers } from './handlers/alerts'
import { webhookHandlers } from './handlers/webhooks'
import { userHandlers } from './handlers/users'
import { dashboardHandlers } from './handlers/dashboard'

export const server = setupServer(
  ...authHandlers,
  ...agentHandlers,
  ...taskHandlers,
  ...monitoringHandlers,
  ...alertHandlers,
  ...webhookHandlers,
  ...userHandlers,
  ...dashboardHandlers,
)
