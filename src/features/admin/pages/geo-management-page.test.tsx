import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import GeoManagementPage from './geo-management-page'
import { renderWithProviders } from '@/test/utils'
import { server } from '@/test/mocks/server'

describe('GeoManagementPage', () => {
  it('renders and expands the geo catalog as a continent-country-city tree', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('/api/v1/geo/tree', () => HttpResponse.json({
        data: {
          total_continent_count: 1,
          total_country_count: 1,
          total_city_count: 1,
          items: [
            {
              continent_uuid: 'continent-asia',
              name: 'Asia',
              code: 'AS',
              name_zh: '亚洲',
              country_count: 1,
              city_count: 1,
              countries: [
                {
                  country_uuid: 'country-japan',
                  continent_uuid: 'continent-asia',
                  name: 'Japan',
                  code: 'JP',
                  name_zh: '日本',
                  city_count: 1,
                  cities: [
                    {
                      city_uuid: 'city-tokyo',
                      country_uuid: 'country-japan',
                      continent_uuid: 'continent-asia',
                      name: 'Tokyo',
                      code: 'TYO',
                      name_zh: '东京',
                      is_capital: true,
                      popularity: 1000,
                    },
                  ],
                },
              ],
            },
          ],
        },
      })),
    )

    renderWithProviders(<GeoManagementPage />)

    await user.click(await screen.findByRole('button', { name: 'Asia' }))
    await user.click(await screen.findByRole('button', { name: 'Japan' }))

    expect(screen.getByText('Tokyo')).toBeInTheDocument()
    expect(screen.getByText('TYO')).toBeInTheDocument()
    expect(within(screen.getByLabelText('GEO 树形目录')).getByText(/亚洲/)).toBeInTheDocument()
  })
})
