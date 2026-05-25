import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import {
  type AdminTask,
  type IpFamily,
  type TaskType,
  useAgents,
  useCreateTask,
  useDeleteTask,
  useQuickAssociate,
  useSetTaskEnabled,
  useTargets,
  useTasks,
  useUpdateTask,
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
import { buildTaskPayload, formatDateTime, protocolOptionsForTarget } from '@/features/admin/utils'
import { PROTOCOL_COLORS, protocolLabel } from '@/lib/constants'

type Iperf3Mode = 'single_thread' | 'multi_thread'

interface TargetOptionSummary {
  name: string
  target: string
}

interface AgentOptionSummary {
  name: string
  city?: string | null
}

interface TaskFormState {
  name: string
  target_uuid: string
  agent_uuid: string
  task_type: TaskType
  ip_family: IpFamily
  interval: string
  timeout: string
  packet_count: string
  port: string
  iperf3_mode: Iperf3Mode
  iperf3_duration: string
}

function initialTaskForm(): TaskFormState {
  return {
    name: '',
    target_uuid: '',
    agent_uuid: '',
    task_type: 'icmp',
    ip_family: '4',
    interval: '60',
    timeout: '3000',
    packet_count: '4',
    port: '443',
    iperf3_mode: 'single_thread',
    iperf3_duration: '10',
  }
}

function FieldRow({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string
  description: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2 py-3 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] md:items-center">
      <div className="min-w-0">
        <Label htmlFor={htmlFor} className="text-sm font-medium text-text-primary">{label}</Label>
        <p className="mt-1 text-xs leading-relaxed text-text-muted">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function iperf3ModeLabel(mode: Iperf3Mode): string {
  return mode === 'multi_thread' ? '8 线程' : '单线程'
}

function ipFamilyLabel(value: IpFamily | null): string {
  if (value === '6') return 'IPv6'
  if (value === '4') return 'IPv4'
  return '选择 IP 协议族'
}

function targetOptionLabel(target: TargetOptionSummary | null | undefined, fallback?: string | null): string {
  if (!target) return fallback || '选择 Target'
  return `${target.name} - ${target.target}`
}

function agentOptionLabel(agent: AgentOptionSummary | null | undefined, fallback?: string | null): string {
  if (!agent) return fallback || '选择 Agent'
  return `${agent.name}${agent.city ? ` - ${agent.city}` : ''}`
}

export default function TasksPage() {
  const [keyword, setKeyword] = useState('')
  const [taskType, setTaskType] = useState<TaskType | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [editTask, setEditTask] = useState<AdminTask | null>(null)
  const [editForm, setEditForm] = useState<TaskFormState>(() => initialTaskForm())
  const [deleteTaskUuid, setDeleteTaskUuid] = useState<string | null>(null)
  const [quickTargetUuid, setQuickTargetUuid] = useState('')
  const [quickAgentUuid, setQuickAgentUuid] = useState('')
  const [form, setForm] = useState<TaskFormState>(() => initialTaskForm())

  const tasksQuery = useTasks({ keyword, task_type: taskType, sort_by: 'name', sort_order: 'asc' })
  const targetsQuery = useTargets({ page_size: 200, sort_by: 'name', sort_order: 'asc', is_enabled: true })
  const agentsQuery = useAgents({ page_size: 200, sort_by: 'name', sort_order: 'asc', is_enabled: true })
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const setTaskEnabled = useSetTaskEnabled()
  const deleteTask = useDeleteTask()
  const quickAssociate = useQuickAssociate()

  const tasks = useMemo(() => tasksQuery.data?.items ?? [], [tasksQuery.data?.items])
  const targets = useMemo(() => targetsQuery.data?.items ?? [], [targetsQuery.data?.items])
  const agents = useMemo(() => agentsQuery.data?.items ?? [], [agentsQuery.data?.items])
  const selectedTarget = useMemo(
    () => targets.find((target) => target.target_uuid === form.target_uuid) ?? null,
    [form.target_uuid, targets],
  )
  const availableTaskTypes = protocolOptionsForTarget(selectedTarget)
  const selectedEditTarget = useMemo(
    () => targets.find((target) => target.target_uuid === editForm.target_uuid) ?? null,
    [editForm.target_uuid, targets],
  )
  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.agent_uuid === form.agent_uuid) ?? null,
    [form.agent_uuid, agents],
  )
  const selectedEditAgent = useMemo(
    () => agents.find((agent) => agent.agent_uuid === editForm.agent_uuid) ?? null,
    [editForm.agent_uuid, agents],
  )
  const selectedQuickTarget = useMemo(
    () => targets.find((target) => target.target_uuid === quickTargetUuid) ?? null,
    [quickTargetUuid, targets],
  )
  const selectedQuickAgent = useMemo(
    () => agents.find((agent) => agent.agent_uuid === quickAgentUuid) ?? null,
    [quickAgentUuid, agents],
  )

  const resetCreateForm = () => {
    setForm(initialTaskForm())
  }

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault()
    const payload = buildTaskPayload({
      name: form.name,
      target_uuid: form.target_uuid,
      agent_uuid: form.agent_uuid,
      task_type: form.task_type,
      ip_family: form.ip_family,
      interval: Number(form.interval),
      timeout: Number(form.timeout),
      packet_count: Number(form.packet_count),
      port: form.port ? Number(form.port) : undefined,
      iperf3Mode: form.iperf3_mode,
      iperf3Duration: form.iperf3_duration ? Number(form.iperf3_duration) : undefined,
    })
    createTask.mutate(payload, {
      onSuccess: () => {
        toast.success('Task 已创建')
        setCreateOpen(false)
        resetCreateForm()
      },
      onError: (error) => toast.error(error.message || '创建 Task 失败'),
    })
  }

  const openEditTask = (task: AdminTask) => {
    const probeConfig = task.probe_config ?? {}
    const mode = probeConfig.mode === 'multi_thread' ? 'multi_thread' : 'single_thread'
    const durationSec = typeof probeConfig.duration_sec === 'number' ? probeConfig.duration_sec : 10
    const port = typeof probeConfig.port === 'number' ? String(probeConfig.port) : ''
    setEditForm({
      name: task.name,
      target_uuid: task.target_uuid,
      agent_uuid: task.agent_uuid,
      ip_family: task.ip_family,
      interval: String(task.interval),
      timeout: String(task.timeout),
      packet_count: String(task.packet_count),
      port,
      iperf3_mode: mode,
      iperf3_duration: String(durationSec),
      task_type: task.task_type,
    })
    setEditTask(task)
  }

  const handleEdit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!editTask) return
    const nextPayload = buildTaskPayload({
      name: editForm.name,
      target_uuid: editForm.target_uuid,
      agent_uuid: editForm.agent_uuid,
      task_type: editTask.task_type,
      ip_family: editForm.ip_family,
      interval: Number(editForm.interval),
      timeout: Number(editForm.timeout),
      packet_count: Number(editForm.packet_count),
      port: editForm.port ? Number(editForm.port) : undefined,
      iperf3Mode: editForm.iperf3_mode,
      iperf3Duration: editForm.iperf3_duration ? Number(editForm.iperf3_duration) : undefined,
    })
    updateTask.mutate({
      uuid: editTask.task_uuid,
      data: {
        name: nextPayload.name,
        target_uuid: nextPayload.target_uuid,
        agent_uuid: nextPayload.agent_uuid,
        ip_family: nextPayload.ip_family,
        interval: nextPayload.interval,
        timeout: nextPayload.timeout,
        packet_count: nextPayload.packet_count,
        probe_config: nextPayload.probe_config,
        mtr_retry_config: nextPayload.mtr_retry_config,
        schedule_jitter_ms: nextPayload.schedule_jitter_ms,
      },
    }, {
      onSuccess: () => {
        toast.success('Task 已更新')
        setEditTask(null)
      },
      onError: (error) => toast.error(error.message || '更新失败'),
    })
  }

  const handleQuickAssociate = () => {
    if (!quickTargetUuid || !quickAgentUuid) return
    quickAssociate.mutate({
      target_uuid: quickTargetUuid,
      agent_uuid: quickAgentUuid,
    }, {
      onSuccess: (createdTasks) => {
        toast.success(`快速关联完成，创建或复用 ${createdTasks.length} 个任务`)
        setQuickOpen(false)
        setQuickTargetUuid('')
        setQuickAgentUuid('')
      },
      onError: (error) => toast.error(error.message || '快速关联失败'),
    })
  }

  const taskToDelete = deleteTaskUuid ? tasks.find((task) => task.task_uuid === deleteTaskUuid) : null

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Task 管理</h1>
          <p className="text-sm text-text-muted">通过 /api/v1/tasks/* 管理任务，使用 /api/v1/relations/quick-associate 批量建立 Target 与 Agent 关系。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setQuickOpen(true)}>快速关联</Button>
          <Button onClick={() => setCreateOpen(true)}>新增 Task</Button>
        </div>
      </div>

      <div className="glass-light rounded-xl p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="按名称、Target、Agent 搜索"
            className="md:max-w-sm"
          />
          <Select value={taskType} onValueChange={(value) => setTaskType(value as TaskType | 'all')}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue>
                {(value: TaskType | 'all' | null) => value && value !== 'all' ? protocolLabel(value) : '全部类型'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="icmp">{protocolLabel('icmp')}</SelectItem>
              <SelectItem value="tcp">{protocolLabel('tcp')}</SelectItem>
              <SelectItem value="mtr">{protocolLabel('mtr')}</SelectItem>
              <SelectItem value="iperf3">{protocolLabel('iperf3')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void tasksQuery.refetch()}>刷新</Button>
        </div>

        {tasksQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}
          </div>
        ) : tasksQuery.error ? (
          <div className="p-6 text-center text-sm text-red-400">Task 列表加载失败</div>
        ) : tasks.length === 0 ? (
          <div className="p-6 text-center text-sm text-text-muted">暂无 Task</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead>名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>配置</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.task_uuid} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-text-primary">
                    <div>{task.name}</div>
                    <div className="text-xs text-text-muted">{task.task_uuid}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`border ${PROTOCOL_COLORS[task.task_type] ?? ''}`}>{protocolLabel(task.task_type)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    <div>{task.target?.name ?? task.target_uuid}</div>
                    <div className="font-[family-name:var(--font-mono)] text-xs text-text-muted">{task.target?.target}</div>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    <div>{task.agent?.name ?? task.agent_uuid}</div>
                    <div className="text-xs text-text-muted">{task.agent?.city ?? '-'}</div>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    <div>{task.interval}s / timeout {task.timeout}ms</div>
                    <div className="text-xs text-text-muted">{task.port ? `port ${task.port}` : `packet ${task.packet_count}`}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={task.is_enabled ? 'success' : 'inactive'}>
                      {task.is_enabled ? '启用' : '停用'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">{formatDateTime(task.updated_at)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/app/monitoring/${task.task_uuid}`}>
                        <Button variant="ghost" size="sm">查看数据</Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => openEditTask(task)}>编辑</Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTaskEnabled.mutate(
                          { uuid: task.task_uuid, enabled: !task.is_enabled },
                          { onError: (error) => toast.error(error.message || '状态更新失败') },
                        )}
                      >
                        {task.is_enabled ? '停用' : '启用'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => setDeleteTaskUuid(task.task_uuid)}
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
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>新增 Task</DialogTitle>
            <DialogDescription>Task 必须绑定一个 Target 和一个 Agent，协议需被 Target 支持。</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="mt-2">
            <div aria-label="任务配置" className="divide-y divide-border rounded-lg border border-border bg-bg-surface-light px-4">
              <FieldRow label="任务名称" description="可选。为空时后端会按 Agent、Target、协议和 IP 协议族生成默认名称。" htmlFor="task-create-name">
                <Input id="task-create-name" placeholder="任务名称，可为空" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </FieldRow>
              <FieldRow label="Target" description="选择要探测的目标。协议列表会跟随 Target 的 supported_protocols 自动限制。">
                <Select value={form.target_uuid} onValueChange={(value) => {
                  const target = targets.find((item) => item.target_uuid === value)
                  const nextTypes = protocolOptionsForTarget(target)
                  setForm({ ...form, target_uuid: value ?? '', task_type: nextTypes.includes(form.task_type) ? form.task_type : nextTypes[0] })
                }}>
                  <SelectTrigger aria-label="Target" className="w-full">
                    <SelectValue>
                      {() => targetOptionLabel(selectedTarget, form.target_uuid)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {targets.map((target) => (
                      <SelectItem key={target.target_uuid} value={target.target_uuid}>{target.name} - {target.target}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label="Agent" description="选择实际执行任务的节点。任务会下发到该 Agent 的调度器。">
                <Select value={form.agent_uuid} onValueChange={(value) => setForm({ ...form, agent_uuid: value ?? '' })}>
                  <SelectTrigger aria-label="Agent" className="w-full">
                    <SelectValue>
                      {() => agentOptionLabel(selectedAgent, form.agent_uuid)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.agent_uuid} value={agent.agent_uuid}>{agent.name} - {agent.city || agent.country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label="协议类型" description="支持 ICMP、TCP、MTR、IPERF3。IPERF3 每天定时执行一次，结果存储在 PostgreSQL。">
                <Select value={form.task_type} onValueChange={(value) => setForm({ ...form, task_type: value as TaskType })}>
                  <SelectTrigger aria-label="协议类型" className="w-full">
                    <SelectValue>
                      {(value: TaskType | null) => value ? protocolLabel(value) : '选择协议类型'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableTaskTypes.map((type) => (
                      <SelectItem key={type} value={type}>{protocolLabel(type)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label="IP 协议族" description="选择 Agent 探测时使用 IPv4 或 IPv6。Target 和 Agent 需要具备对应连通性。">
                <Select value={form.ip_family} onValueChange={(value) => setForm({ ...form, ip_family: value as IpFamily })}>
                  <SelectTrigger aria-label="IP 协议族" className="w-full">
                    <SelectValue>
                      {(value: IpFamily | null) => ipFamilyLabel(value)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">IPv4</SelectItem>
                    <SelectItem value="6">IPv6</SelectItem>
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label="调度间隔" description="普通 ICMP/TCP/MTR 任务按秒调度，最小 60 秒。IPERF3 创建时会固定为每天一次。" htmlFor="task-create-interval">
                <Input id="task-create-interval" type="number" min="60" placeholder="间隔秒" value={form.interval} onChange={(event) => setForm({ ...form, interval: event.target.value })} />
              </FieldRow>
              <FieldRow label="超时时间" description="单次任务允许等待的毫秒数。IPERF3 会自动确保 timeout 大于执行时长。" htmlFor="task-create-timeout">
                <Input id="task-create-timeout" type="number" min="1000" placeholder="超时毫秒" value={form.timeout} onChange={(event) => setForm({ ...form, timeout: event.target.value })} />
              </FieldRow>
              <FieldRow label="包数量" description="ICMP/TCP/MTR 的采样包数量。IPERF3 不使用该值，创建时会固定为 1。" htmlFor="task-create-packet-count">
                <Input id="task-create-packet-count" type="number" min="1" placeholder="包数量" value={form.packet_count} onChange={(event) => setForm({ ...form, packet_count: event.target.value })} />
              </FieldRow>
              {(form.task_type === 'tcp' || form.task_type === 'iperf3') && (
                <FieldRow label="端口" description={form.task_type === 'iperf3' ? 'IPERF3 server 监听端口，默认 5201。' : 'TCP connect 探测的目标端口，默认 443。'} htmlFor="task-create-port">
                  <Input id="task-create-port" type="number" min="1" max="65535" placeholder="端口" value={form.port} onChange={(event) => setForm({ ...form, port: event.target.value })} />
                </FieldRow>
              )}
              {form.task_type === 'iperf3' && (
                <>
                  <FieldRow label="iperf3 线程模式" description="单线程用于基线测试，8 线程用于模拟多连接吞吐能力。">
                    <Select value={form.iperf3_mode} onValueChange={(value) => setForm({ ...form, iperf3_mode: value as Iperf3Mode })}>
                      <SelectTrigger aria-label="iperf3 线程模式" className="w-full">
                        <SelectValue>
                          {(value: Iperf3Mode | null) => value ? iperf3ModeLabel(value) : '选择线程模式'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single_thread">单线程</SelectItem>
                        <SelectItem value="multi_thread">8 线程</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldRow>
                  <FieldRow label="iperf3 执行时长" description="单次上传和下载动作各自运行的秒数，后端五分钟 claim 窗口覆盖两段动作。" htmlFor="task-create-iperf3-duration">
                    <Input id="task-create-iperf3-duration" type="number" min="1" placeholder="执行秒数" value={form.iperf3_duration} onChange={(event) => setForm({ ...form, iperf3_duration: event.target.value })} />
                  </FieldRow>
                </>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
              <Button type="submit" disabled={!form.target_uuid || !form.agent_uuid || createTask.isPending}>
                {createTask.isPending ? '创建中' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>快速关联</DialogTitle>
            <DialogDescription>选择一个 Target 和一个 Agent，由后端自动创建该关系下的默认任务。</DialogDescription>
          </DialogHeader>
          <div aria-label="快速关联配置" className="divide-y divide-border rounded-lg border border-border bg-bg-surface-light px-4">
            <FieldRow label="Target" description="选择要快速关联的目标。后端会按目标支持协议生成默认任务。">
              <Select value={quickTargetUuid} onValueChange={(value) => setQuickTargetUuid(value ?? '')}>
                <SelectTrigger aria-label="Target" className="w-full">
                  <SelectValue>
                    {() => targetOptionLabel(selectedQuickTarget, quickTargetUuid)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {targets.map((target) => (
                    <SelectItem key={target.target_uuid} value={target.target_uuid}>{target.name} - {target.target}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Agent" description="选择执行默认任务的 Agent。关联后会触发任务快照同步。">
              <Select value={quickAgentUuid} onValueChange={(value) => setQuickAgentUuid(value ?? '')}>
                <SelectTrigger aria-label="Agent" className="w-full">
                  <SelectValue>
                    {() => agentOptionLabel(selectedQuickAgent, quickAgentUuid)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.agent_uuid} value={agent.agent_uuid}>{agent.name} - {agent.city || agent.country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setQuickOpen(false)}>取消</Button>
            <Button disabled={!quickTargetUuid || !quickAgentUuid || quickAssociate.isPending} onClick={handleQuickAssociate}>
              {quickAssociate.isPending ? '关联中' : '关联'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTask} onOpenChange={(open) => { if (!open) setEditTask(null) }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑 Task</DialogTitle>
            <DialogDescription>可修改任务名称、绑定关系、IP 协议族、调度参数和协议相关 probe_config；任务类型保持不变。</DialogDescription>
          </DialogHeader>
          {editTask && (
            <form onSubmit={handleEdit}>
              <div aria-label="任务配置" className="divide-y divide-border rounded-lg border border-border bg-bg-surface-light px-4">
                <FieldRow label="任务名称" description="可选。留空保存时后端会按当前绑定关系和协议重新生成默认名称。" htmlFor="task-edit-name">
                  <Input id="task-edit-name" value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} placeholder="任务名称" />
                </FieldRow>
                <FieldRow label="Target" description="修改 Target 会重新校验该目标是否支持当前任务协议。">
                  <Select value={editForm.target_uuid} onValueChange={(value) => setEditForm({ ...editForm, target_uuid: value ?? '' })}>
                    <SelectTrigger aria-label="Target" className="w-full">
                      <SelectValue>
                        {() => targetOptionLabel(selectedEditTarget, editForm.target_uuid)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {targets.map((target) => (
                        <SelectItem key={target.target_uuid} value={target.target_uuid}>{target.name} - {target.target}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedEditTarget && !protocolOptionsForTarget(selectedEditTarget).includes(editTask.task_type) && (
                    <p className="mt-1 text-xs text-red-400">当前 Target 未声明支持 {protocolLabel(editTask.task_type)}。</p>
                  )}
                </FieldRow>
                <FieldRow label="Agent" description="修改 Agent 后，后端会同步任务快照，让新的 Agent 开始执行。">
                  <Select value={editForm.agent_uuid} onValueChange={(value) => setEditForm({ ...editForm, agent_uuid: value ?? '' })}>
                    <SelectTrigger aria-label="Agent" className="w-full">
                      <SelectValue>
                        {() => agentOptionLabel(selectedEditAgent, editForm.agent_uuid)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.agent_uuid} value={agent.agent_uuid}>{agent.name} - {agent.city || agent.country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="协议类型" description="任务类型由创建时确定，IPERF3 每天定时执行一次。">
                  <Badge className={`inline-flex h-9 items-center justify-center border px-3 ${PROTOCOL_COLORS[editTask.task_type] ?? ''}`}>
                    {protocolLabel(editTask.task_type)}
                  </Badge>
                </FieldRow>
                <FieldRow label="IP 协议族" description="选择 Agent 探测时使用 IPv4 或 IPv6。">
                  <Select value={editForm.ip_family} onValueChange={(value) => setEditForm({ ...editForm, ip_family: value as IpFamily })}>
                    <SelectTrigger aria-label="IP 协议族" className="w-full">
                      <SelectValue>
                        {(value: IpFamily | null) => ipFamilyLabel(value)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">IPv4</SelectItem>
                      <SelectItem value="6">IPv6</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="调度间隔" description="普通 ICMP/TCP/MTR 任务按秒调度，最小 60 秒。IPERF3 通常固定为每天一次。" htmlFor="task-edit-interval">
                  <Input id="task-edit-interval" type="number" min="60" value={editForm.interval} onChange={(event) => setEditForm({ ...editForm, interval: event.target.value })} placeholder="间隔秒" />
                </FieldRow>
                <FieldRow label="超时时间" description="单次任务允许等待的毫秒数。IPERF3 应大于执行时长。" htmlFor="task-edit-timeout">
                  <Input id="task-edit-timeout" type="number" min="1000" value={editForm.timeout} onChange={(event) => setEditForm({ ...editForm, timeout: event.target.value })} placeholder="超时毫秒" />
                </FieldRow>
                <FieldRow label="包数量" description="ICMP/TCP/MTR 的采样包数量。IPERF3 不使用该值。" htmlFor="task-edit-packet-count">
                  <Input id="task-edit-packet-count" type="number" min="1" value={editForm.packet_count} onChange={(event) => setEditForm({ ...editForm, packet_count: event.target.value })} placeholder="包数量" />
                </FieldRow>
                {(editTask.task_type === 'tcp' || editTask.task_type === 'iperf3') && (
                  <FieldRow label="端口" description={editTask.task_type === 'iperf3' ? 'IPERF3 server 监听端口，默认 5201。' : 'TCP connect 探测的目标端口，默认 443。'} htmlFor="task-edit-port">
                    <Input id="task-edit-port" aria-label="端口" type="number" min="1" max="65535" value={editForm.port} onChange={(event) => setEditForm({ ...editForm, port: event.target.value })} placeholder="端口" />
                  </FieldRow>
                )}
                {editTask.task_type === 'iperf3' && (
                  <>
                    <FieldRow label="iperf3 线程模式" description="单线程用于基线测试，8 线程用于模拟多连接吞吐能力。">
                      <Select value={editForm.iperf3_mode} onValueChange={(value) => setEditForm({ ...editForm, iperf3_mode: value as Iperf3Mode })}>
                        <SelectTrigger aria-label="iperf3 线程模式" className="w-full">
                          <SelectValue>
                            {(value: Iperf3Mode | null) => value ? iperf3ModeLabel(value) : '选择线程模式'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single_thread">单线程</SelectItem>
                          <SelectItem value="multi_thread">8 线程</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldRow>
                    <FieldRow label="iperf3 执行时长" description="单次上传和下载动作各自运行的秒数，后端五分钟 claim 窗口覆盖两段动作。" htmlFor="task-edit-iperf3-duration">
                      <Input id="task-edit-iperf3-duration" aria-label="iperf3 执行时长" type="number" min="1" value={editForm.iperf3_duration} onChange={(event) => setEditForm({ ...editForm, iperf3_duration: event.target.value })} placeholder="执行秒数" />
                    </FieldRow>
                  </>
                )}
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setEditTask(null)}>取消</Button>
                <Button type="submit" disabled={!editForm.target_uuid || !editForm.agent_uuid || updateTask.isPending}>
                  {updateTask.isPending ? '保存中' : '保存'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTaskUuid} onOpenChange={(open) => { if (!open) setDeleteTaskUuid(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除 Task</DialogTitle>
            <DialogDescription>确认软删除 {taskToDelete?.name ?? deleteTaskUuid}？删除后后端会重新发布 Agent 任务快照。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTaskUuid(null)}>取消</Button>
            <Button
              variant="destructive"
              disabled={deleteTask.isPending}
              onClick={() => {
                if (!deleteTaskUuid) return
                deleteTask.mutate(deleteTaskUuid, {
                  onSuccess: () => {
                    toast.success('Task 已删除')
                    setDeleteTaskUuid(null)
                  },
                  onError: (error) => toast.error(error.message || '删除失败'),
                })
              }}
            >
              {deleteTask.isPending ? '删除中' : '删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
