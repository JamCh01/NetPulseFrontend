import { http, HttpResponse } from 'msw'
import { createMockRouteTraceTarget, paginate } from '@/test/mocks/data/factories'

export const routeTraceTargetHandlers = [
  http.get('*/api/v1/route-trace-targets', () => {
    return HttpResponse.json(paginate([createMockRouteTraceTarget()]))
  }),

  http.get('*/api/v1/route-trace-targets/:routeTraceTargetUuid', () => {
    return HttpResponse.json(createMockRouteTraceTarget())
  }),

  http.post('*/api/v1/route-trace-targets', () => {
    return HttpResponse.json(createMockRouteTraceTarget(), { status: 201 })
  }),

  http.patch('*/api/v1/route-trace-targets/:routeTraceTargetUuid', () => {
    return HttpResponse.json(createMockRouteTraceTarget())
  }),

  http.post('*/api/v1/route-trace-targets/:routeTraceTargetUuid/enable', () => {
    return HttpResponse.json(createMockRouteTraceTarget({ is_enabled: true }))
  }),

  http.post('*/api/v1/route-trace-targets/:routeTraceTargetUuid/disable', () => {
    return HttpResponse.json(createMockRouteTraceTarget({ is_enabled: false }))
  }),

  http.delete('*/api/v1/route-trace-targets/:routeTraceTargetUuid', () => {
    return HttpResponse.json(createMockRouteTraceTarget({ is_deleted: true }))
  }),
]
