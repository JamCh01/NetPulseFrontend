import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  type AdminRouteTraceTarget,
  type IpVersion,
  type TargetType,
  useCreateRouteTraceTarget,
  useDeleteRouteTraceTarget,
  useRouteTraceTargets,
  useSetRouteTraceTargetEnabled,
  useUpdateRouteTraceTarget,
} from '@/api/hooks/admin-api'
import { Badge } from '@/components/ui/badge'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { TagInput } from '@/features/admin/tag-input'
import { csvToList, formatDateTime } from '@/features/admin/utils'
import { ipVersionLabel } from '@/lib/constants'

const PAGE_SIZE = 100

function initialForm() {
  return {
    name: '',
    host: '',
    ip_version: '4+6' as IpVersion,
    description: '',
    tags: '',
  }
}

export default function RouteTraceTargetsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [targetType, setTargetType] = useState<TargetType | 'all'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTarget, setEditingTarget] = useState<AdminRouteTraceTarget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminRouteTraceTarget | null>(null)
  const [form, setForm] = useState(initialForm)

  const targetsQuery = useRouteTraceTargets({
    page,
    page_size: PAGE_SIZE,
    keyword,
    target_type: targetType,
    sort_by: 'name',
    sort_order: 'asc',
  })
  const createTarget = useCreateRouteTraceTarget()
  const updateTarget = useUpdateRouteTraceTarget()
  const setTargetEnabled = useSetRouteTraceTargetEnabled()
  const removeTarget = useDeleteRouteTraceTarget()

  const targets = targetsQuery.data?.items ?? []
  const pagination = targetsQuery.data?.pagination
  const targetTypeLabel = (type: TargetType) => t(type === 'domain' ? 'routeTraceTargets.typeDomain' : 'routeTraceTargets.typeIp')

  const resetForm = () => setForm(initialForm())

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingTarget(null)
    resetForm()
  }

  const openCreateDialog = () => {
    setEditingTarget(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (target: AdminRouteTraceTarget) => {
    setEditingTarget(target)
    setForm({
      name: target.name,
      host: target.host,
      ip_version: target.ip_version,
      description: target.description ?? '',
      tags: target.tags.join(', '),
    })
    setDialogOpen(true)
  }

  const payload = () => ({
    name: form.name,
    host: form.host,
    ip_version: form.ip_version,
    description: form.description || null,
    tags: csvToList(form.tags),
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (editingTarget) {
      updateTarget.mutate({
        uuid: editingTarget.route_trace_target_uuid,
        data: payload(),
      }, {
        onSuccess: () => {
          toast.success(t('routeTraceTargets.updatedToast'))
          closeDialog()
        },
        onError: (error) => toast.error(error.message || t('routeTraceTargets.updateError')),
      })
      return
    }
    createTarget.mutate(payload(), {
      onSuccess: () => {
        toast.success(t('routeTraceTargets.createdToast'))
        closeDialog()
      },
      onError: (error) => toast.error(error.message || t('routeTraceTargets.createError')),
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t('routeTraceTargets.managementTitle')}</h1>
          <p className="text-sm text-text-muted">{t('routeTraceTargets.managementDesc')}</p>
        </div>
        <Button onClick={openCreateDialog}>{t('routeTraceTargets.newTarget')}</Button>
      </div>

      <div className="glass-light rounded-xl p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value)
              setPage(1)
            }}
            placeholder={t('routeTraceTargets.searchPlaceholder')}
            className="md:max-w-sm"
          />
          <Select value={targetType} onValueChange={(value) => {
            setTargetType(value as TargetType | 'all')
            setPage(1)
          }}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue>
                {(value: TargetType | 'all' | null) => value && value !== 'all' ? targetTypeLabel(value) : t('routeTraceTargets.allTypes')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('routeTraceTargets.allTypes')}</SelectItem>
              <SelectItem value="ip">{t('routeTraceTargets.typeIp')}</SelectItem>
              <SelectItem value="domain">{t('routeTraceTargets.typeDomain')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void targetsQuery.refetch()}>{t('routeTraceTargets.refresh')}</Button>
        </div>

        {targetsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}
          </div>
        ) : targetsQuery.error ? (
          <div className="p-6 text-center text-sm text-red-400">{t('routeTraceTargets.listFailed')}</div>
        ) : targets.length === 0 ? (
          <div className="p-6 text-center text-sm text-text-muted">{t('routeTraceTargets.emptyList')}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('routeTraceTargets.host')}</TableHead>
                <TableHead>{t('routeTraceTargets.type')}</TableHead>
                <TableHead>{t('routeTraceTargets.tags')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('routeTraceTargets.updatedAt')}</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {targets.map((target) => (
                <TableRow key={target.route_trace_target_uuid} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-text-primary">
                    <div>{target.name}</div>
                    <div className="text-xs text-text-muted">{target.route_trace_target_uuid}</div>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    <div className="font-[family-name:var(--font-mono)]">{target.host}</div>
                    <div className="text-xs text-text-muted">{ipVersionLabel(target.ip_version)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{targetTypeLabel(target.target_type)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {target.tags.length > 0 ? target.tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      )) : <span className="text-sm text-text-muted">-</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={target.is_enabled ? 'success' : 'inactive'}>
                      {target.is_enabled ? t('routeTraceTargets.enabled') : t('routeTraceTargets.stopped')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">{formatDateTime(target.updated_at)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(target)}>{t('common.edit')}</Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTargetEnabled.mutate(
                          { uuid: target.route_trace_target_uuid, enabled: !target.is_enabled },
                          { onError: (error) => toast.error(error.message || t('routeTraceTargets.statusUpdateFailed')) },
                        )}
                      >
                        {target.is_enabled ? t('routeTraceTargets.stopped') : t('routeTraceTargets.enabled')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => setDeleteTarget(target)}
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {pagination && pagination.total_pages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-2 text-sm text-text-muted">
            <span>{t('routeTraceTargets.pagination', { page: pagination.page, totalPages: pagination.total_pages, total: pagination.total })}</span>
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>{t('common.previous')}</Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.total_pages} onClick={() => setPage((value) => value + 1)}>{t('common.next')}</Button>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (open) setDialogOpen(true); else closeDialog() }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTarget ? t('routeTraceTargets.editTarget') : t('routeTraceTargets.newTarget')}</DialogTitle>
            <DialogDescription>{t('routeTraceTargets.dialogDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="mt-2 grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="mb-1.5 text-xs text-text-secondary">{t('common.name')}</Label>
                <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-text-secondary">{t('routeTraceTargets.host')}</Label>
                <Input value={form.host} onChange={(event) => setForm({ ...form, host: event.target.value })} required />
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-text-secondary">{t('routeTraceTargets.ipVersion')}</Label>
                <Select value={form.ip_version} onValueChange={(value) => setForm({ ...form, ip_version: value as IpVersion })}>
                  <SelectTrigger aria-label={t('routeTraceTargets.ipVersion')} className="w-full">
                    <SelectValue>
                      {(value: IpVersion | null) => ipVersionLabel(value)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">IPv4</SelectItem>
                    <SelectItem value="6">IPv6</SelectItem>
                    <SelectItem value="4+6">IPv4 + IPv6</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TagInput
              label={t('routeTraceTargets.tags')}
              resourceType="route_trace_target"
              value={form.tags}
              onChange={(tags) => setForm({ ...form, tags })}
            />

            <div>
              <Label htmlFor="route-trace-target-description" className="mb-1.5 text-xs text-text-secondary">{t('common.description')}</Label>
              <Textarea
                id="route-trace-target-description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder={t('routeTraceTargets.descriptionPlaceholder')}
                className="min-h-[120px]"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={createTarget.isPending || updateTarget.isPending}>
                {createTarget.isPending || updateTarget.isPending ? t('routeTraceTargets.savingShort') : (editingTarget ? t('common.save') : t('common.create'))}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('routeTraceTargets.deleteDialogTitle')}</DialogTitle>
            <DialogDescription>{t('routeTraceTargets.deleteDialogDesc', { name: deleteTarget?.name ?? '' })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
            <Button
              variant="destructive"
              disabled={removeTarget.isPending}
              onClick={() => {
                if (!deleteTarget) return
                removeTarget.mutate(deleteTarget.route_trace_target_uuid, {
                  onSuccess: () => {
                    toast.success(t('routeTraceTargets.deletedToast'))
                    setDeleteTarget(null)
                  },
                  onError: (error) => toast.error(error.message || t('routeTraceTargets.deleteError')),
                })
              }}
            >
              {removeTarget.isPending ? t('routeTraceTargets.deletingShort') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
