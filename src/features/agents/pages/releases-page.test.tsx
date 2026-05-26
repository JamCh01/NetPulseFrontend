import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ReleasesPage from './releases-page'
import { renderWithProviders } from '@/test/utils'
import { server } from '@/test/mocks/server'

const artifact = {
  artifact_uuid: 'artifact-1',
  artifact_type: 'agent_binary',
  version: '1.2.3',
  os: 'linux',
  arch: 'x86_64',
  filename: 'netpulse-agent-linux-x86_64',
  content_type: 'application/octet-stream',
  size_bytes: 12_345_678,
  sha256: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  storage_provider: 'cloudflare_r2',
  storage_bucket: 'netpulse-artifacts',
  storage_key: 'agent-binaries/linux/x86_64/netpulse-agent',
  is_active: true,
  is_deleted: false,
  comment: 'stable linux build',
  created_at: '2026-05-26T00:00:00Z',
  updated_at: '2026-05-26T00:00:00Z',
  deleted_at: null,
}

describe('ReleasesPage agent artifacts', () => {
  it('renders agent artifacts from the new artifact API and deletes by artifact UUID', async () => {
    const user = userEvent.setup()
    let deletePath = ''
    server.use(
      http.get('*/api/v1/artifacts/agents', ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('os')).toBe('linux')
        return HttpResponse.json({
          data: {
            items: [{ ...artifact, arch: 'amd64' }],
          },
        })
      }),
      http.delete('*/api/v1/artifacts/agents/:artifactUuid', ({ params }) => {
        deletePath = String(params.artifactUuid)
        return HttpResponse.json({ data: { ...artifact, is_deleted: true } })
      }),
    )

    renderWithProviders(<ReleasesPage />)

    await user.click(screen.getByRole('combobox', { name: 'OS' }))
    await user.click(await screen.findByRole('option', { name: 'Linux' }))

    expect(await screen.findByText('Agent Artifacts')).toBeInTheDocument()
    expect(await screen.findByText('1.2.3')).toBeInTheDocument()
    expect(screen.getByText('Linux / x86_64 (AMD64)')).toBeInTheDocument()
    expect(screen.getByText('cloudflare_r2')).toBeInTheDocument()
    expect(screen.queryByText('push update')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '删除' }))
    const dialog = await screen.findByRole('dialog', { name: '删除 Artifact' })
    await user.click(within(dialog).getByRole('button', { name: '删除' }))

    expect(deletePath).toBe('artifact-1')
  })

  it('uses standardized OS and de-duplicated architecture labels in artifact controls', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('*/api/v1/artifacts/agents', () => HttpResponse.json({ data: { items: [] } })),
    )

    renderWithProviders(<ReleasesPage />)

    expect(await screen.findByText('Agent Artifacts')).toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: 'OS' }))
    expect(await screen.findByRole('option', { name: 'Linux' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'macOS' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Windows' })).toBeInTheDocument()
    await user.keyboard('{Escape}')

    await user.click(screen.getByRole('combobox', { name: 'Arch' }))
    expect(await screen.findByRole('option', { name: 'x86_64 (AMD64)' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'aarch64 (ARM64)' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'amd64' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'arm64' })).not.toBeInTheDocument()
  })
})
