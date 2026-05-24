import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  type GeoCity,
  type GeoContinent,
  type GeoCountry,
  useCreateGeoCity,
  useCreateGeoContinent,
  useCreateGeoCountry,
  useDeleteGeoCity,
  useDeleteGeoContinent,
  useDeleteGeoCountry,
  useGeoCities,
  useGeoContinents,
  useGeoCountries,
  useUpdateGeoCity,
  useUpdateGeoContinent,
  useUpdateGeoCountry,
} from '@/api/hooks/admin-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type GeoTab = 'continent' | 'country' | 'city'

export default function GeoManagementPage() {
  const [tab, setTab] = useState<GeoTab>('continent')
  const [keyword, setKeyword] = useState('')
  const [selectedContinentUuid, setSelectedContinentUuid] = useState('')
  const [selectedCountryUuid, setSelectedCountryUuid] = useState('')
  const continentsQuery = useGeoContinents({ keyword: tab === 'continent' ? keyword : undefined, limit: 500 })
  const countriesQuery = useGeoCountries({
    continent_uuid: selectedContinentUuid,
    keyword: tab === 'country' ? keyword : undefined,
    limit: 500,
  })
  const citiesQuery = useGeoCities({
    country_uuid: selectedCountryUuid,
    keyword: tab === 'city' ? keyword : undefined,
    limit: 500,
  })

  const continents = continentsQuery.data?.items ?? []
  const countries = countriesQuery.data?.items ?? []
  const cities = citiesQuery.data?.items ?? []
  const selectedContinent = useMemo(
    () => continents.find((item) => item.continent_uuid === selectedContinentUuid),
    [continents, selectedContinentUuid],
  )
  const selectedCountry = useMemo(
    () => countries.find((item) => item.country_uuid === selectedCountryUuid),
    [countries, selectedCountryUuid],
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">GEO 管理</h1>
          <p className="text-sm text-text-muted">维护 Target 和 Agent 表单可检索的大洲、国家和城市目录。</p>
        </div>
        <div className="flex rounded-lg border border-border bg-muted/20 p-1">
          {(['continent', 'country', 'city'] as GeoTab[]).map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm ${tab === item ? 'bg-accent text-accent-foreground' : 'text-text-muted hover:text-text-primary'}`}
              onClick={() => setTab(item)}
            >
              {item === 'continent' ? '大洲' : item === 'country' ? '国家' : '城市'}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-light rounded-xl p-4">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="按名称、中文名或代码搜索" />
          <Select value={selectedContinentUuid} onValueChange={(value) => {
            setSelectedContinentUuid(value ?? '')
            setSelectedCountryUuid('')
          }}>
            <SelectTrigger className="w-full"><SelectValue placeholder="选择大洲" /></SelectTrigger>
            <SelectContent>
              {continents.map((continent) => (
                <SelectItem key={continent.continent_uuid} value={continent.continent_uuid}>
                  {continent.name}{continent.name_zh ? ` / ${continent.name_zh}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCountryUuid} onValueChange={(value) => setSelectedCountryUuid(value ?? '')} disabled={!selectedContinentUuid}>
            <SelectTrigger className="w-full"><SelectValue placeholder="选择国家" /></SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.country_uuid} value={country.country_uuid}>
                  {country.name}{country.name_zh ? ` / ${country.name_zh}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {tab === 'continent' && <ContinentPanel items={continents} isLoading={continentsQuery.isLoading} />}
        {tab === 'country' && <CountryPanel continent={selectedContinent} items={countries} isLoading={countriesQuery.isLoading} />}
        {tab === 'city' && <CityPanel country={selectedCountry} items={cities} isLoading={citiesQuery.isLoading} />}
      </div>
    </div>
  )
}

function ContinentPanel({ items, isLoading }: { items: GeoContinent[]; isLoading: boolean }) {
  const create = useCreateGeoContinent()
  const [form, setForm] = useState({ name: '', code: '', name_zh: '' })

  return (
    <GeoTableShell
      form={<>
        <GeoText label="大洲英文名" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <GeoText label="代码" value={form.code} onChange={(code) => setForm({ ...form, code })} />
        <GeoText label="中文名" value={form.name_zh} onChange={(name_zh) => setForm({ ...form, name_zh })} />
        <Button onClick={() => create.mutate(
          { name: form.name, code: form.code || null, name_zh: form.name_zh || null },
          {
            onSuccess: () => {
              toast.success('大洲已创建')
              setForm({ name: '', code: '', name_zh: '' })
            },
            onError: (error) => toast.error(error.message || '创建失败'),
          },
        )}>新增大洲</Button>
      </>}
      isLoading={isLoading}
      emptyText="暂无大洲"
      hasItems={items.length > 0}
    >
      {items.map((item) => (
        <ContinentRow key={item.continent_uuid} item={item} />
      ))}
    </GeoTableShell>
  )
}

function ContinentRow({ item }: { item: GeoContinent }) {
  const update = useUpdateGeoContinent()
  const deleteItem = useDeleteGeoContinent()
  const [draft, setDraft] = useState({ name: item.name, name_zh: item.name_zh ?? '', code: item.code ?? '' })

  return (
    <TableRow>
      <TableCell><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></TableCell>
      <TableCell><Input value={draft.name_zh} onChange={(event) => setDraft({ ...draft, name_zh: event.target.value })} /></TableCell>
      <TableCell><Input value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} /></TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={() => update.mutate(
          { uuid: item.continent_uuid, data: { name: draft.name, code: draft.code || null, name_zh: draft.name_zh || null } },
          {
            onSuccess: () => toast.success('大洲已更新'),
            onError: (error) => toast.error(error.message || '更新失败'),
          },
        )}>保存</Button>
        <Button variant="ghost" size="sm" className="text-red-400" onClick={() => deleteItem.mutate(item.continent_uuid)}>删除</Button>
      </TableCell>
    </TableRow>
  )
}

function CountryPanel({ continent, items, isLoading }: { continent?: GeoContinent; items: GeoCountry[]; isLoading: boolean }) {
  const create = useCreateGeoCountry()
  const [form, setForm] = useState({ name: '', code: '', name_zh: '' })
  return (
    <GeoTableShell
      form={<>
        <GeoText label="国家英文名" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <GeoText label="代码" value={form.code} onChange={(code) => setForm({ ...form, code })} />
        <GeoText label="中文名" value={form.name_zh} onChange={(name_zh) => setForm({ ...form, name_zh })} />
        <Button disabled={!continent} onClick={() => continent && create.mutate(
          { continent_uuid: continent.continent_uuid, name: form.name, code: form.code || null, name_zh: form.name_zh || null },
          {
            onSuccess: () => {
              toast.success('国家已创建')
              setForm({ name: '', code: '', name_zh: '' })
            },
            onError: (error) => toast.error(error.message || '创建失败'),
          },
        )}>新增国家</Button>
      </>}
      isLoading={isLoading}
      emptyText={continent ? '暂无国家' : '请先选择大洲'}
      hasItems={items.length > 0}
    >
      {items.map((item) => (
        <CountryRow key={item.country_uuid} item={item} />
      ))}
    </GeoTableShell>
  )
}

function CountryRow({ item }: { item: GeoCountry }) {
  const update = useUpdateGeoCountry()
  const deleteItem = useDeleteGeoCountry()
  const [draft, setDraft] = useState({ name: item.name, name_zh: item.name_zh ?? '', code: item.code ?? '' })

  return (
    <TableRow>
      <TableCell><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></TableCell>
      <TableCell><Input value={draft.name_zh} onChange={(event) => setDraft({ ...draft, name_zh: event.target.value })} /></TableCell>
      <TableCell><Input value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} /></TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={() => update.mutate(
          { uuid: item.country_uuid, data: { name: draft.name, code: draft.code || null, name_zh: draft.name_zh || null } },
          {
            onSuccess: () => toast.success('国家已更新'),
            onError: (error) => toast.error(error.message || '更新失败'),
          },
        )}>保存</Button>
        <Button variant="ghost" size="sm" className="text-red-400" onClick={() => deleteItem.mutate(item.country_uuid)}>删除</Button>
      </TableCell>
    </TableRow>
  )
}

function CityPanel({ country, items, isLoading }: { country?: GeoCountry; items: GeoCity[]; isLoading: boolean }) {
  const create = useCreateGeoCity()
  const [form, setForm] = useState({ name: '', code: '', name_zh: '' })
  return (
    <GeoTableShell
      form={<>
        <GeoText label="城市英文名" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <GeoText label="代码" value={form.code} onChange={(code) => setForm({ ...form, code })} />
        <GeoText label="中文名" value={form.name_zh} onChange={(name_zh) => setForm({ ...form, name_zh })} />
        <Button disabled={!country} onClick={() => country && create.mutate(
          { country_uuid: country.country_uuid, name: form.name, code: form.code || null, name_zh: form.name_zh || null },
          {
            onSuccess: () => {
              toast.success('城市已创建')
              setForm({ name: '', code: '', name_zh: '' })
            },
            onError: (error) => toast.error(error.message || '创建失败'),
          },
        )}>新增城市</Button>
      </>}
      isLoading={isLoading}
      emptyText={country ? '暂无城市' : '请先选择国家'}
      hasItems={items.length > 0}
    >
      {items.map((item) => (
        <CityRow key={item.city_uuid} item={item} />
      ))}
    </GeoTableShell>
  )
}

function CityRow({ item }: { item: GeoCity }) {
  const update = useUpdateGeoCity()
  const deleteItem = useDeleteGeoCity()
  const [draft, setDraft] = useState({ name: item.name, name_zh: item.name_zh ?? '', code: item.code ?? '' })

  return (
    <TableRow>
      <TableCell><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></TableCell>
      <TableCell><Input value={draft.name_zh} onChange={(event) => setDraft({ ...draft, name_zh: event.target.value })} /></TableCell>
      <TableCell><Input value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} /></TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={() => update.mutate(
          { uuid: item.city_uuid, data: { name: draft.name, code: draft.code || null, name_zh: draft.name_zh || null } },
          {
            onSuccess: () => toast.success('城市已更新'),
            onError: (error) => toast.error(error.message || '更新失败'),
          },
        )}>保存</Button>
        <Button variant="ghost" size="sm" className="text-red-400" onClick={() => deleteItem.mutate(item.city_uuid)}>删除</Button>
      </TableCell>
    </TableRow>
  )
}

function GeoTableShell({
  form,
  isLoading,
  emptyText,
  hasItems,
  children,
}: {
  form: React.ReactNode
  isLoading: boolean
  emptyText: string
  hasItems: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-3 md:grid-cols-4 md:items-end">
        {form}
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}
        </div>
      ) : hasItems ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>英文名</TableHead>
              <TableHead>中文名</TableHead>
              <TableHead>代码</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{children}</TableBody>
        </Table>
      ) : (
        <div className="p-6 text-center text-sm text-text-muted">{emptyText}</div>
      )}
    </div>
  )
}

function GeoText({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <Label className="mb-1.5 text-xs text-text-secondary">{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}
