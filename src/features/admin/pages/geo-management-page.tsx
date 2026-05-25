import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  type GeoContinent,
  type GeoCountry,
  type GeoTreeCity,
  type GeoTreeContinent,
  type GeoTreeCountry,
  useCreateGeoCity,
  useCreateGeoContinent,
  useCreateGeoCountry,
  useDeleteGeoCity,
  useDeleteGeoContinent,
  useDeleteGeoCountry,
  useGeoContinents,
  useGeoCountries,
  useGeoTree,
  useUpdateGeoCity,
  useUpdateGeoContinent,
  useUpdateGeoCountry,
} from '@/api/hooks/admin-api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

interface GeoFormState {
  name: string
  code: string
  name_zh: string
  continent_uuid: string
  country_uuid: string
  is_capital: boolean
  popularity: string
}

type GeoDialogState =
  | { mode: 'create'; type: 'continent'; parent?: never; item?: never }
  | { mode: 'edit'; type: 'continent'; item: GeoTreeContinent; parent?: never }
  | { mode: 'create'; type: 'country'; parent: GeoTreeContinent; item?: never }
  | { mode: 'edit'; type: 'country'; item: GeoTreeCountry; parent?: never }
  | { mode: 'create'; type: 'city'; parent: GeoTreeCountry; item?: never }
  | { mode: 'edit'; type: 'city'; item: GeoTreeCity; parent?: never }

const DEFAULT_FORM: GeoFormState = {
  name: '',
  code: '',
  name_zh: '',
  continent_uuid: '',
  country_uuid: '',
  is_capital: false,
  popularity: '100',
}

