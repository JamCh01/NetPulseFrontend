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
import { PROTOCOL_COLORS } from '@/lib/constants'

export default function TasksPage() {
  const [keyword, setKeyword] = useState('')
  const [taskType, setTaskType] = useState<TaskType | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [editTask, setEditTask] = useState<AdminTask | null>(null)
  const [deleteTaskUuid, setDeleteTaskUuid] = useState<string | null>(null)
  const [quickTargetUuid, setQuickTargetUuid] = useState('')
  const [quickAgentUuid, setQuickAgentUuid] = useState('')
  const [form, setForm] = useState({
    name: '',
    target_uuid: '',
    agent_uuid: '',
    task_type: 'icmp' as TaskType,
    ip_family: '4' as IpFamily,
    interval: '60',
    timeout: '3000',
    packet_count: '4',
    port: '443',
    iperf3_mode: 'single_thread' as 'single_thread' | 'multi_thread',
    iperf3_duration: '10',
  })

  const tasksQuery = useTasks({ keyword, task_type: taskType, sort_by: 'name', sort_order: 'asc' })
  const targetsQuery = useTargets({ page_size: 200, sort_by: 'name', sort_order: 'asc', is_enabled: true })
  const agentsQuery = useAgents({ page_size: 200, sort_by: 'name', sort_order: 'asc', is_enabled: true })
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const setTaskEnabled = useSetTaskEnabled()
  const deleteTask = useDeleteTask()
  const quickAssociate = useQuickAssociate()

  const tasks = tasksQuery.data?.items ?? []
  const targets = targetsQuery.data?.items ?? []
  const agents = agentsQuery.data?.items ?? []
  const selectedTarget = useMemo(
    () => targets.find((target) => target.target_uuid === form.target_uuid) ?? null,
    [form.target_uuid, targets],
  )
  const availableTaskTypes = protocolOptionsForTarget(selectedTarget)

  const resetCreateForm = () => {
    setForm({
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
    })
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

  const handleEdit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!editTask) return
    updateTask.mutate({
      uuid: editTask.task_uuid,
      data: {
        name: editTask.name,
        interval: editTask.interval,
        timeout: editTask.timeout,
        packet_count: editTask.packet_count,
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
            <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="icmp">ICMP</SelectItem>
              <SelectItem value="tcp">TCP</SelectItem>
              <SelectItem value="mtr">MTR</SelectItem>
              <SelectItem value="iperf3">iperf3</SelectItem>
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
                    <Badge className={`border uppercase ${PROTOCOL_COLORS[task.task_type] ?? ''}`}>{task.task_type}</Badge>
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
                      <Button variant="ghost" size="sm" onClick={() => setEditTask(task)}>编辑</Button>
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
          <form onSubmit={handleCreate} className="mt-2 grid gap-4">
            <Input placeholder="任务名称，可为空" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="mb-1.5 text-xs text-text-secondary">Target</Label>
                <Select value={form.target_uuid} onValueChange={(value) => {
                  const target = targets.find((item) => item.target_uuid === value)
                  const nextTypes = protocolOptionsForTarget(target)
                  setForm({ ...form, target_uuid: value ?? '', task_type: nextTypes.includes(form.task_type) ? form.task_type : nextTypes[0] })
                }}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="选择 Target" /></SelectTrigger>
                  <SelectContent>
                    {targets.map((target) => (
                      <SelectItem key={target.target_uuid} value={target.target_uuid}>{target.name} - {target.target}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-text-secondary">Agent</Label>
                <Select value={form.agent_uuid} onValueChange={(value) => setForm({ ...form, agent_uuid: value ?? '' })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="选择 Agent" /></SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.agent_uuid} value={agent.agent_uuid}>{agent.name} - {agent.city || agent.country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <Select value={form.task_type} onValueChange={(value) => setForm({ ...form, task_type: value as TaskType })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableTaskTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={form.ip_family} onValueChange={(value) => setForm({ ...form, ip_family: value as IpFamily })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">IPv4</SelectItem>
                  <SelectItem value="6">IPv6</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" min="60" placeholder="间隔秒" value={form.interval} onChange={(event) => setForm({ ...form, interval: event.target.value })} />
              <Input type="number" min="1000" placeholder="超时毫秒" value={form.timeout} onChange={(event) => setForm({ ...form, timeout: event.target.value })} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Input type="number" min="1" placeholder="包数量" value={form.packet_count} onChange={(event) => setForm({ ...form, packet_count: event.target.value })} />
              {(form.task_type === 'tcp' || form.task_type === 'iperf3') && (
                <Input type="number" min="1" max="65535" placeholder="端口" value={form.port} onChange={(event) => setForm({ ...form, port: event.target.value })} />
              )}
              {form.task_type === 'iperf3' && (
                <>
                  <Select value={form.iperf3_mode} onValueChange={(value) => setForm({ ...form, iperf3_mode: value as 'single_thread' | 'multi_thread' })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_thread">单线程</SelectItem>
                      <SelectItem value="multi_thread">8 线程</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" min="1" placeholder="执行秒数" value={form.iperf3_duration} onChange={(event) => setForm({ ...form, iperf3_duration: event.target.value })} />
                </>
              )}
            </div>
            <DialogFooter>
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
          <div className="space-y-3">
            <Select value={quickTargetUuid} onValueChange={(value) => setQuickTargetUuid(value ?? '')}>
              <SelectTrigger className="w-full"><SelectValue placeholder="选择 Target" /></SelectTrigger>
              <SelectContent>
                {targets.map((target) => (
                  <SelectItem key={target.target_uuid} value={target.target_uuid}>{target.name} - {target.target}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={quickAgentUuid} onValueChange={(value) => setQuickAgentUuid(value ?? '')}>
              <SelectTrigger className="w-full"><SelectValue placeholder="选择 Agent" /></SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.agent_uuid} value={agent.agent_uuid}>{agent.name} - {agent.city || agent.country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickOpen(false)}>取消</Button>
            <Button disabled={!quickTargetUuid || !quickAgentUuid || quickAssociate.isPending} onClick={handleQuickAssociate}>
              {quickAssociate.isPending ? '关联中' : '关联'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTask} onOpenChange={(open) => { if (!open) setEditTask(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑 Task</DialogTitle>
            <DialogDescription>当前只开放安全字段：名称、间隔、超时和包数量。</DialogDescription>
          </DialogHeader>
          {editTask && (
            <form onSubmit={handleEdit} className="space-y-3">
              <Input value={editTask.name} onChange={(event) => setEditTask({ ...editTask, name: event.target.value })} />
              <Input type="number" min="60" value={editTask.interval} onChange={(event) => setEditTask({ ...editTask, interval: Number(event.target.value) })} />
              <Input type="number" min="1000" value={editTask.timeout} onChange={(event) => setEditTask({ ...editTask, timeout: Number(event.target.value) })} />
              <Input type="number" min="1" value={editTask.packet_count} onChange={(event) => setEditTask({ ...editTask, packet_count: Number(event.target.value) })} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditTask(null)}>取消</Button>
                <Button type="submit" disabled={updateTask.isPending}>{updateTask.isPending ? '保存中' : '保存'}</Button>
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
