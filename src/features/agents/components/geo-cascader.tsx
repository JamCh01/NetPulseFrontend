import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GEO_DATA, findContinent, findCountry, geoName } from '@/lib/geo-data'

interface GeoCascaderProps {
  continent: string
  country: string
  city: string
  onChange: (values: { continent: string; country: string; city: string }) => void
}

export function GeoCascader({ continent, country, city, onChange }: GeoCascaderProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language

  const continentData = useMemo(() => findContinent(continent), [continent])
  const countries = useMemo(() => continentData?.countries ?? [], [continentData])
  const countryData = useMemo(() => findCountry(continent, country), [continent, country])
  const cities = useMemo(() => countryData?.cities ?? [], [countryData])

  const handleContinentChange = (val: string | null) => {
    onChange({ continent: val ?? '', country: '', city: '' })
  }

  const handleCountryChange = (val: string | null) => {
    onChange({ continent, country: val ?? '', city: '' })
  }

  const handleCityChange = (val: string | null) => {
    onChange({ continent, country, city: val ?? '' })
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Continent */}
      <div>
        <Label className="text-xs text-text-secondary mb-1.5">{t('agents.continent')}</Label>
        <Select value={continent} onValueChange={handleContinentChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('agents.selectContinent')}>
              {(value: string | null) => {
                if (!value) return t('agents.selectContinent')
                const item = GEO_DATA.find((c) => c.code === value)
                return item ? geoName(item, lang) : value
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {GEO_DATA.filter((c) => c.countries.length > 0).map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {geoName(c, lang)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Country */}
      <div>
        <Label className="text-xs text-text-secondary mb-1.5">{t('agents.country')}</Label>
        <Select
          value={country}
          onValueChange={handleCountryChange}
          disabled={!continent}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('agents.selectCountry')}>
              {(value: string | null) => {
                if (!value) return t('agents.selectCountry')
                const item = countries.find((c) => c.code === value)
                return item ? geoName(item, lang) : value
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {geoName(c, lang)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      <div>
        <Label className="text-xs text-text-secondary mb-1.5">{t('agents.city')}</Label>
        <Select
          value={city}
          onValueChange={handleCityChange}
          disabled={!country}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('agents.selectCity')}>
              {(value: string | null) => {
                if (!value) return t('agents.selectCity')
                const item = cities.find((c) => c.code === value)
                return item ? geoName(item, lang) : value
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {cities.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {geoName(c, lang)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
