import { http, HttpResponse } from 'msw'
import { createMockAuditLog, paginate } from '@/test/mocks/data/factories'

export const auditHandlers = [
  http.get('*/api/v1/audit/logs', () => {
    return HttpResponse.json(paginate([
      createMockAuditLog(),
      createMockAuditLog({ action: 'user.login', resource_type: 'user' }),
    ]))
  }),
]
