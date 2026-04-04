import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTaskAgents, useAssignAgents, useUnassignAgent } from '@/api/hooks/use-task-assignments'
import { useAgents } from '@/api/hooks/use-agents'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckableList } from '@/components/ui/checkable-list'
import type { AgentResponse } from '@/api/generated/types.gen'

interface AssignAgentsDialogProps {
  taskUuid: string | null
  onClose: () => void
}

export function AssignAgentsDialog({ taskUuid, onClose }: AssignAgentsDialogProps) {
  const { t } = useTranslation()
  const { data: taskAgentsData, isLoading } = useTaskAgents(taskUuid ?? '')
  const { data: allAgentsData } = useAgents()
  const assignAgents = useAssignAgents()
  const unassignAgent = useUnassignAgent()
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  const taskAgents = (taskAgentsData ?? []) as AgentResponse[]
  const allAgents = (allAgentsData ?? []) as AgentResponse[]
  const assignedUuids = new Set(taskAgents.map((a) => a.agent_uuid))

  const handleToggle = (agentUuid: string) => {
    if (!taskUuid) return
    setPendingIds((prev) => new Set([...prev, agentUuid]))
    const cleanup = () => setPendingIds((prev) => { const n = new Set(prev); n.delete(agentUuid); return n })
    if (assignedUuids.has(agentUuid)) {
      unassignAgent.mutate({ taskUuid, agentUuid }, { onSettled: cleanup })
    } else {
      assignAgents.mutate({ taskUuid, data: { agent_uuids: [agentUuid] } }, { onSettled: cleanup })
    }
  }

  return (
    <Dialog open={taskUuid !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('tasks.manageAgents')}</DialogTitle>
          <DialogDescription>{t('tasks.manageAgentsDesc')}</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
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
            onToggle={handleToggle}
            emptyMessage={t('tasks.noAvailableAgents')}
          />
        )}
        <DialogFooter>
          <Button onClick={onClose} className="bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 border-none">
            {t('common.done')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
