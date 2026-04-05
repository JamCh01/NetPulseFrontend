import { http, HttpResponse } from 'msw'
import { createMockRelease } from '@/test/mocks/data/factories'

export const releaseHandlers = [
  http.get('*/api/v1/agents/releases/', () => {
    return HttpResponse.json({
      releases: [
        createMockRelease(),
        createMockRelease({ version: '0.9.0', is_latest: false, platform: 'aarch64-linux-musl' }),
      ],
    })
  }),

  http.post('*/api/v1/agents/releases/upload', () => {
    return HttpResponse.json(createMockRelease(), { status: 201 })
  }),

  http.delete('*/api/v1/agents/releases/:releaseUuid', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/api/v1/agents/releases/:releaseUuid/push', () => {
    return HttpResponse.json({ pushed: 5 })
  }),
]
