import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { GeoInput } from './geo-input'
import { renderWithProviders } from '@/test/utils'
import { server } from '@/test/mocks/server'

describe('GeoInput', () => {
  it('selects continent, country, and city through API suggestions', async () => {
    const user = userEvent.setup()
    let value = { continent: '', country: '', city: '' }
    server.use(
      http.get('/api/v1/geo/continents', () => HttpResponse.json({
        data: {
          items: [
            {
              continent_uuid: 'continent-asia',
              name: 'Asia',
              code: 'AS',
              name_zh: '亚洲',
              is_deleted: false,
              created_at: '2026-05-25T00:00:00Z',
              updated_at: '2026-05-25T00:00:00Z',
            },
          ],
        },
      })),
      http.get('/api/v1/geo/countries', () => HttpResponse.json({
        data: {
          items: [
            {
              country_uuid: 'country-japan',
              continent_uuid: 'continent-asia',
              name: 'Japan',
              code: 'JP',
              name_zh: '日本',
              is_deleted: false,
              created_at: '2026-05-25T00:00:00Z',
              updated_at: '2026-05-25T00:00:00Z',
            },
          ],
        },
      })),
      http.get('/api/v1/geo/cities', () => HttpResponse.json({
        data: {
          items: [
            {
              city_uuid: 'city-tokyo',
              country_uuid: 'country-japan',
              name: 'Tokyo',
              code: 'TYO',
              name_zh: '东京',
              is_capital: true,
              popularity: 1000,
              is_deleted: false,
              created_at: '2026-05-25T00:00:00Z',
              updated_at: '2026-05-25T00:00:00Z',
            },
          ],
        },
      })),
    )

    const { rerender } = renderWithProviders(
      <GeoInput value={value} onChange={(next) => { value = next }} required />,
    )

    await user.click(screen.getByPlaceholderText('搜索或输入大洲'))
    await user.click(await screen.findByText('Asia / 亚洲 · AS'))
    expect(value).toEqual({ continent: 'Asia', country: '', city: '' })

    rerender(<GeoInput value={value} onChange={(next) => { value = next }} required />)
    await user.click(screen.getByPlaceholderText('搜索或输入国家'))
    await user.click(await screen.findByText('Japan / 日本 · JP'))
    expect(value).toEqual({ continent: 'Asia', country: 'Japan', city: '' })

    rerender(<GeoInput value={value} onChange={(next) => { value = next }} required />)
    await user.click(screen.getByPlaceholderText('搜索或输入城市'))
    await user.click(await screen.findByText('Tokyo / 东京 · TYO'))
    expect(value).toEqual({ continent: 'Asia', country: 'Japan', city: 'Tokyo' })
  })
})
