import { http, HttpResponse } from 'msw'
import { createMockAgent, paginate } from '@/test/mocks/data/factories'

export const agentHandlers = [
  http.get('*/api/v1/agents/', () => {
    return HttpResponse.json(paginate([createMockAgent(), createMockAgent({ status: 'offline' })]))
  }),

  http.get('*/api/v1/agents/:agentUuid', () => {
    return HttpResponse.json(createMockAgent())
  }),

  http.post('*/api/v1/agents/', () => {
    return HttpResponse.json(
      { ...createMockAgent(), access_key: 'ak_test_secret_key' },
      { status: 201 },
    )
  }),

  http.patch('*/api/v1/agents/:agentUuid', () => {
    return HttpResponse.json(createMockAgent())
  }),

  http.delete('*/api/v1/agents/:agentUuid', () => {
    return HttpResponse.json(createMockAgent({ status: 'disabled' }))
  }),
]
