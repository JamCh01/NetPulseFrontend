import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'

import { TargetGeoSidebarTree } from './target-geo-sidebar-tree'
import { renderWithProviders } from '@/test/utils'
import { server } from '@/test/mocks/server'

describe('TargetGeoSidebarTree', () => {
  it('renders target links without the secondary target value span', async () => {
    server.use(
      http.get('*/api/v1/monitoring/target-geo-tree', () => HttpResponse.json({
        data: {
          total_target_count: 1,
          anycast_target_count: 0,
          anycast: { target_count: 0, targets: [] },
          tree: [
            {
              continent: 'Asia',
              target_count: 1,
              countries: [
                {
                  country: 'Japan',
                  target_count: 1,
                  cities: [
                    {
                      city: 'Tokyo',
                      target_count: 1,
                      targets: [
                        {
                          target_uuid: 'target-1',
                          name: 'Tokyo Edge',
                          target: 'hidden.example.com',
                          target_type: 'domain',
                          ip_version: '4+6',
                          is_anycast: false,
                          carrier: 'Example Transit',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      })),
    )

    renderWithProviders(
      <TargetGeoSidebarTree basePath="/app/monitoring" expanded onToggle={() => {}} />,
      { initialEntries: ['/app/monitoring'] },
    )

    const targetLink = (await screen.findByText('Tokyo Edge')).closest('a')
    if (!targetLink) {
      throw new Error('Tokyo Edge target link was not rendered')
    }
    expect(within(targetLink).getByText('Tokyo Edge')).toBeInTheDocument()
    expect(within(targetLink).queryByText('hidden.example.com')).not.toBeInTheDocument()
    expect(targetLink).toHaveAttribute('title', 'Tokyo Edge')
    expect(targetLink.querySelectorAll('span')).toHaveLength(1)
  })
})
