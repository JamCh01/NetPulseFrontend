import { http, HttpResponse } from 'msw'
import { createMockAgentArtifact } from '@/test/mocks/data/factories'

export const releaseHandlers = [
  http.get('*/api/v1/artifacts/agents', () => {
    return HttpResponse.json({
      data: {
        items: [
          createMockAgentArtifact(),
          createMockAgentArtifact({ version: '0.9.0', is_active: false, arch: 'aarch64' }),
        ],
      },
    })
  }),

  http.post('*/api/v1/artifacts/agents', () => {
    return HttpResponse.json({ data: createMockAgentArtifact() }, { status: 201 })
  }),

  http.patch('*/api/v1/artifacts/agents/:artifactUuid', () => {
    return HttpResponse.json({ data: createMockAgentArtifact() })
  }),

  http.delete('*/api/v1/artifacts/agents/:artifactUuid', () => {
    return HttpResponse.json({ data: createMockAgentArtifact({ is_deleted: true }) })
  }),

  http.get('*/api/v1/artifacts/agents/:artifactUuid/download', () => {
    return HttpResponse.json({ data: { download_url: 'https://artifacts.example.com/netpulse-agent' } })
  }),
]
