import { http, HttpResponse } from 'msw'
import { createMockUser } from '@/test/mocks/data/factories'

export const userHandlers = [
  http.get('*/api/v1/users/', () => {
    return HttpResponse.json([createMockUser({ role: 'admin' }), createMockUser()])
  }),

  http.get('*/api/v1/users/:userUuid', () => {
    return HttpResponse.json(createMockUser())
  }),

  http.patch('*/api/v1/users/:userUuid', () => {
    return HttpResponse.json(createMockUser())
  }),

  http.delete('*/api/v1/users/:userUuid', () => {
    return HttpResponse.json(createMockUser({ is_active: false }))
  }),

  http.post('*/api/v1/users/:userUuid/groups/:groupUuid', () => {
    return HttpResponse.json({ ok: true })
  }),

  http.delete('*/api/v1/users/:userUuid/groups/:groupUuid', () => {
    return HttpResponse.json({ ok: true })
  }),
]
