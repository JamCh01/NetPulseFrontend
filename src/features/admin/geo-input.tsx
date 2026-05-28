import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'

import {
  type GeoCity,
  type GeoContinent,
  type GeoCountry,
  useGeoCities,
  useGeoContinents,
  useGeoCountries,
} from '@/api/hooks/admin-api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface GeoInputValue {
  continent: string
  country: string
  city: string
}

interface GeoInputProps {
  value: GeoInputValue
  onChange: (value: GeoInputValue) => void
  required?: boolean
}

function displayGeoName(item: { name: string; name_zh?: string | null; code?: string | null }) {
  const zh = item.name_zh && item.name_zh !== item.name ? ` / ${item.name_zh}` : ''
  const code = item.code ? ` · ${item.code}` : ''
  return `${item.name}${zh}${code}`
}

function exactGeoMatch<T extends { name: string; name_zh?: string | null }>(items: T[], value: string): T | undefined {
  const key = value.trim().toLowerCase()
  if (!key) return undefined
  return items.find((item) => item.name.toLowerCase() === key || item.name_zh?.toLowerCase() === key)
}

export function GeoInput({ value, onChange, required = false }: GeoInputProps) {
  const { t } = useTranslation()
  const [focused, setFocused] = useState<'continent' | 'country' | 'city' | null>(null)
  const [selectedContinentUuid, setSelectedContinentUuid] = useState('')
  const [selectedCountryUuid, setSelectedCountryUuid] = useState('')
  const continentsQuery = useGeoContinents({ keyword: value.continent, limit: 30 })
  const matchedContinent = useMemo(
    () => exactGeoMatch(continentsQuery.data?.items ?? [], value.continent),
    [continentsQuery.data?.items, value.continent],
  )
  const continentUuid = selectedContinentUuid || matchedContinent?.continent_uuid
  const countriesQuery = useGeoCountries({ continent_uuid: continentUuid, keyword: value.country, limit: 50 })
  const matchedCountry = useMemo(
    () => exactGeoMatch(countriesQuery.data?.items ?? [], value.country),
    [countriesQuery.data?.items, value.country],
  )
  const countryUuid = selectedCountryUuid || matchedCountry?.country_uuid
  const citiesQuery = useGeoCities({ country_uuid: countryUuid, keyword: value.city, limit: 50 })

  useEffect(() => {
    if (!value.continent || matchedContinent || continentsQuery.isFetching) return
    const candidate = (continentsQuery.data?.items ?? [])[0]
    if (candidate?.name.toLowerCase() === value.continent.toLowerCase()) return
  }, [matchedContinent, continentsQuery.data?.items, continentsQuery.isFetching, value.continent])

  const update = (patch: Partial<GeoInputValue>) => onChange({ ...value, ...patch })

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <GeoSearchField
        label={t('adminInputs.continent')}
        placeholder={t('adminInputs.continentPlaceholder')}
        value={value.continent}
        required={required}
        focused={focused === 'continent'}
        items={continentsQuery.data?.items ?? []}
        getKey={(item) => item.continent_uuid}
        getLabel={displayGeoName}
        onFocus={() => setFocused('continent')}
        onBlur={() => setTimeout(() => setFocused((current) => current === 'continent' ? null : current), 120)}
        onInput={(text) => {
          setSelectedContinentUuid('')
          setSelectedCountryUuid('')
          update({ continent: text, country: '', city: '' })
        }}
        onSelect={(item) => {
          setSelectedContinentUuid(item.continent_uuid)
          setSelectedCountryUuid('')
          update({ continent: item.name, country: '', city: '' })
          setFocused(null)
        }}
      />
      <GeoSearchField
        label={t('adminInputs.country')}
        placeholder={continentUuid ? t('adminInputs.countryPlaceholder') : t('adminInputs.selectContinentFirst')}
        value={value.country}
        required={required}
        disabled={!continentUuid}
        focused={focused === 'country'}
        items={countriesQuery.data?.items ?? []}
        getKey={(item) => item.country_uuid}
        getLabel={displayGeoName}
        onFocus={() => setFocused('country')}
        onBlur={() => setTimeout(() => setFocused((current) => current === 'country' ? null : current), 120)}
        onInput={(text) => {
          setSelectedCountryUuid('')
          update({ country: text, city: '' })
        }}
        onSelect={(item) => {
          setSelectedCountryUuid(item.country_uuid)
          update({ country: item.name, city: '' })
          setFocused(null)
        }}
      />
      <GeoSearchField
        label={t('adminInputs.city')}
        placeholder={countryUuid ? t('adminInputs.cityPlaceholder') : t('adminInputs.selectCountryFirst')}
        value={value.city}
        required={required}
        disabled={!countryUuid}
        focused={focused === 'city'}
        items={citiesQuery.data?.items ?? []}
        getKey={(item) => item.city_uuid}
        getLabel={displayGeoName}
        onFocus={() => setFocused('city')}
        onBlur={() => setTimeout(() => setFocused((current) => current === 'city' ? null : current), 120)}
        onInput={(text) => update({ city: text })}
        onSelect={(item) => {
          update({ city: item.name })
          setFocused(null)
        }}
      />
    </div>
  )
}

interface GeoSearchFieldProps<T extends GeoContinent | GeoCountry | GeoCity> {
  label: string
  placeholder: string
  value: string
  items: T[]
  focused: boolean
  required?: boolean
  disabled?: boolean
  getKey: (item: T) => string
  getLabel: (item: T) => string
  onFocus: () => void
  onBlur: () => void
  onInput: (value: string) => void
  onSelect: (item: T) => void
}

function GeoSearchField<T extends GeoContinent | GeoCountry | GeoCity>({
  label,
  placeholder,
  value,
  items,
  focused,
  required = false,
  disabled = false,
  getKey,
  getLabel,
  onFocus,
  onBlur,
  onInput,
  onSelect,
}: GeoSearchFieldProps<T>) {
  const showMenu = focused && !disabled && items.length > 0

  return (
    <div className="relative">
      <Label className="mb-1.5 text-xs text-text-secondary">{label}</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-dim" />
        <Input
          className="pl-8"
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          required={required}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(event) => onInput(event.target.value)}
        />
      </div>
      {showMenu && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-xl">
          {items.map((item) => (
            <button
              key={getKey(item)}
              type="button"
              className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-text-secondary hover:bg-muted hover:text-text-primary"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(item)}
            >
              {getLabel(item)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
