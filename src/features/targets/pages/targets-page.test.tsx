import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import TargetsPage from './targets-page'
import { renderWithProviders } from '@/test/utils'
import { server } from '@/test/mocks/server'
import { createMockAgent, createMockTarget, paginate } from '@/test/mocks/data/factories'

describe('TargetsPage', () => {
  it('loads Agent options for target quick association with backend-compatible page sizes', async () => {
    const user = userEvent.setup()
    const targetItem = createMockTarget({
      target_uuid: 'target-tokyo',
      name: 'Tokyo Target',
      target: 'tokyo.example.com',
      ip_version: '4',
    })
    const agentItem = createMockAgent({
      agent_uuid: 'agent-tokyo',
      name: 'Tokyo Agent',
      agent_name: 'Tokyo Agent',
      city: 'Tokyo',
    })
    const agentPageSizes: string[] = []
    const quickAssociateRequests: unknown[] = []
    server.use(
      http.get('*/api/v1/targets', () => HttpResponse.json(paginate([targetItem]))),
      http.get('*/api/v1/agents', ({ request }) => {
        agentPageSizes.push(new URL(request.url).searchParams.get('page_size') ?? '')
        return HttpResponse.json(paginate([agentItem]))
      }),
      http.post('*/api/v1/relations/quick-associate', async ({ request }) => {
        quickAssociateRequests.push(await request.json())
        return HttpResponse.json([])
      }),
    )

    renderWithProviders(<TargetsPage />)

    await user.click(await screen.findByRole('button', { name: '关联 Agent' }))
    const dialog = await screen.findByRole('dialog', { name: '快速关联 Target 和 Agent' })
    await user.click(within(dialog).getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: /Tokyo Agent/ }))

    expect(within(dialog).getByRole('combobox')).toHaveTextContent('Tokyo Agent')
    expect(within(dialog).getByRole('button', { name: '快速关联' })).toBeEnabled()

    await user.click(within(dialog).getByRole('button', { name: '快速关联' }))

    expect(agentPageSizes).toContain('100')
    expect(quickAssociateRequests).toEqual([
      {
        target_uuid: targetItem.target_uuid,
        agent_uuid: agentItem.agent_uuid,
      },
    ])
  })

  it('does not render raw Target addresses in the target list', async () => {
    server.use(
      http.get('*/api/v1/targets', () => HttpResponse.json(paginate([createMockTarget({
        name: 'Tokyo Target',
        target: 'secret-origin.example.com',
        ip_version: '4',
      })]))),
      http.get('*/api/v1/agents', () => HttpResponse.json(paginate([createMockAgent()]))),
    )

    renderWithProviders(<TargetsPage />)

    expect(await screen.findByText('Tokyo Target')).toBeInTheDocument()
    expect(screen.queryByText('secret-origin.example.com')).not.toBeInTheDocument()
  })

  it('renders a live Markdown preview for the target comment field', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('*/api/v1/targets', () => HttpResponse.json(paginate([createMockTarget({ ip_version: '4' })]))),
      http.get('*/api/v1/agents', () => HttpResponse.json(paginate([createMockAgent()]))),
      http.get('*/api/v1/geo/continents', () => HttpResponse.json({ items: [] })),
      http.get('*/api/v1/geo/countries', () => HttpResponse.json({ items: [] })),
      http.get('*/api/v1/geo/cities', () => HttpResponse.json({ items: [] })),
      http.get('*/api/v1/tags', () => HttpResponse.json({ items: [] })),
    )

    renderWithProviders(<TargetsPage />)

    await user.click(screen.getByRole('button', { name: '新增 Target' }))
    const dialog = await screen.findByRole('dialog', { name: '新增 Target' })
    const comment = within(dialog).getByRole('textbox', { name: '备注' })

    await user.click(comment)
    await user.paste(
      '# Tokyo Edge\n\n- IPv4 + IPv6\n- Anycast\n\n1. First probe\n2. Second probe\n\n> Public monitoring target\n\n[Runbook](https://example.com/runbook)\n\n```\ncurl https://example.com\n```\n\n**Probe note** uses `icmp`.',
    )

    const preview = within(dialog).getByRole('region', { name: 'Markdown 预览' })
    expect(within(preview).getByRole('heading', { name: 'Tokyo Edge' })).toBeInTheDocument()
    expect(within(preview).getByText('IPv4 + IPv6')).toBeInTheDocument()
    expect(within(preview).getByText('Anycast')).toBeInTheDocument()
    expect(within(preview).getByText('First probe')).toBeInTheDocument()
    expect(within(preview).getByText('Second probe')).toBeInTheDocument()
    expect(within(preview).getByText('Public monitoring target').closest('blockquote')).toBeInTheDocument()
    const runbookLink = within(preview).getByRole('link', { name: 'Runbook' })
    expect(runbookLink).toHaveAttribute('href', 'https://example.com/runbook')
    expect(runbookLink).toHaveClass('text-accent-foreground')
    expect(within(preview).getByText('curl https://example.com').tagName).toBe('CODE')
    expect(within(preview).getByText('Probe note').tagName).toBe('STRONG')
    expect(within(preview).getByText('icmp').tagName).toBe('CODE')
  })

  it('shows human-readable IP version labels in the target form select', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('*/api/v1/targets', () => HttpResponse.json(paginate([createMockTarget({ ip_version: '4' })]))),
      http.get('*/api/v1/agents', () => HttpResponse.json(paginate([createMockAgent()]))),
      http.get('*/api/v1/geo/continents', () => HttpResponse.json({ items: [] })),
      http.get('*/api/v1/geo/countries', () => HttpResponse.json({ items: [] })),
      http.get('*/api/v1/geo/cities', () => HttpResponse.json({ items: [] })),
      http.get('*/api/v1/tags', () => HttpResponse.json({ items: [] })),
    )

    renderWithProviders(<TargetsPage />)

    await user.click(screen.getByRole('button', { name: '新增 Target' }))
    const dialog = await screen.findByRole('dialog', { name: '新增 Target' })
    const ipVersionSelect = within(dialog).getByRole('combobox', { name: 'IP 版本' })

    expect(ipVersionSelect).toHaveTextContent('IPv4 + IPv6')
    expect(ipVersionSelect).not.toHaveTextContent(/^4\+6$/)

    await user.click(ipVersionSelect)
    await user.click(await screen.findByRole('option', { name: 'IPv4' }))

    expect(ipVersionSelect).toHaveTextContent('IPv4')
    expect(ipVersionSelect).not.toHaveTextContent(/^4$/)
  })
})
