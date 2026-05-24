import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import {
  type AdminAgent,
  type AdminTarget,
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
import { Textarea } from '@/components/ui/textarea'
import { csvToList, formatDateTime, joinLocation } from '@/features/admin/utils'
import { PROTOCOL_COLORS } from '@/lib/constants'

const PAGE_SIZE = 100
const PROTOCOLS: TargetProtocol[] = ['icmp', 'tcp', 'mtr', 'iperf3']

export default function TargetsPage() {
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editingTarget, setEditingTarget] = useState<AdminTarget | null>(null)
  const [associateTarget, setAssociateTarget] = useState<AdminTarget | null>(null)
  const [selectedAgentUuid, setSelectedAgentUuid] = useState('')
  const [form, setForm] = useState({
    name: '',
    target: '',
    ip_version: '4+6' as IpVersion,
    is_anycast: false,
    continent: '',
    country: '',
    region: '',
    city: '',
    zip_code: 'UNKNOWN',
    carrier: '',
    tags: '',
    comment: '',
    supported_protocols: ['icmp', 'tcp', 'mtr'] as TargetProtocol[],
  })

  const targetsQuery = useTargets({ page, page_size: PAGE_SIZE, keyword, sort_by: 'name', sort_order: 'asc' })
  const agentsQuery = useAgents({ page_size: 200, sort_by: 'name', sort_order: 'asc', is_enabled: true })
  const createTarget = useCreateTarget()
  const updateTarget = useUpdateTarget()
  const setTargetEnabled = useSetTargetEnabled()
  const deleteTarget = useDeleteTarget()
  const quickAssociate = useQuickAssociate()

  const targets = targetsQuery.data?.items ?? []
  const agents = agentsQuery.data?.items ?? []
  const pagination = targetsQuery.data?.pagination

  const resetForm = () => {
    setForm({
      name: '',
      target: '',
      ip_version: '4+6',
      is_anycast: false,
      continent: '',
      country: '',
      region: '',
      city: '',
      zip_code: 'UNKNOWN',
      carrier: '',
      tags: '',
      comment: '',
      supported_protocols: ['icmp', 'tcp', 'mtr'],
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
      target: target.target,
      ip_version: target.ip_version,
      is_anycast: target.is_anycast,
      continent: target.continent ?? '',
      country: target.country ?? '',
      region: target.region ?? '',
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
    region: form.region || null,
    city: form.city || null,
    zip_code: form.zip_code || 'UNKNOWN',
    carrier: form.carrier,
    comment: form.comment || null,
    tags: csvToList(form.tags),
    supported_protocols: form.supported_protocols,
  })

  const handleSubmitTarget = (event: React.FormEvent) => {
    event.preventDefault()
    if (editingTarget) {
      updateTarget.mutate({
        uuid: editingTarget.target_uuid,
        data: targetPayload(),
      }, {
        onSuccess: () => {
          toast.success('Target 已更新')
          closeTargetDialog()
        },
        onError: (error) => toast.error(error.message || '更新 Target 失败'),
      })
      return
    }
    createTarget.mutate(targetPayload(), {
      onSuccess: () => {
        toast.success('Target 已创建')
        closeTargetDialog()
      },
      onError: (error) => toast.error(error.message || '创建 Target 失败'),
    })
  }

  const handleAssociate = () => {
    if (!associateTarget || !selectedAgentUuid) return
    quickAssociate.mutate({
      target_uuid: associateTarget.target_uuid,
      agent_uuid: selectedAgentUuid,
    }, {
      onSuccess: (tasks) => {
        toast.success(`已快速关联，创建或复用 ${tasks.length} 个任务`)
        setAssociateTarget(null)
        setSelectedAgentUuid('')
      },
      onError: (error) => toast.error(error.message || '快速关联失败'),
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Target 管理</h1>
          <p className="text-sm text-text-muted">通过 /api/v1/targets/* 维护监控目标，并可快速关联 Agent。</p>
        </div>
        <Button onClick={() => {
          setEditingTarget(null)
          resetForm()
          setCreateOpen(true)
        }}>新增 Target</Button>
      </div>

      <div className="glass-light rounded-xl p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value)
              setPage(1)
            }}
            placeholder="按名称、地址或运营商搜索"
            className="md:max-w-sm"
          />
          <Button variant="outline" onClick={() => void targetsQuery.refetch()}>刷新</Button>
        </div>

        {targetsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}
          </div>
        ) : targetsQuery.error ? (
          <div className="p-6 text-center text-sm text-red-400">Target 列表加载失败</div>
        ) : targets.length === 0 ? (
          <div className="p-6 text-center text-sm text-text-muted">暂无 Target</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead>名称</TableHead>
                <TableHead>目标地址</TableHead>
                <TableHead>位置</TableHead>
                <TableHead>协议</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {targets.map((target) => (
                <TableRow key={target.target_uuid} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-text-primary">
                    <div>{target.name}</div>
                    <div className="text-xs text-text-muted">{target.is_anycast ? 'AnyCast' : target.target_type}</div>
                  </TableCell>
                  <TableCell className="font-[family-name:var(--font-mono)] text-sm text-text-secondary">{target.target}</TableCell>
                  <TableCell className="text-sm text-text-secondary">{joinLocation(target)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {target.supported_protocols.map((protocol) => (
                        <Badge key={protocol} className={`border uppercase ${PROTOCOL_COLORS[protocol] ?? ''}`}>{protocol}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={target.is_enabled ? 'success' : 'inactive'}>
                      {target.is_enabled ? '启用' : '停用'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">{formatDateTime(target.updated_at)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditTarget(target)}>编辑</Button>
                      <Button variant="ghost" size="sm" onClick={() => setAssociateTarget(target)}>关联 Agent</Button>
                      <Link to={`/app/monitoring?target_uuid=${target.target_uuid}`}>
                        <Button variant="ghost" size="sm">查看数据</Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTargetEnabled.mutate(
                          { uuid: target.target_uuid, enabled: !target.is_enabled },
                          { onError: (error) => toast.error(error.message || '状态更新失败') },
                        )}
                      >
                        {target.is_enabled ? '停用' : '启用'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => deleteTarget.mutate(target.target_uuid, {
                          onSuccess: () => toast.success('Target 已删除'),
                          onError: (error) => toast.error(error.message || '删除失败'),
                        })}
                      >
                        删除
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
            <span>第 {pagination.page} / {pagination.total_pages} 页，共 {pagination.total} 条</span>
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>上一页</Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.total_pages} onClick={() => setPage((value) => value + 1)}>下一页</Button>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={(open) => { if (open) setCreateOpen(true); else closeTargetDialog() }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTarget ? '编辑 Target' : '新增 Target'}</DialogTitle>
            <DialogDescription>Target 是监控任务绑定的目标地址，修改后后端会同步受影响的 Agent 任务快照。</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitTarget} className="mt-2 grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="mb-1.5 text-xs text-text-secondary">名称</Label>
                <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-text-secondary">目标地址</Label>
                <Input value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} required />
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-text-secondary">IP 版本</Label>
                <Select value={form.ip_version} onValueChange={(value) => setForm({ ...form, ip_version: value as IpVersion })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">IPv4</SelectItem>
                    <SelectItem value="6">IPv6</SelectItem>
                    <SelectItem value="4+6">IPv4 + IPv6</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-text-secondary">运营商 / 云厂商</Label>
                <Input value={form.carrier} onChange={(event) => setForm({ ...form, carrier: event.target.value })} required />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <Input placeholder="大洲" value={form.continent} onChange={(event) => setForm({ ...form, continent: event.target.value })} />
              <Input placeholder="国家" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
              <Input placeholder="区域" value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} />
              <Input placeholder="城市" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
            </div>

            <div>
              <Label className="mb-1.5 text-xs text-text-secondary">支持协议</Label>
              <div className="flex flex-wrap gap-2">
                {PROTOCOLS.map((protocol) => (
                  <Button
                    key={protocol}
                    type="button"
                    variant={form.supported_protocols.includes(protocol) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleProtocol(protocol)}
                  >
                    {protocol.toUpperCase()}
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
              <Label htmlFor="target-anycast" className="text-sm text-text-secondary">标记为 AnyCast</Label>
            </div>

            <Input placeholder="标签，使用英文逗号分隔" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} />
            <Textarea placeholder="备注" value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeTargetDialog}>取消</Button>
              <Button type="submit" disabled={createTarget.isPending || updateTarget.isPending}>
                {createTarget.isPending || updateTarget.isPending ? '保存中' : (editingTarget ? '保存' : '创建')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!associateTarget} onOpenChange={(open) => { if (!open) setAssociateTarget(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>快速关联 Target 和 Agent</DialogTitle>
            <DialogDescription>调用 /api/v1/relations/quick-associate，由后端创建该 Target 与 Agent 之间需要的监控任务。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-text-secondary">
              <div className="font-medium text-text-primary">{associateTarget?.name}</div>
              <div>{associateTarget?.target}</div>
            </div>
            <Select value={selectedAgentUuid} onValueChange={(value) => setSelectedAgentUuid(value ?? '')}>
              <SelectTrigger className="w-full"><SelectValue placeholder="选择 Agent" /></SelectTrigger>
              <SelectContent>
                {agents.map((agent: AdminAgent) => (
                  <SelectItem key={agent.agent_uuid} value={agent.agent_uuid}>
                    {agent.name} - {agent.city || agent.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssociateTarget(null)}>取消</Button>
            <Button disabled={!selectedAgentUuid || quickAssociate.isPending} onClick={handleAssociate}>
              {quickAssociate.isPending ? '关联中' : '快速关联'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
