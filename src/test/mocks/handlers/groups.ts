import { http, HttpResponse } from 'msw'
import { createMockGroup, paginate } from '@/test/mocks/data/factories'

export const groupHandlers = [
  http.get('*/api/v1/users/groups/', () => {
    return HttpResponse.json(paginate([createMockGroup(), createMockGroup({ group_name: 'Engineering' })]))
  }),

  http.get('*/api/v1/users/groups/:groupUuid', () => {
    return HttpResponse.json(createMockGroup())
  }),

  http.post('*/api/v1/users/groups/', () => {
    return HttpResponse.json(createMockGroup(), { status: 201 })
  }),

  http.patch('*/api/v1/users/groups/:groupUuid', () => {
    return HttpResponse.json(createMockGroup())
  }),

  http.delete('*/api/v1/users/groups/:groupUuid', () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
