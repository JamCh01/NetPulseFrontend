import { http, HttpResponse } from 'msw'
import { createMockMonitoringDataPoint } from '@/test/mocks/data/factories'

export const monitoringHandlers = [
  http.post('*/api/v1/monitoring/query', () => {
    const data = Array.from({ length: 60 }, (_, i) =>
      createMockMonitoringDataPoint({
        timestamp: Date.now() / 1000 - (60 - i) * 60,
        avg_rtt: 5 + Math.random() * 3,
        median_rtt: 4.5 + Math.random() * 2,
      }),
    )
    return HttpResponse.json({
      task_uuid: '00000000-0000-0000-0000-000000000001',
      agent_uuid: null,
      granularity: 'raw',
      data,
    })
  }),
]
