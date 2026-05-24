import { useState } from 'react'
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
import { AGENT_STATUS_COLORS } from '@/lib/constants'

const PAGE_SIZE = 100

export default function AgentsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<AgentStatus | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [createdAgent, setCreatedAgent] = useState<AdminAgent | null>(null)
  const [copiedToken, setCopiedToken] = useState(false)
  const [form, setForm] = useState({
    name: '',
    ip_version: '4+6' as IpVersion,
    continent: '',
    country: '',
    region: '',
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
      region: '',
      city: '',
      zip_code: 'UNKNOWN',
      carrier: '',
      tags: '',
      comment: '',
    })
  }

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault()
    createAgent.mutate({
      name: form.name,
      ip_version: form.ip_version,
      continent: form.continent,
      country: form.country,
      region: form.region || form.city || form.country,
      city: form.city,
      zip_code: form.zip_code || 'UNKNOWN',
      carrier: form.carrier,
      tags: csvToList(form.tags),
      comment: form.comment || null,
    }, {
      onSuccess: (agent) => {
        toast.success('Agent 已创建')
        setCreateOpen(false)
        setCreatedAgent(agent)
        resetForm()
      },
      onError: (error) => toast.error(error.message || '创建 Agent 失败'),
    })
  }

  const copyToken = async () => {
    if (!createdAgent?.auth_token) return
    try {
      await navigator.clipboard.writeText(createdAgent.auth_token)
      setCopiedToken(true)
      setTimeout(() => setCopiedToken(false), 1800)
    } catch {
      toast.error('复制失败')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Agent 管理</h1>
          <p className="text-sm text-text-muted">通过 /api/v1/agents/* 管理探针、状态和配置同步信息。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/agents/releases')}>版本发布</Button>
          <Button onClick={() => setCreateOpen(true)}>新增 Agent</Button>
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
            placeholder="按名称、城市、运营商搜索"
            className="md:max-w-sm"
          />
          <Select value={status} onValueChange={(value) => {
            setStatus(value as AgentStatus | 'all')
            setPage(1)
          }}>
            <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void agentsQuery.refetch()}>刷新</Button>
        </div>

        {agentsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}
          </div>
        ) : agentsQuery.error ? (
          <div className="p-6 text-center text-sm text-red-400">Agent 列表加载失败</div>
        ) : agents.length === 0 ? (
          <div className="p-6 text-center text-sm text-text-muted">暂无 Agent</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead>名称</TableHead>
                <TableHead>位置</TableHead>
                <TableHead>运营商</TableHead>
                <TableHead>版本 / 平台</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>心跳</TableHead>
                <TableHead>操作</TableHead>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAgentEnabled.mutate(
                          { uuid: agent.agent_uuid, enabled: !agent.is_enabled },
                          { onError: (error) => toast.error(error.message || '状态更新失败') },
                        )}
                      >
                        {agent.is_enabled ? '停用' : '启用'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => deleteAgent.mutate(agent.agent_uuid, {
                          onSuccess: () => toast.success('Agent 已删除'),
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>新增 Agent</DialogTitle>
            <DialogDescription>创建后会返回一次性 auth_token，请立即保存到 Agent 配置中。</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="mt-2 grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="mb-1.5 text-xs text-text-secondary">名称</Label>
                <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-text-secondary">IP 支持</Label>
                <Select value={form.ip_version} onValueChange={(value) => setForm({ ...form, ip_version: value as IpVersion })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">IPv4</SelectItem>
                    <SelectItem value="6">IPv6</SelectItem>
                    <SelectItem value="4+6">IPv4 + IPv6</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <Input placeholder="大洲" value={form.continent} onChange={(event) => setForm({ ...form, continent: event.target.value })} required />
              <Input placeholder="国家" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} required />
              <Input placeholder="区域" value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} required />
              <Input placeholder="城市" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} required />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="邮编，未知填 UNKNOWN" value={form.zip_code} onChange={(event) => setForm({ ...form, zip_code: event.target.value })} required />
              <Input placeholder="运营商 / 机房 / 云厂商" value={form.carrier} onChange={(event) => setForm({ ...form, carrier: event.target.value })} required />
            </div>
            <Input placeholder="标签，使用英文逗号分隔" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} />
            <Textarea placeholder="备注" value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
              <Button type="submit" disabled={createAgent.isPending}>{createAgent.isPending ? '创建中' : '创建'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!createdAgent} onOpenChange={(open) => { if (!open) setCreatedAgent(null) }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Agent 已创建</DialogTitle>
            <DialogDescription>auth_token 只在创建响应中返回一次。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-text-secondary">{createdAgent?.name}</div>
            <code className="block rounded-lg border border-border bg-muted/40 p-3 text-sm text-emerald-300 break-all">
              {createdAgent?.auth_token ?? '-'}
            </code>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={copyToken}>{copiedToken ? '已复制' : '复制 Token'}</Button>
            <Button onClick={() => setCreatedAgent(null)}>完成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
