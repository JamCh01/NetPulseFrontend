import { http, HttpResponse } from 'msw'
import { createMockAlertRule, createMockAlertEvent, paginate } from '@/test/mocks/data/factories'

export const alertHandlers = [
  http.get('*/api/v1/alerts/rules/', () => {
    return HttpResponse.json(paginate([createMockAlertRule(), createMockAlertRule({ metric_type: 'packet_loss' })]))
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

  http.get('*/api/v1/alerts/events/', () => {
    return HttpResponse.json(paginate([createMockAlertEvent(), createMockAlertEvent({ status: 'resolved', resolved_at: '2026-01-01T13:00:00Z' })]))
  }),

  http.get('*/api/v1/alerts/events/:eventUuid', () => {
    return HttpResponse.json(createMockAlertEvent())
  }),
]
