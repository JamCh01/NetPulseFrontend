import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import SettingsPage from './settings-page'
import { renderWithProviders } from '@/test/utils'
import { server } from '@/test/mocks/server'

const settingsResponse = {
  victoriametrics_write_url: 'http://127.0.0.1:8428/api/v1/import/prometheus',
  victoriametrics_query_url: 'http://127.0.0.1:8428/api/v1/query',
  worker_fetch_batch_size: 32,
  worker_fetch_timeout_sec: 2,
  worker_processing_concurrency: 32,
  agent_state_worker_fetch_batch_size: 64,
  agent_state_worker_fetch_timeout_sec: 2,
  agent_offline_after_sec: 90,
  agent_status_sweep_interval_sec: 30,
  agent_status_singleton_lock_enabled: true,
  asn_enrichment_sweep_interval_sec: 300,
  asn_enrichment_batch_size: 100,
  asn_enrichment_claim_stale_after_sec: 600,
  asn_enrichment_singleton_lock_enabled: false,
  result_ingestion_event_retention_days: 7,
  artifact_storage_provider: 'cloudflare_r2',
  artifact_r2_endpoint_url: 'https://account.r2.cloudflarestorage.com',
  artifact_r2_access_key_id: 'access-key',
  artifact_r2_secret_access_key_configured: true,
  artifact_r2_bucket: 'netpulse-artifacts',
  artifact_r2_public_base_url: 'https://artifacts.example.com',
  artifact_download_url_ttl_sec: 900,
  artifact_upload_max_bytes: 209_715_200,
}

describe('SettingsPage', () => {
  it('loads settings, masks secret values, and patches edited fields only', async () => {
    const user = userEvent.setup()
    let patchedBody: Record<string, unknown> | null = null
    server.use(
      http.get('*/api/v1/settings', () => HttpResponse.json({ data: settingsResponse })),
      http.patch('*/api/v1/settings', async ({ request }) => {
        patchedBody = await request.json() as Record<string, unknown>
        return HttpResponse.json({ data: { ...settingsResponse, ...patchedBody } })
      }),
    )

    renderWithProviders(<SettingsPage />)

    expect(await screen.findByText('系统设置')).toBeInTheDocument()
    expect(await screen.findByText('Secret Access Key 已配置')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('secret-key')).not.toBeInTheDocument()

    const workerSection = screen.getByRole('region', { name: 'Result Worker' })
    const concurrency = within(workerSection).getByLabelText('处理并发数')
    await user.clear(concurrency)
    await user.type(concurrency, '48')

    await user.click(screen.getByRole('button', { name: '保存设置' }))

    expect(patchedBody).toMatchObject({
      worker_processing_concurrency: 48,
    })
    expect(patchedBody).not.toHaveProperty('artifact_r2_secret_access_key')
  })
})