export default function GeoManagementPage() {
  const [keyword, setKeyword] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [dialog, setDialog] = useState<GeoDialogState | null>(null)
  const treeQuery = useGeoTree({ keyword: keyword || undefined })
  const data = treeQuery.data

  const toggle = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openDialog = (state: GeoDialogState) => setDialog(state)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">GEO 管理</h1>
          <p className="text-sm text-text-muted">维护 Target 和 Agent 表单可检索的大洲、国家和城市目录。</p>
        </div>
        <Button onClick={() => openDialog({ mode: 'create', type: 'continent' })}>
          <Plus className="size-4" />
          新增大洲
        </Button>
      </div>

      <section className="glass-light rounded-xl p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative md:w-96">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-dim" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索大洲、国家、城市或代码"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-text-muted">
            <span>大洲 {data?.total_continent_count ?? 0}</span>
            <span>国家 {data?.total_country_count ?? 0}</span>
            <span>城市 {data?.total_city_count ?? 0}</span>
          </div>
        </div>

        {treeQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 7 }, (_, index) => <Skeleton key={index} className="h-11 w-full" />)}
          </div>
        ) : treeQuery.error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center text-sm text-red-300">GEO 树加载失败</div>
        ) : !data?.items.length ? (
          <div className="rounded-lg border border-border bg-muted/20 p-6 text-center text-sm text-text-muted">暂无 GEO 数据</div>
        ) : (
          <div aria-label="GEO 树形目录" className="overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-[minmax(0,1fr)_88px_116px] gap-3 border-b border-border bg-muted/30 px-3 py-2 text-xs font-medium text-text-muted">
              <span>名称</span>
              <span>代码</span>
              <span className="text-right">操作</span>
            </div>
            <div className="divide-y divide-border/70">
              {data.items.map((continent) => (
                <GeoContinentRow
                  key={continent.continent_uuid}
                  continent={continent}
                  expanded={expanded}
                  onToggle={toggle}
                  onOpenDialog={openDialog}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <GeoEditDialog dialog={dialog} onClose={() => setDialog(null)} />
    </div>
  )
}

function GeoContinentRow({
  continent,
  expanded,
  onToggle,
  onOpenDialog,
}: {
  continent: GeoTreeContinent
  expanded: Set<string>
  onToggle: (id: string) => void
  onOpenDialog: (state: GeoDialogState) => void
}) {
  const id = `continent:${continent.continent_uuid}`
  const isOpen = expanded.has(id)
  const deleteContinent = useDeleteGeoContinent()
  return (
    <div>
      <TreeLine
        depth={0}
        label={continent.name}
        subLabel={continent.name_zh ?? undefined}
        code={continent.code ?? '-'}
        count={`${continent.country_count} 国家 / ${continent.city_count} 城市`}
        isOpen={isOpen}
        canExpand={continent.countries.length > 0}
        onToggle={() => onToggle(id)}
        onAdd={() => onOpenDialog({ mode: 'create', type: 'country', parent: continent })}
        onEdit={() => onOpenDialog({ mode: 'edit', type: 'continent', item: continent })}
        onDelete={() => deleteContinent.mutate(continent.continent_uuid, {
          onSuccess: () => toast.success('大洲已删除'),
          onError: (error) => toast.error(error.message || '删除失败'),
        })}
      />
      {isOpen && continent.countries.map((country) => (
        <GeoCountryRow
          key={country.country_uuid}
          country={country}
          expanded={expanded}
          onToggle={onToggle}
          onOpenDialog={onOpenDialog}
        />
      ))}
    </div>
  )
}

function GeoCountryRow({
  country,
  expanded,
  onToggle,
  onOpenDialog,
}: {
  country: GeoTreeCountry
  expanded: Set<string>
  onToggle: (id: string) => void
  onOpenDialog: (state: GeoDialogState) => void
}) {
  const id = `country:${country.country_uuid}`
  const isOpen = expanded.has(id)
  const deleteCountry = useDeleteGeoCountry()
  return (
    <div>
      <TreeLine
        depth={1}
        label={country.name}
        subLabel={country.name_zh ?? undefined}
        code={country.code ?? '-'}
        count={`${country.city_count} 城市`}
        isOpen={isOpen}
        canExpand={country.cities.length > 0}
        onToggle={() => onToggle(id)}
        onAdd={() => onOpenDialog({ mode: 'create', type: 'city', parent: country })}
        onEdit={() => onOpenDialog({ mode: 'edit', type: 'country', item: country })}
        onDelete={() => deleteCountry.mutate(country.country_uuid, {
          onSuccess: () => toast.success('国家已删除'),
          onError: (error) => toast.error(error.message || '删除失败'),
        })}
      />
      {isOpen && country.cities.map((city) => (
        <GeoCityRow key={city.city_uuid} city={city} onOpenDialog={onOpenDialog} />
      ))}
    </div>
  )
}

function GeoCityRow({ city, onOpenDialog }: { city: GeoTreeCity; onOpenDialog: (state: GeoDialogState) => void }) {
  const deleteCity = useDeleteGeoCity()
  return (
    <TreeLine
      depth={2}
      label={city.name}
      subLabel={city.name_zh ?? undefined}
      code={city.code ?? '-'}
      count={city.is_capital ? '首都 / 首府' : `权重 ${city.popularity}`}
      canExpand={false}
      onEdit={() => onOpenDialog({ mode: 'edit', type: 'city', item: city })}
      onDelete={() => deleteCity.mutate(city.city_uuid, {
        onSuccess: () => toast.success('城市已删除'),
        onError: (error) => toast.error(error.message || '删除失败'),
      })}
    />
  )
}

function TreeLine({
  depth,
  label,
  subLabel,
  code,
  count,
  canExpand,
  isOpen = false,
  onToggle,
  onAdd,
  onEdit,
  onDelete,
}: {
  depth: number
  label: string
  subLabel?: string
  code: string
  count: string
  canExpand: boolean
  isOpen?: boolean
  onToggle?: () => void
  onAdd?: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_88px_116px] items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/20">
      <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: depth * 20 }}>
        {canExpand ? (
          <button type="button" className="rounded p-1 text-text-muted hover:bg-muted hover:text-text-primary" onClick={onToggle}>
            {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        ) : (
          <span className="size-6" />
        )}
        <div className="min-w-0">
          <button type="button" className="block truncate text-left font-medium text-text-primary hover:text-cyan-300" onClick={canExpand ? onToggle : onEdit}>
            {label}
          </button>
          <div className="truncate text-xs text-text-muted">{[subLabel, count].filter(Boolean).join(' · ')}</div>
        </div>
      </div>
      <div className="font-[family-name:var(--font-mono)] text-xs text-text-secondary">{code}</div>
      <div className="flex justify-end gap-1">
        {onAdd && (
          <Button variant="ghost" size="icon" aria-label={`新增 ${label} 下级`} onClick={onAdd}>
            <Plus className="size-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" aria-label={`编辑 ${label}`} onClick={onEdit}>
          <Pencil className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label={`删除 ${label}`} className="text-red-400 hover:text-red-300" onClick={onDelete}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function GeoEditDialog({ dialog, onClose }: { dialog: GeoDialogState | null; onClose: () => void }) {
  const [form, setForm] = useState<GeoFormState>(DEFAULT_FORM)
  const continentsQuery = useGeoContinents({ limit: 500, enabled: !!dialog })
  const countriesQuery = useGeoCountries({ continent_uuid: form.continent_uuid, limit: 500 })
  const createContinent = useCreateGeoContinent()
  const updateContinent = useUpdateGeoContinent()
  const createCountry = useCreateGeoCountry()
  const updateCountry = useUpdateGeoCountry()
  const createCity = useCreateGeoCity()
  const updateCity = useUpdateGeoCity()

  useEffect(() => {
    if (!dialog) {
      setForm({ ...DEFAULT_FORM })
      return
    }
    if (dialog.mode === 'create') {
      setForm({
        ...DEFAULT_FORM,
        continent_uuid: dialog.type === 'country' ? dialog.parent.continent_uuid : '',
        country_uuid: dialog.type === 'city' ? dialog.parent.country_uuid : '',
      })
      return
    }
    setForm({
      name: dialog.item.name,
      code: dialog.item.code ?? '',
      name_zh: dialog.item.name_zh ?? '',
      continent_uuid: dialog.type === 'country' || dialog.type === 'city' ? dialog.item.continent_uuid : '',
      country_uuid: dialog.type === 'city' ? dialog.item.country_uuid : '',
      is_capital: dialog.type === 'city' ? dialog.item.is_capital : false,
      popularity: dialog.type === 'city' ? String(dialog.item.popularity) : '100',
    })
  }, [dialog])

  const title = dialog ? `${dialog.mode === 'create' ? '新增' : '编辑'}${typeLabel(dialog.type)}` : ''

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!dialog) return
    const common = { name: form.name, code: form.code || null, name_zh: form.name_zh || null }
    const options = {
      onSuccess: () => {
        toast.success(`${typeLabel(dialog.type)}已保存`)
        onClose()
      },
      onError: (error: Error) => toast.error(error.message || '保存失败'),
    }
    if (dialog.type === 'continent') {
      if (dialog.mode === 'create') createContinent.mutate(common, options)
      else updateContinent.mutate({ uuid: dialog.item.continent_uuid, data: common }, options)
      return
    }
    if (dialog.type === 'country') {
      const continentUuid = dialog.mode === 'create' ? dialog.parent.continent_uuid : form.continent_uuid
      const payload = { ...common, continent_uuid: continentUuid }
      if (dialog.mode === 'create') createCountry.mutate(payload, options)
      else updateCountry.mutate({ uuid: dialog.item.country_uuid, data: payload }, options)
      return
    }
    const countryUuid = dialog.mode === 'create' ? dialog.parent.country_uuid : form.country_uuid
    const payload = { ...common, country_uuid: countryUuid, is_capital: form.is_capital, popularity: Number(form.popularity) || 100 }
    if (dialog.mode === 'create') createCity.mutate(payload, options)
    else updateCity.mutate({ uuid: dialog.item.city_uuid, data: payload }, options)
  }

  return (
    <Dialog open={!!dialog} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>维护 GEO 树节点，保存后 Target 和 Agent 表单会立即使用最新检索数据。</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {dialog?.type === 'country' && dialog.mode === 'edit' && (
            <div>
              <Label className="mb-1.5 text-xs text-text-secondary">所属大洲</Label>
              <Select value={form.continent_uuid || undefined} onValueChange={(value) => setForm({ ...form, continent_uuid: value ?? '' })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(continentsQuery.data?.items ?? []).map((continent: GeoContinent) => (
                    <SelectItem key={continent.continent_uuid} value={continent.continent_uuid}>{continent.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {dialog?.type === 'city' && dialog.mode === 'edit' && (
            <div>
              <Label className="mb-1.5 text-xs text-text-secondary">所属国家</Label>
              <Select value={form.country_uuid || undefined} onValueChange={(value) => setForm({ ...form, country_uuid: value ?? '' })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(countriesQuery.data?.items ?? []).map((country: GeoCountry) => (
                    <SelectItem key={country.country_uuid} value={country.country_uuid}>{country.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <GeoText label="英文名" value={form.name} onChange={(name) => setForm({ ...form, name })} required />
            <GeoText label="代码" value={form.code} onChange={(code) => setForm({ ...form, code })} />
            <GeoText label="中文名" value={form.name_zh} onChange={(name_zh) => setForm({ ...form, name_zh })} />
            {dialog?.type === 'city' && (
              <GeoText label="排序权重" value={form.popularity} onChange={(popularity) => setForm({ ...form, popularity })} />
            )}
          </div>
          {dialog?.type === 'city' && (
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input type="checkbox" checked={form.is_capital} onChange={(event) => setForm({ ...form, is_capital: event.target.checked })} />
              首都 / 行政首府
            </label>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit">保存</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function GeoText({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <div>
      <Label className="mb-1.5 text-xs text-text-secondary">{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </div>
  )
}

function typeLabel(type: GeoDialogState['type']) {
  if (type === 'continent') return '大洲'
  if (type === 'country') return '国家'
  return '城市'
}
