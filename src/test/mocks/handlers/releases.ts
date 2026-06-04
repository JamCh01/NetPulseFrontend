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

  http.get('*/api/v1/agent-update/policies', () => {
    return HttpResponse.json({ data: { items: [] } })
  }),

  http.post('*/api/v1/agent-update/policies', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({ data: { policy_uuid: 'policy-1', ...body } }, { status: 201 })
  }),

  http.post('*/api/v1/agent-update/policies/:policyUuid/dispatch', ({ params }) => {
    return HttpResponse.json({ data: { policy_uuid: params.policyUuid, created: 0, dispatched: 0 } })
  }),

  http.get('*/api/v1/agent-update/assignments', () => {
    return HttpResponse.json({ data: { items: [] } })
  }),
]
