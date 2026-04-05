import { http, HttpResponse } from 'msw'
import { createMockTask, createMockAgent, paginate } from '@/test/mocks/data/factories'

export const taskHandlers = [
  http.get('*/api/v1/tasks/', () => {
    return HttpResponse.json(paginate([createMockTask(), createMockTask({ protocol: 'http', port: 443 })]))
  }),

  http.get('*/api/v1/tasks/:taskUuid', () => {
    return HttpResponse.json(createMockTask())
  }),

  http.post('*/api/v1/tasks/', () => {
    return HttpResponse.json(createMockTask(), { status: 201 })
  }),

  http.patch('*/api/v1/tasks/:taskUuid', () => {
    return HttpResponse.json(createMockTask())
  }),

  http.delete('*/api/v1/tasks/:taskUuid', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/api/v1/tasks/:taskUuid/assign', () => {
    return HttpResponse.json([createMockAgent()])
  }),

  http.get('*/api/v1/tasks/:taskUuid/agents', () => {
    return HttpResponse.json([createMockAgent()])
  }),

  http.delete('*/api/v1/tasks/:taskUuid/agents/:agentUuid', () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
