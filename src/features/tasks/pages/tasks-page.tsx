import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useTasks, useCreateTask } from '@/api/hooks/use-tasks'
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
import type { TaskResponse, ProtocolEnum } from '@/api/generated/types.gen'
import { PROTOCOL_COLORS } from '@/lib/constants'

export default function TasksPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const { data, isLoading, error } = useTasks()
  const createTask = useCreateTask()

  const [createOpen, setCreateOpen] = useState(false)
  const [taskName, setTaskName] = useState('')
  const [protocol, setProtocol] = useState<ProtocolEnum>('icmp')
  const [target, setTarget] = useState('')
  const [port, setPort] = useState('')
  const [interval, setInterval_] = useState('60')

  const tasks = (data ?? []) as TaskResponse[]

  const resetForm = () => {
    setTaskName('')
    setProtocol('icmp')
    setTarget('')
    setPort('')
    setInterval_('60')
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
        onSuccess: () => {
          setCreateOpen(false)
          resetForm()
        },
      },
    )
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow
                  key={task.task_uuid}
                  className="border-white/5 cursor-pointer hover:bg-white/5"
                  onClick={() => navigate(`/monitoring/${task.task_uuid}`)}
                >
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

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
    </div>
  )
}
