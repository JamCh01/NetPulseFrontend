import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { adminRequest, buildQuery } from './admin-api'
import { useAuthStore } from '@/stores/auth-store'
import { server } from '@/test/mocks/server'

describe('admin-api', () => {
  it('unwraps API envelopes and sends bearer token', async () => {
    useAuthStore.setState({ accessToken: 'token-for-admin-tests' })

    server.use(
      http.get('/api/v1/targets', ({ request }) => {
        expect(request.headers.get('authorization')).toBe('Bearer token-for-admin-tests')
        return HttpResponse.json({
          data: {
            items: [{ target_uuid: 'target-1', name: 'Google DNS' }],
            pagination: { page: 1, page_size: 100, total: 1, total_pages: 1 },
          },
        })
      }),
    )

    const response = await adminRequest<{ items: Array<{ target_uuid: string }> }>('/api/v1/targets')

    expect(response.items).toEqual([{ target_uuid: 'target-1', name: 'Google DNS' }])
  })

  it('builds query strings without empty values or all sentinels', () => {
    expect(buildQuery({
      page: 1,
      page_size: 100,
      keyword: '',
      status: 'all',
      is_enabled: false,
    })).toBe('?page=1&page_size=100&is_enabled=false')
  })
})
