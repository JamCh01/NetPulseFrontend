import { http, HttpResponse } from 'msw'
import { createMockWebhook } from '@/test/mocks/data/factories'

export const webhookHandlers = [
  http.get('*/api/v1/webhooks/', () => {
    return HttpResponse.json([createMockWebhook()])
  }),

  http.get('*/api/v1/webhooks/:webhookUuid', () => {
    return HttpResponse.json(createMockWebhook())
  }),

  http.post('*/api/v1/webhooks/', () => {
    return HttpResponse.json(createMockWebhook(), { status: 201 })
  }),

  http.patch('*/api/v1/webhooks/:webhookUuid', () => {
    return HttpResponse.json(createMockWebhook())
  }),

  http.delete('*/api/v1/webhooks/:webhookUuid', () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
