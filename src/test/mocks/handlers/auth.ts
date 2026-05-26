import { http, HttpResponse } from 'msw'
import { createMockTokenResponse } from '@/test/mocks/data/factories'

export const authHandlers = [
  http.post('*/api/v1/auth/login', () => {
    return HttpResponse.json({ data: createMockTokenResponse() })
  }),

  http.post('*/api/v1/auth/refresh', () => {
    return HttpResponse.json({ data: createMockTokenResponse() })
  }),

  http.post('*/api/v1/auth/logout', () => {
    return HttpResponse.json({ data: { revoked: true } })
  }),
]
