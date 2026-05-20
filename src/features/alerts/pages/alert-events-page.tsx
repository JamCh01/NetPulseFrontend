import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useAlertEvents } from '@/api/hooks/use-alert-events'
import { useAlertRules } from '@/api/hooks/use-alerts'
import { useTasks } from '@/api/hooks/use-tasks'
import { useAgents } from '@/api/hooks/use-agents'
import { formatDateTime } from '@/lib/format'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/ui/pagination'
import type {
  AlertEventResponse,
  AlertRuleResponse,
  TaskResponse,
  AgentResponse,
} from '@/api/generated/types.gen'

const PAGE_SIZE = 50

export default function AlertEventsPage() {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(1)
  const [ruleFilter, setRuleFilter] = useState<string | null>(null)
  const [taskFilter, setTaskFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const { data, isLoading, error } = useAlertEvents({
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    rule_uuid: ruleFilter,
    task_uuid: taskFilter,
    status: statusFilter,
  })
  const { data: rulesData } = useAlertRules({ limit: 200 })
  const { data: tasksData } = useTasks({ limit: 200 })
  const { data: agentsData } = useAgents({ limit: 200 })

  const paginatedData = data as { items?: AlertEventResponse[]; total?: number } | undefined
  const eventsApiUnsupported = Boolean((data as { __unsupported?: boolean } | undefined)?.__unsupported)
  const events = (paginatedData?.items ?? []) as AlertEventResponse[]
  const total = paginatedData?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const rules = ((rulesData as { items?: AlertRuleResponse[] })?.items ?? []) as AlertRuleResponse[]
  const tasks = ((tasksData as { items?: TaskResponse[] })?.items ?? tasksData ?? []) as TaskResponse[]
  const agents = ((agentsData as { items?: AgentResponse[] })?.items ?? agentsData ?? []) as AgentResponse[]

  const getRuleName = (uuid: string): string => {
    const found = rules.find((r) => r.rule_uuid === uuid)
    return found?.rule_name ?? uuid.slice(0, 8)
  }

  const getTaskName = (uuid: string): string => {
    const found = tasks.find((t) => t.task_uuid === uuid)
    return found?.task_name ?? uuid.slice(0, 8)
  }

  const getAgentName = (uuid: string): string => {
    const found = agents.find((a) => a.agent_uuid === uuid)
    return found?.agent_name ?? uuid.slice(0, 8)
  }

  const handleRuleChange = (value: string | null) => {
    setRuleFilter(!value || value === '__all__' ? null : value)
    setPage(1)
  }

  const handleTaskChange = (value: string | null) => {
    setTaskFilter(!value || value === '__all__' ? null : value)
    setPage(1)
  }

  const handleStatusChange = (value: string | null) => {
    setStatusFilter(!value || value === '__all__' ? null : value)
    setPage(1)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-primary">{t('alertEvents.title')}</h1>
          <Link to="/alerts">
            <Button variant="ghost" size="sm" className="text-xs text-text-muted hover:text-text-primary">
              {t('alertEvents.backToRules')}
            </Button>
          </Link>
        </div>
      </div>
      {eventsApiUnsupported && (
        <div className="mb-4 rounded-lg border border-status-warning-border bg-status-warning-bg px-3 py-2 text-xs text-status-warning-fg">
          Missing API: <code>/api/v1/alerts/events/</code>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <Select value={ruleFilter ?? '__all__'} onValueChange={handleRuleChange}>
          <SelectTrigger className="w-48">
            <SelectValue>
              {(value: string | null) => value && value !== '__all__' ? getRuleName(value) : t('alertEvents.allRules')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('alertEvents.allRules')}</SelectItem>
            {rules.map((r) => (
              <SelectItem key={r.rule_uuid} value={r.rule_uuid}>
                {r.rule_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={taskFilter ?? '__all__'} onValueChange={handleTaskChange}>
          <SelectTrigger className="w-48">
            <SelectValue>
              {(value: string | null) => value && value !== '__all__' ? getTaskName(value) : t('alertEvents.allTasks')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('alertEvents.allTasks')}</SelectItem>
            {tasks.map((task) => (
              <SelectItem key={task.task_uuid} value={task.task_uuid}>
                {task.task_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter ?? '__all__'} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue>
              {(value: string | null) => value && value !== '__all__' ? value : t('alertEvents.allStatuses')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('alertEvents.allStatuses')}</SelectItem>
            <SelectItem value="firing">{t('alertEvents.firing')}</SelectItem>
            <SelectItem value="resolved">{t('alertEvents.resolved')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass-light rounded-xl p-1">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-status-error-fg text-sm">{t('alertEvents.failedToLoad')}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-text-muted text-sm">{t('alertEvents.noEvents')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('alertEvents.ruleName')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('alertEvents.taskName')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('alertEvents.agentName')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('alertEvents.triggeredValue')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.status')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('alertEvents.triggeredAt')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('alertEvents.resolvedAt')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.event_uuid} className="border-white/5 hover:bg-white/5">
                  <TableCell className="text-text-primary font-medium text-xs">{getRuleName(event.rule_uuid)}</TableCell>
                  <TableCell className="text-text-secondary text-xs">{getTaskName(event.task_uuid)}</TableCell>
                  <TableCell className="text-text-secondary text-xs">{getAgentName(event.agent_uuid)}</TableCell>
                  <TableCell className="text-text-secondary text-xs font-mono">{event.triggered_value}</TableCell>
                  <TableCell>
                    <Badge variant={event.status === 'firing' ? 'error' : 'success'}>
                      {event.status === 'firing' ? t('alertEvents.firing') : t('alertEvents.resolved')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-text-secondary text-xs font-mono">
                    {formatDateTime(event.triggered_at, i18n.language)}
                  </TableCell>
                  <TableCell className="text-text-secondary text-xs font-mono">
                    {event.resolved_at ? formatDateTime(event.resolved_at, i18n.language) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        disabled={isLoading}
      />
    </div>
  )
}

