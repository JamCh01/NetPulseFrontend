import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useTask, useUpdateTask } from '@/api/hooks/use-tasks'
import { useTaskAgents, useAssignAgents, useUnassignAgent } from '@/api/hooks/use-task-assignments'
import { formatDateTime } from '@/lib/format'
import { useAgents } from '@/api/hooks/use-agents'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckableList } from '@/components/ui/checkable-list'
import type { TaskResponse, AgentResponse } from '@/api/generated/types.gen'
import { PROTOCOL_COLORS } from '@/lib/constants'

export default function TaskDetailPage() {
  const { taskUuid } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const { data: taskData, isLoading: taskLoading, error: taskError } = useTask(taskUuid ?? '')
  const { data: taskAgentsData, isLoading: agentsLoading } = useTaskAgents(taskUuid ?? '')
  const { data: allAgentsData } = useAgents()
  const updateTask = useUpdateTask()
  const assignAgents = useAssignAgents()
  const unassignAgent = useUnassignAgent()

  const task = taskData as TaskResponse | undefined
  const taskAgents = (taskAgentsData ?? []) as AgentResponse[]
  const allAgents = (allAgentsData ?? []) as AgentResponse[]

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editTarget, setEditTarget] = useState('')
  const [editInterval, setEditInterval] = useState('')
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  const assignedUuids = new Set(taskAgents.map((a) => a.agent_uuid))

  const startEditing = () => {
    if (!task) return
    setEditName(task.task_name)
    setEditTarget(task.target)
    setEditInterval(String(task.interval))
    setEditing(true)
  }

  const handleSave = () => {
    if (!taskUuid) return
    updateTask.mutate(
      {
        uuid: taskUuid,
        data: {
          task_name: editName,
          target: editTarget,
          interval: Number(editInterval),
        },
      },
      { onSuccess: () => setEditing(false) },
    )
  }

  const handleToggleAgent = (agentUuid: string) => {
    if (!taskUuid) return
    setPendingIds((prev) => new Set([...prev, agentUuid]))
    const cleanup = () => setPendingIds((prev) => { const n = new Set(prev); n.delete(agentUuid); return n })
    if (assignedUuids.has(agentUuid)) {
      unassignAgent.mutate({ taskUuid, agentUuid }, { onSettled: cleanup })
    } else {
      assignAgents.mutate({ taskUuid, data: { agent_uuids: [agentUuid] } }, { onSettled: cleanup })
    }
  }

  if (taskLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="glass-light rounded-xl p-6 space-y-4">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-6 w-48" />
        </div>
      </div>
    )
  }

  if (taskError || !task) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-6">{t('tasks.detail')}</h1>
        <div className="glass-light rounded-xl p-6 text-center">
          <p className="text-red-400 text-sm">{t('tasks.failedToLoadDetail')}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/tasks')}>
            {t('tasks.backToTasks')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tasks')}
            className="text-text-muted hover:text-text-primary transition-colors text-sm"
          >
            {t('tasks.title')} /
          </button>
          <h1 className="text-2xl font-bold text-text-primary">{task.task_name}</h1>
          <Badge className={`border text-xs uppercase ${PROTOCOL_COLORS[task.protocol] ?? ''}`}>
            {task.protocol}
          </Badge>
          <Badge
            className={`border text-xs ${
              task.is_active
                ? 'bg-green-500/15 text-green-400 border-green-500/30'
                : 'bg-gray-500/15 text-gray-400 border-gray-500/30'
            }`}
          >
            {task.is_active ? t('common.active') : t('common.inactive')}
          </Badge>
        </div>
        {isAdmin && !editing && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={startEditing}>
              {t('common.edit')}
            </Button>
            <Button
              className="bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 border-none"
              onClick={() => navigate(`/monitoring/${task.task_uuid}`)}
            >
              {t('tasks.viewMonitoring')}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Task Info */}
        <div className="glass-light rounded-xl p-6">
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">{t('tasks.taskConfig')}</h2>
          {editing ? (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-text-secondary mb-1.5">{t('tasks.taskName')}</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-text-secondary mb-1.5">{t('tasks.target')}</Label>
                <Input value={editTarget} onChange={(e) => setEditTarget(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-text-secondary mb-1.5">{t('tasks.intervalSeconds')}</Label>
                <Input
                  type="number"
                  value={editInterval}
                  onChange={(e) => setEditInterval(e.target.value)}
                  min="10"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={updateTask.isPending}
                  className="bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 border-none"
                >
                  {updateTask.isPending ? t('common.saving') : t('common.save')}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
              {updateTask.isError && (
                <p className="text-red-400 text-xs">{t('tasks.failedToUpdate')}</p>
              )}
            </div>
          ) : (
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-text-muted">{t('common.uuid')}</dt>
                <dd className="text-sm text-text-secondary font-[family-name:var(--font-mono)]">{task.task_uuid}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">{t('tasks.target')}</dt>
                <dd className="text-sm text-text-primary font-[family-name:var(--font-mono)]">{task.target}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">{t('tasks.port')}</dt>
                <dd className="text-sm text-text-secondary font-[family-name:var(--font-mono)]">{task.port ?? t('common.na')}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">{t('tasks.interval')}</dt>
                <dd className="text-sm text-text-secondary font-[family-name:var(--font-mono)]">{task.interval}s</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">{t('tasks.packetCount')}</dt>
                <dd className="text-sm text-text-secondary font-[family-name:var(--font-mono)]">{task.packet_count}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">{t('tasks.timeout')}</dt>
                <dd className="text-sm text-text-secondary font-[family-name:var(--font-mono)]">{task.timeout}s</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">{t('common.createdAt')}</dt>
                <dd className="text-sm text-text-secondary font-[family-name:var(--font-mono)]">
                  {formatDateTime(task.created_at, i18n.language)}
                </dd>
              </div>
            </dl>
          )}
        </div>

        {/* Agent Assignments */}
        <div className="glass-light rounded-xl p-6">
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">{t('tasks.assignedAgents')}</h2>

          {agentsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : isAdmin ? (
            <CheckableList
              items={allAgents
                .filter((a) => a.status !== 'disabled')
                .map((a) => ({
                  id: a.agent_uuid,
                  label: a.agent_name,
                  sublabel: a.status,
                  disabled: pendingIds.has(a.agent_uuid),
                }))}
              selectedIds={assignedUuids}
              onToggle={handleToggleAgent}
              emptyMessage={t('tasks.noAvailableAgents')}
            />
          ) : taskAgents.length === 0 ? (
            <p className="text-text-muted text-sm">{t('tasks.noAgentsAssigned')}</p>
          ) : (
            <div className="space-y-2">
              {taskAgents.map((agent) => (
                <div
                  key={agent.agent_uuid}
                  className="flex items-center gap-2 py-2 px-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      agent.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                    }`}
                  />
                  <span className="text-sm text-text-primary">{agent.agent_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
