export interface TargetGeoTreeTarget {
  target_uuid: string
  name: string
  target: string
  target_type?: string | null
  ip_version?: string | null
  is_anycast?: boolean
  carrier?: string | null
}

export interface TargetGeoTreeCity {
  city: string
  target_count: number
  targets: TargetGeoTreeTarget[]
}

export interface TargetGeoTreeCountry {
  country: string
  target_count: number
  cities: TargetGeoTreeCity[]
}

export interface TargetGeoTreeContinent {
  continent: string
  target_count: number
  countries: TargetGeoTreeCountry[]
}

export interface TargetGeoTreeData {
  total_target_count?: number
  anycast_target_count?: number
  tree?: TargetGeoTreeContinent[]
  anycast?: {
    target_count: number
    targets: TargetGeoTreeTarget[]
  }
}

export type TargetGeoTreeRow =
  | {
      type: 'group'
      id: string
      label: string
      depth: number
      count: number
      parentId?: string
    }
  | {
      type: 'target'
      id: string
      label: string
      depth: number
      targetUuid: string
      target: string
      targetType?: string | null
      carrier?: string | null
      parentId: string
    }

function targetRow(target: TargetGeoTreeTarget, depth: number, parentId: string): TargetGeoTreeRow {
  return {
    type: 'target',
    id: `target:${target.target_uuid}`,
    label: target.name,
    depth,
    targetUuid: target.target_uuid,
    target: target.target,
    targetType: target.target_type,
    carrier: target.carrier,
    parentId,
  }
}

export function flattenTargetGeoTree(data: TargetGeoTreeData | null | undefined): TargetGeoTreeRow[] {
  const rows: TargetGeoTreeRow[] = []

  const anycastTargets = data?.anycast?.targets ?? []
  if (anycastTargets.length > 0) {
    rows.push({
      type: 'group',
      id: 'anycast',
      label: 'AnyCast',
      depth: 0,
      count: data?.anycast?.target_count ?? anycastTargets.length,
    })
    for (const target of anycastTargets) {
      rows.push(targetRow(target, 1, 'anycast'))
    }
  }

  for (const continent of data?.tree ?? []) {
    const continentId = `continent:${continent.continent}`
    rows.push({
      type: 'group',
      id: continentId,
      label: continent.continent || 'Unknown Continent',
      depth: 0,
      count: continent.target_count,
    })

    for (const country of continent.countries ?? []) {
      const countryId = `${continentId}:country:${country.country}`
      rows.push({
        type: 'group',
        id: countryId,
        label: country.country || 'Unknown Country',
        depth: 1,
        count: country.target_count,
        parentId: continentId,
      })

      for (const city of country.cities ?? []) {
        const cityId = `${countryId}:city:${city.city}`
        rows.push({
          type: 'group',
          id: cityId,
          label: city.city || 'Unknown City',
          depth: 2,
          count: city.target_count,
          parentId: countryId,
        })

        for (const target of city.targets ?? []) {
          rows.push(targetRow(target, 3, cityId))
        }
      }
    }
  }

  return rows
}

export function visibleTargetGeoRows(rows: TargetGeoTreeRow[], collapsedGroupIds: Set<string>): TargetGeoTreeRow[] {
  const hiddenGroupIds = new Set<string>()
  const visible: TargetGeoTreeRow[] = []

  for (const row of rows) {
    if (row.parentId && hiddenGroupIds.has(row.parentId)) {
      if (row.type === 'group') hiddenGroupIds.add(row.id)
      continue
    }

    visible.push(row)

    if (row.type === 'group' && collapsedGroupIds.has(row.id)) {
      hiddenGroupIds.add(row.id)
    }
  }

  return visible
}
