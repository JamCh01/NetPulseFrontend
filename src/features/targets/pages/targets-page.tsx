import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { toast } from 'sonner'

import {
  type AdminAgent,
  type AdminTarget,
  type IpFamily,
  type IpVersion,
  type TargetProtocol,
  useAgents,
  useCreateTarget,
  useDeleteTarget,
  useQuickAssociate,
  useSetTargetEnabled,
  useTargets,
  useUpdateTarget,
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
import { MarkdownPreview } from '@/components/ui/markdown-preview'
import { Textarea } from '@/components/ui/textarea'
import { GeoInput } from '@/features/admin/geo-input'
import { QuickAssociateFields } from '@/features/admin/quick-associate-fields'
import {
  clampQuickAssociateIpFamilies,
  clampQuickAssociateTaskTypes,
  compatibleQuickAssociateIpFamilies,
  quickAssociateTaskTypeOptions,
  toggleQuickAssociateIpFamily,
  toggleQuickAssociateTaskType,
  type QuickAssociateTaskType,
} from '@/features/admin/quick-associate-options'
import { TagInput } from '@/features/admin/tag-input'
import { csvToList, formatDateTime, joinLocation } from '@/features/admin/utils'
import { PROTOCOL_COLORS, ipVersionLabel, protocolLabel } from '@/lib/constants'

const PAGE_SIZE = 100
const PROTOCOLS: TargetProtocol[] = ['icmp', 'tcp', 'mtr', 'iperf3', 'route_trace']
const REDACTED_TARGET = '[Target]'

export default function TargetsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editingTarget, setEditingTarget] = useState<AdminTarget | null>(null)
  const [associateTarget, setAssociateTarget] = useState<AdminTarget | null>(null)
  const [selectedAgentUuid, setSelectedAgentUuid] = useState('')
  const [selectedQuickTaskTypes, setSelectedQuickTaskTypes] = useState<QuickAssociateTaskType[]>(['icmp'])
  const [selectedQuickIpFamilies, setSelectedQuickIpFamilies] = useState<IpFamily[]>([])
  const [form, setForm] = useState({
    name: '',
    target: '',
    ip_version: '4+6' as IpVersion,
    is_anycast: false,
    continent: '',
    country: '',
    city: '',
    zip_code: 'UNKNOWN',
    carrier: '',
    tags: '',
    comment: '',
    supported_protocols: [...PROTOCOLS],
  })

  const targetsQuery = useTargets({ page, page_size: PAGE_SIZE, keyword, sort_by: 'name', sort_order: 'asc' })
  const agentsQuery = useAgents({ page_size: 100, sort_by: 'name', sort_order: 'asc', is_enabled: true })
  const createTarget = useCreateTarget()
  const updateTarget = useUpdateTarget()
  const setTargetEnabled = useSetTargetEnabled()
  const deleteTarget = useDeleteTarget()
  const quickAssociate = useQuickAssociate()

  const targets = targetsQuery.data?.items ?? []
  const agents = agentsQuery.data?.items ?? []
  const pagination = targetsQuery.data?.pagination
  const selectedAgent = agents.find((agent) => agent.agent_uuid === selectedAgentUuid) ?? null
  const quickTaskTypeOptions = useMemo(
    () => quickAssociateTaskTypeOptions(associateTarget),
    [associateTarget],
  )
  const quickIpFamilyOptions = useMemo(
    () => compatibleQuickAssociateIpFamilies(associateTarget, selectedAgent),
    [associateTarget, selectedAgent],
  )

  const clampedQuickTaskTypes = useMemo(
    () => clampQuickAssociateTaskTypes(selectedQuickTaskTypes, quickTaskTypeOptions),
    [quickTaskTypeOptions, selectedQuickTaskTypes],
  )
  const clampedQuickIpFamilies = useMemo(
    () => clampQuickAssociateIpFamilies(selectedQuickIpFamilies, quickIpFamilyOptions),
    [quickIpFamilyOptions, selectedQuickIpFamilies],
  )

  const resetForm = () => {
    setForm({
      name: '',
      target: '',
      ip_version: '4+6',
      is_anycast: false,
      continent: '',
      country: '',
      city: '',
      zip_code: 'UNKNOWN',
      carrier: '',
      tags: '',
      comment: '',
      supported_protocols: [...PROTOCOLS],
    })
  }

  const closeTargetDialog = () => {
    setCreateOpen(false)
    setEditingTarget(null)
    resetForm()
  }

  const openEditTarget = (target: AdminTarget) => {
    setForm({
      name: target.name,
      target: target.target === REDACTED_TARGET ? '' : target.target,
      ip_version: target.ip_version,
      is_anycast: target.is_anycast,
      continent: target.continent ?? '',
      country: target.country ?? '',
      city: target.city ?? '',
      zip_code: target.zip_code ?? 'UNKNOWN',
      carrier: target.carrier,
      tags: target.tags.join(', '),
      comment: target.comment ?? '',
      supported_protocols: target.supported_protocols,
    })
    setEditingTarget(target)
    setCreateOpen(true)
  }

  const toggleProtocol = (protocol: TargetProtocol) => {
    setForm((prev) => ({
      ...prev,
      supported_protocols: prev.supported_protocols.includes(protocol)
        ? prev.supported_protocols.filter((item) => item !== protocol)
        : [...prev.supported_protocols, protocol],
    }))
  }

  const targetPayload = () => ({
    name: form.name,
    target: form.target,
    ip_version: form.ip_version,
    is_anycast: form.is_anycast,
    continent: form.continent || null,
    country: form.country || null,
    city: form.city || null,
    zip_code: form.zip_code || 'UNKNOWN',
    carrier: form.carrier,
    comment: form.comment || null,
    tags: csvToList(form.tags),
    supported_protocols: form.supported_protocols,
  })

  const updateTargetPayload = () => {
    const payload = targetPayload() as Partial<ReturnType<typeof targetPayload>>
    if (!form.target.trim()) {
      delete payload.target
    }
    return payload
  }

  const handleSubmitTarget = (event: React.FormEvent) => {
    event.preventDefault()
    if (editingTarget) {
      updateTarget.mutate({
        uuid: editingTarget.target_uuid,
        data: updateTargetPayload(),
      }, {
        onSuccess: () => {
          toast.success(t('targets.updatedToast'))
          closeTargetDialog()
        },
        onError: (error) => toast.error(error.message || t('targets.updateError')),
      })
      return
    }
    createTarget.mutate(targetPayload(), {
      onSuccess: () => {
        toast.success(t('targets.createdToast'))
        closeTargetDialog()
      },
      onError: (error) => toast.error(error.message || t('targets.createError')),
    })
  }

  const handleAssociate = () => {
    if (!associateTarget || !selectedAgentUuid || clampedQuickTaskTypes.length === 0 || clampedQuickIpFamilies.length === 0) return
    quickAssociate.mutate({
      target_uuid: associateTarget.target_uuid,
      agent_uuid: selectedAgentUuid,
      task_types: clampedQuickTaskTypes,
      ip_families: clampedQuickIpFamilies,
    }, {
      onSuccess: (tasks) => {
        toast.success(t('targets.quickAssociateSuccess', { count: tasks.length }))
        setAssociateTarget(null)
        setSelectedAgentUuid('')
        setSelectedQuickTaskTypes(['icmp'])
        setSelectedQuickIpFamilies([])
      },
      onError: (error) => toast.error(error.message || t('targets.quickAssociateError')),
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t('targets.managementTitle')}</h1>
          <p className="text-sm text-text-muted">{t('targets.managementDesc')}</p>
        </div>
        <Button onClick={() => {
          setEditingTarget(null)
          resetForm()
          setCreateOpen(true)
        }}>{t('targets.newTarget')}</Button>
      </div>

      <div className="glass-light rounded-xl p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value)
              setPage(1)
            }}
            placeholder={t('targets.searchPlaceholder')}
            className="md:max-w-sm"
          />
          <Button variant="outline" onClick={() => void targetsQuery.refetch()}>{t('targets.refresh')}</Button>
        </div>

        {targetsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}
          </div>
        ) : targetsQuery.error ? (
          <div className="p-6 text-center text-sm text-red-400">{t('targets.listFailed')}</div>
        ) : targets.length === 0 ? (
          <div className="p-6 text-center text-sm text-text-muted">{t('targets.emptyList')}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('targets.targetAddress')}</TableHead>
                <TableHead>{t('targets.location')}</TableHead>
                <TableHead>{t('targets.protocols')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('targets.updatedAt')}</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {targets.map((target) => (
                <TableRow key={target.target_uuid} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-text-primary">
                    <div>{target.name}</div>
                    <div className="text-xs text-text-muted">{target.is_anycast ? 'AnyCast' : target.target_type}</div>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">{target.target_type.toUpperCase()} · {target.ip_version}</TableCell>
                  <TableCell className="text-sm text-text-secondary">{joinLocation(target)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {target.supported_protocols.map((protocol) => (
                        <Badge key={protocol} className={`border ${PROTOCOL_COLORS[protocol] ?? ''}`}>{protocolLabel(protocol)}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={target.is_enabled ? 'success' : 'inactive'}>
                      {target.is_enabled ? t('targets.enabled') : t('targets.stopped')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">{formatDateTime(target.updated_at)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditTarget(target)}>{t('common.edit')}</Button>
                      <Button variant="ghost" size="sm" onClick={() => setAssociateTarget(target)}>{t('targets.associateAgent')}</Button>
                      <Link to={`/app/monitoring?target_uuid=${target.target_uuid}`}>
                        <Button variant="ghost" size="sm">{t('targets.viewData')}</Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTargetEnabled.mutate(
                          { uuid: target.target_uuid, enabled: !target.is_enabled },
                          { onError: (error) => toast.error(error.message || t('targets.statusUpdateFailed')) },
                        )}
                      >
                        {target.is_enabled ? t('targets.stopped') : t('targets.enabled')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => deleteTarget.mutate(target.target_uuid, {
                          onSuccess: () => toast.success(t('targets.deletedToast')),
                          onError: (error) => toast.error(error.message || t('targets.deleteError')),
                        })}
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
            <span>{t('targets.pagination', { page: pagination.page, totalPages: pagination.total_pages, total: pagination.total })}</span>
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>{t('common.previous')}</Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.total_pages} onClick={() => setPage((value) => value + 1)}>{t('common.next')}</Button>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={(open) => { if (open) setCreateOpen(true); else closeTargetDialog() }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTarget ? t('targets.editTarget') : t('targets.newTarget')}</DialogTitle>
            <DialogDescription>{t('targets.dialogDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitTarget} className="mt-2 grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="mb-1.5 text-xs text-text-secondary">{t('common.name')}</Label>
                <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-text-secondary">{t('targets.targetAddress')}</Label>
                <Input
                  value={form.target}
                  onChange={(event) => setForm({ ...form, target: event.target.value })}
                  placeholder={editingTarget ? t('targets.keepExistingAddress') : undefined}
                  required={!editingTarget}
                />
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-text-secondary">{t('targets.ipVersion')}</Label>
                <Select value={form.ip_version} onValueChange={(value) => setForm({ ...form, ip_version: value as IpVersion })}>
                  <SelectTrigger aria-label={t('targets.ipVersion')} className="w-full">
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
              <div>
                <Label className="mb-1.5 text-xs text-text-secondary">{t('targets.carrier')}</Label>
                <Input value={form.carrier} onChange={(event) => setForm({ ...form, carrier: event.target.value })} required />
              </div>
            </div>

            <GeoInput
              value={{ continent: form.continent, country: form.country, city: form.city }}
              onChange={(geo) => setForm({ ...form, ...geo })}
            />

            <div>
              <Label className="mb-1.5 text-xs text-text-secondary">{t('targets.supportedProtocols')}</Label>
              <div className="flex flex-wrap gap-2">
                {PROTOCOLS.map((protocol) => (
                  <Button
                    key={protocol}
                    type="button"
                    variant={form.supported_protocols.includes(protocol) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleProtocol(protocol)}
                  >
                    {protocolLabel(protocol)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="target-anycast"
                type="checkbox"
                checked={form.is_anycast}
                onChange={(event) => setForm({ ...form, is_anycast: event.target.checked })}
              />
              <Label htmlFor="target-anycast" className="text-sm text-text-secondary">{t('targets.markAnycast')}</Label>
            </div>

            <TagInput label={t('targets.tags')} resourceType="target" value={form.tags} onChange={(tags) => setForm({ ...form, tags })} />
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="target-comment" className="mb-1.5 text-xs text-text-secondary">{t('common.comment')}</Label>
                <Textarea
                  id="target-comment"
                  aria-label={t('common.comment')}
                  placeholder={t('targets.commentPlaceholder')}
                  value={form.comment}
                  onChange={(event) => setForm({ ...form, comment: event.target.value })}
                  className="min-h-[160px]"
                />
              </div>
              <div>
                <Label id="target-comment-preview-label" className="mb-1.5 text-xs text-text-secondary">Markdown 预览</Label>
                <section aria-labelledby="target-comment-preview-label" className="h-full">
                  <MarkdownPreview value={form.comment} className="h-full min-h-[160px]" />
                </section>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeTargetDialog}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={createTarget.isPending || updateTarget.isPending}>
                {createTarget.isPending || updateTarget.isPending ? t('targets.savingShort') : (editingTarget ? t('common.save') : t('common.create'))}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!associateTarget} onOpenChange={(open) => {
        if (!open) {
          setAssociateTarget(null)
          setSelectedAgentUuid('')
          setSelectedQuickTaskTypes(['icmp'])
          setSelectedQuickIpFamilies([])
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('targets.quickAssociateTitle')}</DialogTitle>
            <DialogDescription>{t('targets.quickAssociateDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-text-secondary">
              <div className="font-medium text-text-primary">{associateTarget?.name}</div>
              <div>{associateTarget?.target}</div>
            </div>
            <Select value={selectedAgentUuid} onValueChange={(value) => setSelectedAgentUuid(value ?? '')}>
              <SelectTrigger aria-label="Agent" className="w-full">
                <SelectValue>
                  {() => selectedAgent ? `${selectedAgent.name} - ${selectedAgent.city || selectedAgent.country}` : t('targets.selectAgent')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent: AdminAgent) => (
                  <SelectItem key={agent.agent_uuid} value={agent.agent_uuid}>
                    {agent.name} - {agent.city || agent.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <QuickAssociateFields
              taskTypesLabel={t('targets.quickTaskTypes')}
              taskTypesDescription={t('targets.quickTaskTypesDesc')}
              ipFamiliesLabel={t('targets.quickIpFamilies')}
              ipFamiliesDescription={t('targets.quickIpFamiliesDesc')}
              emptyTaskTypesMessage={t('targets.quickNoTaskTypes')}
              emptyIpFamiliesMessage={t('targets.quickNoCompatibleIpFamilies')}
              taskTypeOptions={quickTaskTypeOptions}
              selectedTaskTypes={clampedQuickTaskTypes}
              onToggleTaskType={(taskType) => setSelectedQuickTaskTypes(toggleQuickAssociateTaskType(clampedQuickTaskTypes, taskType, quickTaskTypeOptions))}
              ipFamilyOptions={quickIpFamilyOptions}
              selectedIpFamilies={clampedQuickIpFamilies}
              onToggleIpFamily={(family) => setSelectedQuickIpFamilies(toggleQuickAssociateIpFamily(clampedQuickIpFamilies, family, quickIpFamilyOptions))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAssociateTarget(null)
              setSelectedAgentUuid('')
              setSelectedQuickTaskTypes(['icmp'])
              setSelectedQuickIpFamilies([])
            }}>{t('common.cancel')}</Button>
            <Button disabled={!selectedAgentUuid || clampedQuickTaskTypes.length === 0 || clampedQuickIpFamilies.length === 0 || quickAssociate.isPending} onClick={handleAssociate}>
              {quickAssociate.isPending ? t('targets.associating') : t('targets.quickAssociate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
