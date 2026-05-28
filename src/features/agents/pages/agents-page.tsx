import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import {
  type AgentStatus,
  type AdminAgent,
  type IpVersion,
  useAgents,
  useCreateAgent,
  useDeleteAgent,
  useSetAgentEnabled,
  useUpdateAgent,
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
import { GeoInput } from '@/features/admin/geo-input'
import { TagInput } from '@/features/admin/tag-input'
import { csvToList, formatDateTime, joinLocation } from '@/features/admin/utils'
import { AGENT_STATUS_COLORS, ipVersionLabel } from '@/lib/constants'

const PAGE_SIZE = 100

function agentStatusLabel(value: AgentStatus | 'all' | null, allLabel: string) {
  if (value === 'online') return 'Online'
  if (value === 'offline') return 'Offline'
  if (value === 'disabled') return 'Disabled'
  return allLabel
}

export default function AgentsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<AgentStatus | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<AdminAgent | null>(null)
  const [createdAgent, setCreatedAgent] = useState<AdminAgent | null>(null)
  const [copiedToken, setCopiedToken] = useState(false)
  const [form, setForm] = useState({
    name: '',
    ip_version: '4+6' as IpVersion,
    continent: '',
    country: '',
    city: '',
    zip_code: 'UNKNOWN',
    carrier: '',
    tags: '',
    comment: '',
  })

  const agentsQuery = useAgents({
    page,
    page_size: PAGE_SIZE,
    keyword,
    status,
    sort_by: 'name',
    sort_order: 'asc',
  })
  const createAgent = useCreateAgent()
  const updateAgent = useUpdateAgent()
  const setAgentEnabled = useSetAgentEnabled()
  const deleteAgent = useDeleteAgent()

  const agents = agentsQuery.data?.items ?? []
  const pagination = agentsQuery.data?.pagination

  const resetForm = () => {
    setForm({
      name: '',
      ip_version: '4+6',
      continent: '',
      country: '',
      city: '',
      zip_code: 'UNKNOWN',
      carrier: '',
      tags: '',
      comment: '',
    })
  }

  const closeAgentDialog = () => {
    setCreateOpen(false)
    setEditingAgent(null)
    resetForm()
  }

  const openEditAgent = (agent: AdminAgent) => {
    setForm({
      name: agent.name,
      ip_version: agent.ip_version,
      continent: agent.continent,
      country: agent.country,
      city: agent.city,
      zip_code: agent.zip_code,
      carrier: agent.carrier,
      tags: agent.tags.join(', '),
      comment: agent.comment ?? '',
    })
    setEditingAgent(agent)
    setCreateOpen(true)
  }

  const agentPayload = () => ({
      name: form.name,
      ip_version: form.ip_version,
      continent: form.continent,
      country: form.country,
      city: form.city,
      zip_code: form.zip_code || 'UNKNOWN',
      carrier: form.carrier,
      tags: csvToList(form.tags),
      comment: form.comment || null,
    })

  const handleSubmitAgent = (event: React.FormEvent) => {
    event.preventDefault()
    if (editingAgent) {
      updateAgent.mutate({
        uuid: editingAgent.agent_uuid,
        data: agentPayload(),
      }, {
        onSuccess: () => {
          toast.success(t('agentAdmin.updatedToast'))
          closeAgentDialog()
        },
        onError: (error) => toast.error(error.message || t('agentAdmin.updateError')),
      })
      return
    }
    createAgent.mutate(agentPayload(), {
      onSuccess: (agent) => {
        toast.success(t('agentAdmin.createdToast'))
        setCreateOpen(false)
        setCreatedAgent(agent)
        resetForm()
      },
      onError: (error) => toast.error(error.message || t('agentAdmin.createError')),
    })
  }

  const copyToken = async () => {
    if (!createdAgent?.auth_token) return
    try {
      await navigator.clipboard.writeText(createdAgent.auth_token)
      setCopiedToken(true)
      setTimeout(() => setCopiedToken(false), 1800)
    } catch {
      toast.error(t('agentAdmin.copyFailed'))
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t('agentAdmin.title')}</h1>
          <p className="text-sm text-text-muted">{t('agentAdmin.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/agents/releases')}>{t('agentAdmin.artifact')}</Button>
          <Button onClick={() => {
            setEditingAgent(null)
            resetForm()
            setCreateOpen(true)
          }}>{t('agentAdmin.newAgent')}</Button>
        </div>
      </div>

      <div className="glass-light rounded-xl p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value)
              setPage(1)
            }}
            placeholder={t('agentAdmin.searchPlaceholder')}
            className="md:max-w-sm"
          />
          <Select value={status} onValueChange={(value) => {
            setStatus(value as AgentStatus | 'all')
            setPage(1)
          }}>
            <SelectTrigger aria-label={t('common.status')} className="w-full md:w-40">
              <SelectValue>
                {(value: AgentStatus | 'all' | null) => agentStatusLabel(value, t('agentAdmin.allStatuses'))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('agentAdmin.allStatuses')}</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void agentsQuery.refetch()}>{t('agentAdmin.refresh')}</Button>
        </div>

        {agentsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}
          </div>
        ) : agentsQuery.error ? (
          <div className="p-6 text-center text-sm text-red-400">{t('agentAdmin.listFailed')}</div>
        ) : agents.length === 0 ? (
          <div className="p-6 text-center text-sm text-text-muted">{t('agentAdmin.emptyList')}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('agentAdmin.location')}</TableHead>
                <TableHead>{t('agentAdmin.carrier')}</TableHead>
                <TableHead>{t('agentAdmin.versionPlatform')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('agentAdmin.heartbeat')}</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.agent_uuid} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-text-primary">
                    <button className="text-left hover:text-cyan-300" onClick={() => navigate(`/agents/${agent.agent_uuid}`)}>
                      {agent.name}
                    </button>
                    <div className="text-xs text-text-muted">{agent.agent_uuid}</div>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">{joinLocation(agent)}</TableCell>
                  <TableCell className="text-sm text-text-secondary">{agent.carrier}</TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    <div>{agent.version ?? '-'}</div>
                    <div className="text-xs text-text-muted">{agent.platform ?? '-'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`border ${AGENT_STATUS_COLORS[agent.status] ?? AGENT_STATUS_COLORS.offline}`}>
                      {agent.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">{formatDateTime(agent.last_heartbeat_at)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditAgent(agent)}>{t('common.edit')}</Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAgentEnabled.mutate(
                          { uuid: agent.agent_uuid, enabled: !agent.is_enabled },
                          { onError: (error) => toast.error(error.message || t('agentAdmin.statusUpdateFailed')) },
                        )}
                      >
                        {agent.is_enabled ? t('agentAdmin.stopped') : t('agentAdmin.enabled')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => deleteAgent.mutate(agent.agent_uuid, {
                          onSuccess: () => toast.success(t('agentAdmin.deletedToast')),
                          onError: (error) => toast.error(error.message || t('agentAdmin.deleteError')),
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
            <span>{t('agentAdmin.pagination', { page: pagination.page, totalPages: pagination.total_pages, total: pagination.total })}</span>
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>{t('common.previous')}</Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.total_pages} onClick={() => setPage((value) => value + 1)}>{t('common.next')}</Button>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={(open) => { if (open) setCreateOpen(true); else closeAgentDialog() }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAgent ? t('agentAdmin.editAgent') : t('agentAdmin.newAgent')}</DialogTitle>
            <DialogDescription>{editingAgent ? t('agentAdmin.editDialogDesc') : t('agentAdmin.createDialogDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAgent} className="mt-2 grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="mb-1.5 text-xs text-text-secondary">{t('common.name')}</Label>
                <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-text-secondary">{t('agentAdmin.ipSupport')}</Label>
                <Select value={form.ip_version} onValueChange={(value) => setForm({ ...form, ip_version: value as IpVersion })}>
                  <SelectTrigger aria-label={t('agentAdmin.ipSupport')} className="w-full">
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
            <GeoInput
              value={{ continent: form.continent, country: form.country, city: form.city }}
              onChange={(geo) => setForm({ ...form, ...geo })}
              required
            />

            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder={t('agentAdmin.zipPlaceholder')} value={form.zip_code} onChange={(event) => setForm({ ...form, zip_code: event.target.value })} required />
              <Input placeholder={t('agentAdmin.carrierPlaceholder')} value={form.carrier} onChange={(event) => setForm({ ...form, carrier: event.target.value })} required />
            </div>
            <TagInput label={t('agentAdmin.tags')} resourceType="agent" value={form.tags} onChange={(tags) => setForm({ ...form, tags })} />
            <Textarea placeholder={t('agentAdmin.commentPlaceholder')} value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeAgentDialog}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={createAgent.isPending || updateAgent.isPending}>
                {createAgent.isPending || updateAgent.isPending ? t('agentAdmin.savingShort') : (editingAgent ? t('common.save') : t('common.create'))}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!createdAgent} onOpenChange={(open) => { if (!open) setCreatedAgent(null) }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('agentAdmin.createdDialogTitle')}</DialogTitle>
            <DialogDescription>{t('agentAdmin.createdDialogDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-text-secondary">{createdAgent?.name}</div>
            <code className="block rounded-lg border border-border bg-muted/40 p-3 text-sm text-emerald-300 break-all">
              {createdAgent?.auth_token ?? '-'}
            </code>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={copyToken}>{copiedToken ? t('agentAdmin.copied') : t('agentAdmin.copyToken')}</Button>
            <Button onClick={() => setCreatedAgent(null)}>{t('common.done')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
