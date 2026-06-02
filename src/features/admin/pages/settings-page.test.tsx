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
  artifact_local_storage_dir: '/opt/netpulse-runtime/artifacts',
  artifact_local_public_base_url: 'https://netpulse-api.lowendaff.com/artifacts',
  artifact_download_url_ttl_sec: 900,
  artifact_upload_max_bytes: 209_715_200,
  artifact_download_token_secret_configured: true,
  agent_public_api_base_url: 'https://netpulse-api.lowendaff.com',
  agent_public_nats_url: 'tls://nats.lowendaff.com:4222',
  agent_install_service_name: 'netpulse-agent',
  agent_default_heartbeat_interval_sec: 30,
  agent_default_log_level: 'info',
  agent_install_token_secret_configured: true,
  agent_install_token_ttl_sec: 86_400,
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
    expect(await screen.findByText('安装 URL 签名密钥已配置')).toHaveClass('font-medium', 'text-emerald-400')
    expect(await screen.findByText('Artifact 下载签名密钥已配置')).toHaveClass('font-medium', 'text-emerald-400')
    expect(screen.getByDisplayValue('https://netpulse-api.lowendaff.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('tls://nats.lowendaff.com:4222')).toBeInTheDocument()
    expect(screen.getByDisplayValue('/opt/netpulse-runtime/artifacts')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://netpulse-api.lowendaff.com/artifacts')).toBeInTheDocument()
    expect(screen.getByDisplayValue('netpulse-agent')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('install-token-secret')).not.toBeInTheDocument()

    const workerSection = screen.getByRole('region', { name: 'Result Worker' })
    const concurrency = within(workerSection).getByLabelText('处理并发数')
    await user.clear(concurrency)
    await user.type(concurrency, '48')

    const artifactSection = screen.getByRole('region', { name: 'Local Artifact Storage' })
    const localPublicBaseUrl = within(artifactSection).getByLabelText('公开下载 Base URL')
    await user.clear(localPublicBaseUrl)
    await user.type(localPublicBaseUrl, 'https://netpulse-api.example.com/artifacts')

    const agentInstallSection = screen.getByRole('region', { name: 'Agent Install' })
    const publicApiBaseUrl = within(agentInstallSection).getByLabelText('Public API Base URL')
    await user.clear(publicApiBaseUrl)
    await user.type(publicApiBaseUrl, 'https://netpulse-api.example.com')
    const publicNatsUrl = within(agentInstallSection).getByLabelText('Public NATS URL')
    await user.clear(publicNatsUrl)
    await user.type(publicNatsUrl, 'tls://nats.example.com:4222')
    const installUrlTtl = within(agentInstallSection).getByLabelText('安装 URL TTL')
    await user.clear(installUrlTtl)
    await user.type(installUrlTtl, '3600')

    await user.click(screen.getByRole('button', { name: '保存设置' }))

    expect(patchedBody).toMatchObject({
      worker_processing_concurrency: 48,
      artifact_local_storage_dir: '/opt/netpulse-runtime/artifacts',
      artifact_local_public_base_url: 'https://netpulse-api.example.com/artifacts',
      agent_public_api_base_url: 'https://netpulse-api.example.com',
      agent_public_nats_url: 'tls://nats.example.com:4222',
      agent_install_service_name: 'netpulse-agent',
      agent_default_heartbeat_interval_sec: 30,
      agent_default_log_level: 'info',
      agent_install_token_ttl_sec: 3600,
    })
    expect(patchedBody).not.toHaveProperty('agent_install_token_secret')
    expect(patchedBody).not.toHaveProperty('artifact_download_token_secret')
  })

  it('marks missing signing secrets as red', async () => {
    server.use(
      http.get('*/api/v1/settings', () => HttpResponse.json({
        data: {
          ...settingsResponse,
          agent_install_token_secret_configured: false,
          artifact_download_token_secret_configured: false,
        },
      })),
    )

    renderWithProviders(<SettingsPage />)

    expect(await screen.findByText('安装 URL 签名密钥未配置')).toHaveClass('font-medium', 'text-red-400')
    expect(await screen.findByText('Artifact 下载签名密钥未配置')).toHaveClass('font-medium', 'text-red-400')
  })
})
