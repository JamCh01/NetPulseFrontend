import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TagInput } from './tag-input'
import { renderWithProviders } from '@/test/utils'
import { server } from '@/test/mocks/server'

describe('TagInput', () => {
  it('adds suggested tags and serializes the selected values', async () => {
    const user = userEvent.setup()
    let value = ''
    server.use(
      http.get('/api/v1/tags', () => HttpResponse.json({
        data: {
          items: [
            { tag: 'prod', resource_type: 'target', resource_count: 2 },
          ],
        },
      })),
    )

    const { rerender } = renderWithProviders(
      <TagInput label="标签" resourceType="target" value={value} onChange={(next) => { value = next }} />,
    )

    await user.type(screen.getByPlaceholderText('输入标签并搜索，Enter 添加'), 'pr')
    await user.click(await screen.findByText('prod'))

    expect(value).toBe('prod')

    rerender(
      <TagInput label="标签" resourceType="target" value={value} onChange={(next) => { value = next }} />,
    )
    await user.type(screen.getByPlaceholderText('输入标签并搜索，Enter 添加'), 'edge{Enter}')

    expect(value).toBe('prod, edge')
  })
})
