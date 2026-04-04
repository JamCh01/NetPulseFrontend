import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAgent, useUpdateAgent, useDisableAgent } from '@/api/hooks/use-agents'
import { useAgentTasks, useAssignTasksFromAgent, useUnassignTaskFromAgent } from '@/api/hooks/use-agent-tasks'
import { useTasks } from '@/api/hooks/use-tasks'
import { formatDateTime } from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { AgentResponse, TaskResponse } from '@/api/generated/types.gen'
import { AGENT_STATUS_COLORS, PROTOCOL_COLORS } from '@/lib/constants'
import { GeoCascader } from '@/features/agents/components/geo-cascader'

function parseTag(tag: string): { key: string; value: string } {
  const idx = tag.indexOf(':')
  if (idx === -1) return { key: tag, value: '' }
  return { key: tag.slice(0, idx), value: tag.slice(idx + 1) }
}

export default function AgentDetailPage() {
  const { agentUuid } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { data, isLoading, error } = useAgent(agentUuid ?? '')
  const updateAgent = useUpdateAgent()
  const disableAgent = useDisableAgent()

  const agent = data as AgentResponse | undefined
  const isAdmin = useAuthStore((s) => s.isAdmin())

  const { data: agentTasksData, isLoading: tasksLoading } = useAgentTasks(agentUuid ?? '')
  const { data: allTasksData } = useTasks()
  const assignTasks = useAssignTasksFromAgent()
  const unassignTask = useUnassignTaskFromAgent()

  const agentTasksRaw = agentTasksData as { tasks?: TaskResponse[] } | TaskResponse[] | undefined
  const agentTasks: TaskResponse[] = Array.isArray(agentTasksRaw)
    ? agentTasksRaw
    : (agentTasksRaw?.tasks ?? [])
  const allTasks = (allTasksData ?? []) as TaskResponse[]
  const assignedTaskUuids = new Set(agentTasks.map((tk) => tk.task_uuid))
  const availableTasks = allTasks.filter((tk) => !assignedTaskUuids.has(tk.task_uuid) && tk.is_active)

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editTags, setEditTags] = useState<Record<string, string>>({})
  const [disableOpen, setDisableOpen] = useState(false)
  const [selectedTaskUuid, setSelectedTaskUuid] = useState('')

  const startEditing = () => {
    if (!agent) return
    setEditName(agent.agent_name)
    const tagsMap: Record<string, string> = {}
    for (const tag of agent.tags) {
      const { key, value } = parseTag(tag)
      tagsMap[key] = value
    }
    setEditTags(tagsMap)
    setEditing(true)
  }

  const handleSave = () => {
    if (!agentUuid) return
    const tags = Object.entries(editTags).map(([k, v]) => `${k}:${v}`)
    updateAgent.mutate(
      { uuid: agentUuid, data: { agent_name: editName, tags } },
      { onSuccess: () => setEditing(false) },
    )
  }

  const handleDisable = () => {
    if (!agentUuid) return
    disableAgent.mutate(agentUuid, {
      onSuccess: () => {
        setDisableOpen(false)
        navigate('/agents')
      },
    })
  }

  const handleAssignTask = () => {
    if (!agentUuid || !selectedTaskUuid) return
    assignTasks.mutate(
      { taskUuid: selectedTaskUuid, agentUuid, data: { agent_uuids: [agentUuid] } },
      { onSuccess: () => setSelectedTaskUuid('') },
    )
  }

  const handleUnassignTask = (taskUuid: string) => {
    if (!agentUuid) return
    unassignTask.mutate({ taskUuid, agentUuid })
  }

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="glass-light rounded-xl p-6 space-y-4">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-6">{t('agents.detail')}</h1>
        <div className="glass-light rounded-xl p-6 text-center">
          <p className="text-red-400 text-sm">{t('agents.failedToLoadDetail')}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/agents')}>
            {t('agents.backToAgents')}
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
            onClick={() => navigate('/agents')}
            className="text-text-muted hover:text-text-primary transition-colors text-sm"
          >
            {t('agents.title')} /
          </button>
          <h1 className="text-2xl font-bold text-text-primary">{agent.agent_name}</h1>
          <Badge className={`border text-xs ${AGENT_STATUS_COLORS[agent.status] ?? AGENT_STATUS_COLORS.offline}`}>
            {agent.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <>
              <Button variant="outline" onClick={startEditing}>
                {t('common.edit')}
              </Button>
              {agent.status !== 'disabled' && (
                <Button
                  variant="destructive"
                  onClick={() => setDisableOpen(true)}
                >
                  {t('agents.disableAgent')}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Agent Info */}
        <div className="glass-light rounded-xl p-6">
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">{t('agents.agentInfo')}</h2>
          {editing ? (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-text-secondary mb-1.5">{t('agents.agentName')}</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <GeoCascader
                continent={editTags['continent'] ?? ''}
                country={editTags['country'] ?? ''}
                city={editTags['city'] ?? ''}
                onChange={({ continent, country, city }) =>
                  setEditTags((prev) => ({ ...prev, continent, country, city }))
                }
              />
              <div>
                <Label className="text-xs text-text-secondary mb-1.5">{t('agents.isp')}</Label>
                <Input
                  value={editTags['isp'] ?? ''}
                  onChange={(e) =>
                    setEditTags((prev) => ({ ...prev, isp: e.target.value }))
                  }
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={updateAgent.isPending}
                  className="bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 border-none"
                >
                  {updateAgent.isPending ? t('common.saving') : t('common.save')}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
              {updateAgent.isError && (
                <p className="text-red-400 text-xs">{t('agents.failedToUpdate')}</p>
              )}
            </div>
          ) : (
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-text-muted">{t('common.uuid')}</dt>
                <dd className="text-sm text-text-secondary font-[family-name:var(--font-mono)]">{agent.agent_uuid}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">{t('common.name')}</dt>
                <dd className="text-sm text-text-primary">{agent.agent_name}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">{t('common.createdAt')}</dt>
                <dd className="text-sm text-text-secondary font-[family-name:var(--font-mono)]">
                  {formatDateTime(agent.created_at, i18n.language)}
                </dd>
              </div>
            </dl>
          )}
        </div>

        {/* Tags */}
        {!editing && (
          <div className="glass-light rounded-xl p-6">
            <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">{t('agents.tags')}</h2>
            <div className="space-y-2">
              {agent.tags.map((tag) => {
                const { key, value } = parseTag(tag)
                return (
                  <div key={tag} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-xs text-text-muted uppercase tracking-wider">{key}</span>
                    <span className="text-sm text-text-primary">{value}</span>
                  </div>
                )
              })}
              {agent.tags.length === 0 && (
                <p className="text-text-muted text-sm">{t('agents.noTags')}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Assigned Tasks */}
      <div className="glass-light rounded-xl p-6 mt-4">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">{t('agents.assignedTasks')}</h2>

        {isAdmin && (
          <div className="flex items-center gap-2 mb-4">
            <Select value={selectedTaskUuid} onValueChange={(val) => setSelectedTaskUuid(val ?? '')}>
              <SelectTrigger className="flex-1" disabled={availableTasks.length === 0}>
                <SelectValue placeholder={availableTasks.length === 0 ? t('agents.noAvailableTasks') : t('agents.selectTask')}>
                  {(value: string | null) => {
                    if (!value) return availableTasks.length === 0 ? t('agents.noAvailableTasks') : t('agents.selectTask')
                    const found = availableTasks.find((task) => task.task_uuid === value)
                    return found?.task_name ?? t('agents.selectTask')
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableTasks.map((tk) => (
                  <SelectItem key={tk.task_uuid} value={tk.task_uuid}>
                    {tk.task_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAssignTask}
              disabled={!selectedTaskUuid || assignTasks.isPending}
              className="bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 border-none shrink-0"
            >
              {t('common.assign')}
            </Button>
          </div>
        )}

        {tasksLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : agentTasks.length === 0 ? (
          <p className="text-text-muted text-sm">{t('agents.noTasksAssigned')}</p>
        ) : (
          <div className="space-y-2">
            {agentTasks.map((tk) => (
              <div
                key={tk.task_uuid}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text-primary font-medium">{tk.task_name}</span>
                  <Badge className={`border text-[10px] uppercase ${PROTOCOL_COLORS[tk.protocol] ?? ''}`}>
                    {tk.protocol}
                  </Badge>
                  <span className="text-xs text-text-muted font-[family-name:var(--font-mono)]">{tk.target}</span>
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleUnassignTask(tk.task_uuid)}
                    disabled={unassignTask.isPending}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    {t('common.remove')}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disable Confirmation Dialog */}
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('agents.disableAgent')}</DialogTitle>
            <DialogDescription>
              {t('agents.disableAgentConfirm', { name: agent.agent_name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={disableAgent.isPending}
            >
              {disableAgent.isPending ? t('common.disabling') : t('agents.disableAgent')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
