import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router'
import { useTask } from '@/api/hooks/use-tasks'
import { useTaskAgents } from '@/api/hooks/use-task-assignments'
import { useMtrList, useMtrDetail } from '@/api/hooks/use-mtr'
import { MtrTimeline } from '@/features/monitoring/components/mtr-timeline'
import { MtrDetailTable } from '@/features/monitoring/components/mtr-detail-table'
import { TimeRangeSelector } from '@/features/monitoring/components/time-range-selector'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import type { TaskResponse, AgentResponse } from '@/api/generated/types.gen'
import { PROTOCOL_COLORS } from '@/lib/constants'

const INITIAL_DURATION_MS = 24 * 60 * 60 * 1000

export default function MtrDetailPage() {
  const { t } = useTranslation()
  const { taskUuid } = useParams()
  const navigate = useNavigate()
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const { data: taskData, isLoading: taskLoading } = useTask(taskUuid ?? '')
  const { data: taskAgentsData } = useTaskAgents(taskUuid ?? '')

  const task = taskData as TaskResponse | undefined
  const taskAgents = (taskAgentsData ?? []) as AgentResponse[]

  const [selectedAgentUuid, setSelectedAgentUuid] = useState<string>('')
  const [selectedResultUuid, setSelectedResultUuid] = useState<string | undefined>()

  const [now] = useState(() => Date.now())
  const [timeRange, setTimeRange] = useState<{ start: number; end: number; granularity: 'raw' | 'hourly' | 'daily' }>({
    start: now - INITIAL_DURATION_MS,
    end: now,
    granularity: 'raw',
  })

  // Single agent mode
  const {
    data: mtrListData,
    isLoading: mtrListLoading,
  } = useMtrList(
    taskUuid ?? '',
    selectedAgentUuid || undefined,
    { start: timeRange.start, end: timeRange.end }
  )

  // Selected detail
  const {
    data: mtrDetailData,
    isLoading: mtrDetailLoading,
  } = useMtrDetail(selectedResultUuid ?? '')

  const handleTimeRangeChange = useCallback(
    (range: { start: number; end: number; granularity: 'raw' | 'hourly' | 'daily' }) => {
      setTimeRange(range)
    },
    [],
  )

  const handleSelectResult = useCallback(
    (resultUuid: string) => {
      setSelectedResultUuid(resultUuid)
    },
    [],
  )

  if (taskLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-40 w-full mb-4" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  if (!task) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-6">{t('monitoring.mtrTitle')}</h1>
        <div className="glass-light rounded-xl p-6 text-center">
          <p className="text-red-400 text-sm">{t('monitoring.taskNotFound')}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/monitoring')}>
            {t('common.back')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/monitoring')}
            className="text-text-muted hover:text-text-primary transition-colors text-sm"
          >
            {t('monitoring.title')} /
          </button>
          <h1 className="text-2xl font-bold text-text-primary">{task.task_name}</h1>
          <Badge className={`border text-xs uppercase ${PROTOCOL_COLORS[task.protocol] ?? ''}`}>
            MTR
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary font-[family-name:var(--font-mono)]">
            {task.target}{task.port ? `:${task.port}` : ''}
          </span>
          {isAdmin && (
            <Button
              className="bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 border-none text-sm"
              onClick={() => navigate(`/tasks/${task.task_uuid}`)}
            >
              {t('tasks.manageTask')}
            </Button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{t('monitoring.agent')}:</span>
          <Select
            value={selectedAgentUuid}
            onValueChange={(val) => {
              setSelectedAgentUuid(val ?? '')
              setSelectedResultUuid(undefined)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('monitoring.allAgents')}>
                {(value: string | null) => {
                  if (!value) return t('monitoring.allAgents')
                  const agent = taskAgents.find((a) => a.agent_uuid === value)
                  return agent?.agent_name ?? t('monitoring.allAgents')
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('monitoring.allAgents')}</SelectItem>
              {taskAgents.map((agent) => (
                <SelectItem key={agent.agent_uuid} value={agent.agent_uuid}>
                  {agent.agent_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-4">
        <MtrTimeline
          results={mtrListData?.results ?? []}
          isLoading={mtrListLoading}
          onSelectResult={handleSelectResult}
          selectedResultUuid={selectedResultUuid}
          height={180}
        />
      </div>

      {/* Detail Table */}
      <MtrDetailTable
        result={selectedResultUuid ? mtrDetailData : undefined}
        isLoading={selectedResultUuid ? mtrDetailLoading : false}
      />
    </div>
  )
}
