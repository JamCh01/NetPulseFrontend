import { http, HttpResponse } from 'msw'
import { createMockDashboardStats } from '@/test/mocks/data/factories'

export const dashboardHandlers = [
  http.get('*/api/v1/dashboard/stats', () => {
    return HttpResponse.json(createMockDashboardStats())
  }),
]
