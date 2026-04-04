import { http, HttpResponse } from 'msw'
import { createMockTokenResponse, createMockUser } from '@/test/mocks/data/factories'

export const authHandlers = [
  http.post('*/api/v1/auth/login', () => {
    return HttpResponse.json(createMockTokenResponse())
  }),

  http.post('*/api/v1/auth/register', () => {
    return HttpResponse.json(createMockUser(), { status: 201 })
  }),

  http.post('*/api/v1/auth/refresh', () => {
    return HttpResponse.json(createMockTokenResponse())
  }),
]
