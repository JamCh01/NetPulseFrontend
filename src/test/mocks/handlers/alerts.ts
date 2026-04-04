import { http, HttpResponse } from 'msw'
import { createMockAlertRule } from '@/test/mocks/data/factories'

export const alertHandlers = [
  http.get('*/api/v1/alerts/rules/', () => {
    return HttpResponse.json([createMockAlertRule(), createMockAlertRule({ metric_type: 'packet_loss' })])
  }),

  http.get('*/api/v1/alerts/rules/:ruleUuid', () => {
    return HttpResponse.json(createMockAlertRule())
  }),

  http.post('*/api/v1/alerts/rules/', () => {
    return HttpResponse.json(createMockAlertRule(), { status: 201 })
  }),

  http.patch('*/api/v1/alerts/rules/:ruleUuid', () => {
    return HttpResponse.json(createMockAlertRule())
  }),

  http.delete('*/api/v1/alerts/rules/:ruleUuid', () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
