import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import TargetsPage from './targets-page'
import { renderWithProviders } from '@/test/utils'
import { server } from '@/test/mocks/server'
import { createMockAgent, createMockTarget, paginate } from '@/test/mocks/data/factories'

describe('TargetsPage', () => {
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

    await user.type(comment, '# Tokyo Edge{enter}{enter}- IPv4 + IPv6{enter}- Anycast{enter}{enter}**Probe note** uses `icmp`.')

    const preview = within(dialog).getByRole('region', { name: 'Markdown 预览' })
    expect(within(preview).getByRole('heading', { name: 'Tokyo Edge' })).toBeInTheDocument()
    expect(within(preview).getByText('IPv4 + IPv6')).toBeInTheDocument()
    expect(within(preview).getByText('Anycast')).toBeInTheDocument()
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
