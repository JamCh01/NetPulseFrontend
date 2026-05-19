import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useTasks, useCreateTask, useUpdateTask, useDisableTask } from '@/api/hooks/use-tasks'
import { useAgents } from '@/api/hooks/use-agents'
import { useAssignAgents } from '@/api/hooks/use-task-assignments'
import { useAuthStore } from '@/stores/auth-store'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckableList } from '@/components/ui/checkable-list'
import { Pagination } from '@/components/ui/pagination'
import { AssignAgentsDialog } from '@/features/tasks/components/assign-agents-dialog'
import type { TaskResponse, ProtocolEnum, AgentResponse, PaginatedResponseTaskResponse } from '@/api/generated/types.gen'
import { PROTOCOL_COLORS } from '@/lib/constants'

const PAGE_SIZE = 50

export default function TasksPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const [page, setPage] = useState(1)
  const { data, isLoading, error } = useTasks({ skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE })
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const disableTask = useDisableTask()
  const { data: allAgentsData } = useAgents({ limit: 200 })
  const assignAgents = useAssignAgents()

  const tasks = ((data as PaginatedResponseTaskResponse)?.items ?? []) as TaskResponse[]
  const totalPages = Math.ceil(((data as PaginatedResponseTaskResponse)?.total ?? 0) / PAGE_SIZE)
  const allAgents = ((allAgentsData as { items?: AgentResponse[] })?.items ?? []) as AgentResponse[]

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [taskName, setTaskName] = useState('')
  const [protocol, setProtocol] = useState<ProtocolEnum>('icmp')
  const [target, setTarget] = useState('')
  const [port, setPort] = useState('')
  const [interval, setInterval_] = useState('60')
  const [selectedAgentUuids, setSelectedAgentUuids] = useState<Set<string>>(new Set())

  // Edit dialog
  const [editUuid, setEditUuid] = useState<string | null>(null)
  const editTarget_ = editUuid ? tasks.find((t) => t.task_uuid === editUuid) : null
  const [editName, setEditName] = useState('')
  const [editTargetVal, setEditTargetVal] = useState('')
  const [editInterval, setEditInterval] = useState('')
  const [editPacketCount, setEditPacketCount] = useState('')

  // Delete dialog
  const [deleteUuid, setDeleteUuid] = useState<string | null>(null)
  const deleteTarget = deleteUuid ? tasks.find((t) => t.task_uuid === deleteUuid) : null

  // Assign agents dialog
  const [assignDialogTaskUuid, setAssignDialogTaskUuid] = useState<string | null>(null)

  const resetCreateForm = () => {
    setTaskName('')
    setProtocol('icmp')
    setTarget('')
    setPort('')
    setInterval_('60')
    setSelectedAgentUuids(new Set())
  }

  const openEditDialog = (task: TaskResponse) => {
    setEditName(task.task_name)
    setEditTargetVal(task.target)
    setEditInterval(String(task.interval))
    setEditPacketCount(String(task.packet_count))
    setEditUuid(task.task_uuid)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createTask.mutate(
      {
        task_name: taskName,
        protocol,
        target,
        port: port ? Number(port) : undefined,
        interval: Number(interval),
      },
      {
        onSuccess: (result) => {
          setCreateOpen(false)
          resetCreateForm()
          const res = result as TaskResponse | undefined
          if (res?.task_uuid && selectedAgentUuids.size > 0) {
            assignAgents.mutate({
              taskUuid: res.task_uuid,
              data: { agent_uuids: Array.from(selectedAgentUuids) },
            })
          }
        },
      },
    )
  }

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUuid) return
    updateTask.mutate(
      {
        uuid: editUuid,
        data: {
          task_name: editName,
          target: editTargetVal,
          interval: Number(editInterval),
          packet_count: Number(editPacketCount),
        },
      },
      { onSuccess: () => setEditUuid(null) },
    )
  }

  const handleToggleActive = (task: TaskResponse) => {
    updateTask.mutate({ uuid: task.task_uuid, data: { is_active: !task.is_active } })
  }

  const handleDelete = () => {
    if (!deleteUuid) return
    disableTask.mutate(deleteUuid, { onSuccess: () => setDeleteUuid(null) })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t('tasks.title')}</h1>
        {isAdmin && (
          <Button
            className="bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 border-none"
            onClick={() => setCreateOpen(true)}
          >
            {t('tasks.createTask')}
          </Button>
        )}
      </div>

      <div className="glass-light rounded-xl p-1">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-400 text-sm">{t('tasks.failedToLoad')}</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-text-muted text-sm">{t('tasks.noTasks')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.name')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('tasks.protocol')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('tasks.target')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('tasks.port')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('tasks.interval')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.status')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.task_uuid} className="border-white/5 hover:bg-white/5">
                  <TableCell className="text-text-primary font-medium">{task.task_name}</TableCell>
                  <TableCell>
                    <Badge className={`border text-xs uppercase ${PROTOCOL_COLORS[task.protocol] ?? ''}`}>
                      {task.protocol}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-text-secondary text-sm font-[family-name:var(--font-mono)]">{task.target}</TableCell>
                  <TableCell className="text-text-secondary text-sm font-[family-name:var(--font-mono)]">
                    {task.port ?? '-'}
                  </TableCell>
                  <TableCell className="text-text-secondary text-sm font-[family-name:var(--font-mono)]">
                    {task.interval}s
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`border text-xs ${
                        task.is_active
                          ? 'bg-green-500/15 text-green-400 border-green-500/30'
                          : 'bg-gray-500/15 text-gray-400 border-gray-500/30'
                      }`}
                    >
                      {task.is_active ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="text-xs h-9 px-3 text-text-muted hover:text-text-primary"
                        onClick={() => navigate(`/monitoring/${task.task_uuid}`)}
                      >
                        {t('tasks.viewMonitoring')}
                      </Button>
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="sm" className="text-xs h-9 px-3 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                            onClick={() => navigate(`/tasks/${task.task_uuid}`)}
                          >
                            {t('tasks.manageTask')}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs h-9 px-3 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                            onClick={() => setAssignDialogTaskUuid(task.task_uuid)}
                          >
                            {t('tasks.manageAgents')}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs h-9 px-3 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            onClick={() => openEditDialog(task)}
                          >
                            {t('common.edit')}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs h-9 px-3 text-text-muted hover:text-text-primary"
                            onClick={() => handleToggleActive(task)}
                          >
                            {task.is_active ? t('common.disable') : t('common.enable')}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs h-9 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => setDeleteUuid(task.task_uuid)}
                          >
                            {t('common.delete')}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={isLoading} />

      {/* Create Task Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('tasks.dialogTitle')}</DialogTitle>
            <DialogDescription>{t('tasks.dialogDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('tasks.taskName')}</Label>
              <Input
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder={t('tasks.taskNamePlaceholder')}
                required
              />
            </div>
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('tasks.protocol')}</Label>
              <Select value={protocol} onValueChange={(val) => setProtocol(val as ProtocolEnum)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="icmp">ICMP</SelectItem>
                  <SelectItem value="tcp">TCP</SelectItem>
                  <SelectItem value="http">HTTP</SelectItem>
                  <SelectItem value="udp">UDP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('tasks.target')}</Label>
              <Input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={t('tasks.targetPlaceholder')}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-text-secondary mb-1.5">{t('tasks.portOptional')}</Label>
                <Input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder={t('tasks.portPlaceholder')}
                />
              </div>
              <div>
                <Label className="text-xs text-text-secondary mb-1.5">{t('tasks.intervalSeconds')}</Label>
                <Input
                  type="number"
                  value={interval}
                  onChange={(e) => setInterval_(e.target.value)}
                  min="10"
                  required
                />
              </div>
            </div>
            {isAdmin && (
              <div>
                <Label className="text-xs text-text-secondary mb-1.5">{t('tasks.assignAgentsOptional')}</Label>
                <CheckableList
                  items={allAgents
                    .filter((a) => a.status !== 'disabled')
                    .map((a) => ({
                      id: a.agent_uuid,
                      label: a.agent_name,
                      sublabel: a.tags.find((tg) => tg.startsWith('city:'))?.slice(5) ?? '',
                    }))}
                  selectedIds={selectedAgentUuids}
                  onToggle={(id) => {
                    setSelectedAgentUuids((prev) => {
                      const next = new Set(prev)
                      if (next.has(id)) next.delete(id)
                      else next.add(id)
                      return next
                    })
                  }}
                  emptyMessage={t('tasks.noAvailableAgents')}
                />
              </div>
            )}
            <DialogFooter>
              <Button
                type="submit"
                disabled={createTask.isPending}
                className="bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 border-none"
              >
                {createTask.isPending ? t('common.creating') : t('tasks.createTask')}
              </Button>
            </DialogFooter>
            {createTask.isError && (
              <p className="text-red-400 text-xs mt-2">{t('tasks.createFailed')}</p>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={editUuid !== null} onOpenChange={(open) => { if (!open) setEditUuid(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('tasks.editTask')}</DialogTitle>
            <DialogDescription>{t('tasks.editTaskDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('tasks.taskName')}</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('tasks.protocol')}</Label>
              <Input value={editTarget_?.protocol?.toUpperCase() ?? ''} disabled className="opacity-60" />
            </div>
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('tasks.target')}</Label>
              <Input value={editTargetVal} onChange={(e) => setEditTargetVal(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-text-secondary mb-1.5">{t('tasks.intervalSeconds')}</Label>
                <Input type="number" value={editInterval} onChange={(e) => setEditInterval(e.target.value)} min="10" required />
              </div>
              <div>
                <Label className="text-xs text-text-secondary mb-1.5">{t('tasks.packetCount')}</Label>
                <Input type="number" value={editPacketCount} onChange={(e) => setEditPacketCount(e.target.value)} min="1" required />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={updateTask.isPending}
                className="bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 border-none"
              >
                {updateTask.isPending ? t('common.saving') : t('common.save')}
              </Button>
            </DialogFooter>
            {updateTask.isError && (
              <p className="text-red-400 text-xs mt-2">{t('tasks.failedToUpdate')}</p>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteUuid !== null} onOpenChange={(open) => { if (!open) setDeleteUuid(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('tasks.deleteTask')}</DialogTitle>
            <DialogDescription>{t('tasks.deleteConfirm', { name: deleteTarget?.task_name ?? '' })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUuid(null)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={disableTask.isPending}>
              {disableTask.isPending ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Agents Dialog */}
      <AssignAgentsDialog
        taskUuid={assignDialogTaskUuid}
        onClose={() => setAssignDialogTaskUuid(null)}
      />
    </div>
  )
}
