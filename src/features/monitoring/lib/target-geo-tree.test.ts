import { describe, expect, it } from 'vitest'
import { flattenTargetGeoTree } from './target-geo-tree'

describe('flattenTargetGeoTree', () => {
  it('flattens AnyCast targets and continent-country-city targets in sidebar order', () => {
    const rows = flattenTargetGeoTree({
      anycast: {
        target_count: 1,
        targets: [
          {
            target_uuid: 'anycast-target',
            name: 'Anycast Target',
            target: '1.1.1.1',
            target_type: 'ip',
            ip_version: '4',
            carrier: 'Cloudflare',
          },
        ],
      },
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
                      target_uuid: 'tokyo-target',
                      name: 'Tokyo Target',
                      target: 'example.jp',
                      target_type: 'domain',
                      ip_version: '4',
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
    })

    expect(rows.map((row) => row.label)).toEqual([
      'AnyCast',
      'Anycast Target',
      'Asia',
      'Japan',
      'Tokyo',
      'Tokyo Target',
    ])
    expect(rows[1]).toMatchObject({ type: 'target', depth: 1, targetUuid: 'anycast-target', target: '1.1.1.1' })
    expect(rows[5]).toMatchObject({ type: 'target', depth: 3, targetUuid: 'tokyo-target', target: 'example.jp' })
  })
})
