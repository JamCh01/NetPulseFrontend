import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAlertRules, useCreateAlertRule, useUpdateAlertRule, useDisableAlertRule } from '@/api/hooks/use-alerts'
import { useTasks } from '@/api/hooks/use-tasks'
import { useUsers } from '@/api/hooks/use-users'
import { useWebhooks } from '@/api/hooks/use-webhooks'
import { useAuthStore } from '@/stores/auth-store'
import { CheckableList, type CheckableListItem } from '@/components/ui/checkable-list'
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
import { ErrorState } from '@/components/ui/error-state'
import { Pagination } from '@/components/ui/pagination'
import type { AlertRuleResponse, TaskResponse, UserResponse, WebhookResponse, MetricTypeEnum, OperatorEnum, PaginatedResponseAlertRuleResponse, PaginatedResponseTaskResponse, PaginatedResponseUserResponse, PaginatedResponseWebhookResponse } from '@/api/generated/types.gen'

const METRIC_COLORS: Record<string, string> = {
  latency: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  jitter: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  packet_loss: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
}

const OPERATOR_LABELS: Record<string, string> = {
  gt: '>',
  lt: '<',
  gte: '>=',
  lte: '<=',
}

const PAGE_SIZE = 50

export default function AlertsPage() {
  const { t } = useTranslation()
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const currentUserUuid = useAuthStore((s) => s.user?.uuid)
  const [page, setPage] = useState(1)
  const { data, isLoading, error, refetch } = useAlertRules({ skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE })
  const { data: tasksData, isLoading: tasksLoading } = useTasks({ limit: 200 })
  const { data: usersData } = useUsers(isAdmin ? { limit: 100 } : undefined)
  const { data: webhooksData } = useWebhooks({ limit: 100 })

  const createAlertRule = useCreateAlertRule()
  const updateAlertRule = useUpdateAlertRule()
  const disableAlertRule = useDisableAlertRule()

  const rules = ((data as PaginatedResponseAlertRuleResponse)?.items ?? []) as AlertRuleResponse[]
  const totalPages = Math.ceil(((data as PaginatedResponseAlertRuleResponse)?.total ?? 0) / PAGE_SIZE)
  const tasks = ((tasksData as PaginatedResponseTaskResponse)?.items ?? []) as TaskResponse[]
  const users = ((usersData as PaginatedResponseUserResponse)?.items ?? []) as UserResponse[]
  const webhooks = ((webhooksData as PaginatedResponseWebhookResponse)?.items ?? []) as WebhookResponse[]

  const webhookItems: CheckableListItem[] = webhooks.map(w => ({
    id: w.webhook_uuid,
    label: w.name,
    sublabel: w.url,
    disabled: !w.is_active,
  }))

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [ruleName, setRuleName] = useState('')
  const [taskUuid, setTaskUuid] = useState('')
  const [metricType, setMetricType] = useState<MetricTypeEnum>('latency')
  const [operator, setOperator] = useState<OperatorEnum>('gt')
  const [threshold, setThreshold] = useState('')
  const [mCount, setMCount] = useState('3')
  const [nCount, setNCount] = useState('5')
  const [webhookUuids, setWebhookUuids] = useState<Set<string>>(new Set())

  // Edit dialog state
  const [editUuid, setEditUuid] = useState<string | null>(null)
  const editTarget = editUuid ? rules.find((r) => r.rule_uuid === editUuid) : null
  const [editRuleName, setEditRuleName] = useState('')
  const [editMetricType, setEditMetricType] = useState<MetricTypeEnum>('latency')
  const [editOperator, setEditOperator] = useState<OperatorEnum>('gt')
  const [editThreshold, setEditThreshold] = useState('')
  const [editMCount, setEditMCount] = useState('3')
  const [editNCount, setEditNCount] = useState('5')
  const [editWebhookUuids, setEditWebhookUuids] = useState<Set<string>>(new Set())

  // Delete dialog state
  const [deleteUuid, setDeleteUuid] = useState<string | null>(null)

  const openEditDialog = (rule: AlertRuleResponse) => {
    setEditRuleName(rule.rule_name)
    setEditMetricType(rule.metric_type as MetricTypeEnum)
    setEditOperator(rule.operator as OperatorEnum)
    setEditThreshold(String(rule.threshold))
    setEditMCount(String(rule.m_count))
    setEditNCount(String(rule.n_count))
    setEditWebhookUuids(new Set((rule as any).webhook_uuids ?? []))
    setEditUuid(rule.rule_uuid)
  }

  const resetCreateForm = () => {
    setRuleName('')
    setTaskUuid('')
    setMetricType('latency')
    setOperator('gt')
    setThreshold('')
    setMCount('3')
    setNCount('5')
    setWebhookUuids(new Set())
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createAlertRule.mutate(
      {
        rule_name: ruleName,
        task_uuid: taskUuid,
        metric_type: metricType,
        operator,
        threshold: Number(threshold),
        m_count: Number(mCount),
        n_count: Number(nCount),
        webhook_uuids: Array.from(webhookUuids),
      },
      {
        onSuccess: () => {
          setCreateOpen(false)
          resetCreateForm()
          toast.success(t('alerts.createSuccess') || 'Alert rule created successfully')
        },
        onError: () => {
          toast.error(t('alerts.createFailed') || 'Failed to create alert rule')
        },
      },
    )
  }

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUuid) return
    updateAlertRule.mutate(
      {
        uuid: editUuid,
        data: {
          rule_name: editRuleName,
          operator: editOperator,
          threshold: Number(editThreshold),
          m_count: Number(editMCount),
          n_count: Number(editNCount),
          webhook_uuids: Array.from(editWebhookUuids),
        } as any,
      },
      {
        onSuccess: () => {
          setEditUuid(null)
          toast.success(t('alerts.updateSuccess') || 'Alert rule updated successfully')
        },
        onError: () => {
          toast.error(t('alerts.updateFailed') || 'Failed to update alert rule')
        },
      },
    )
  }

  const handleToggleActive = (rule: AlertRuleResponse) => {
    updateAlertRule.mutate(
      {
        uuid: rule.rule_uuid,
        data: { is_active: !rule.is_active },
      },
      {
        onSuccess: () => {
          toast.success(
            rule.is_active
              ? t('alerts.disabledSuccess') || 'Alert rule disabled'
              : t('alerts.enabledSuccess') || 'Alert rule enabled'
          )
        },
        onError: () => {
          toast.error(t('alerts.updateFailed') || 'Failed to update alert rule state')
        },
      }
    )
  }

  const handleDelete = () => {
    if (!deleteUuid) return
    disableAlertRule.mutate(deleteUuid, {
      onSuccess: () => {
        setDeleteUuid(null)
        toast.success(t('alerts.deleteSuccess') || 'Alert rule deleted successfully')
      },
      onError: () => {
        toast.error(t('alerts.deleteFailed') || 'Failed to delete alert rule')
      },
    })
  }

  const getTaskName = (uuid: string): string => {
    if (tasksLoading) return '…'
    const found = tasks.find((task) => task.task_uuid === uuid)
    return found?.task_name ?? t('alerts.unknownTask')
  }

  const getUserName = (uuid: string): string => {
    const found = users.find((u) => u.user_uuid === uuid)
    return found?.username ?? uuid.slice(0, 8)
  }

  const canManageRule = (rule: AlertRuleResponse): boolean => {
    if (isAdmin) return true
    return rule.user_uuid === currentUserUuid
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t('alerts.title')}</h1>
        <Button
          onClick={() => setCreateOpen(true)}
        >
          {t('alerts.createRule')}
        </Button>
      </div>

      <div className="glass-light rounded-xl p-1">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6">
            <ErrorState
              title={t('alerts.failedToLoad')}
              description="请检查网络连接，或稍后重试。"
              onRetry={() => { void refetch() }}
              retryLabel="重试加载"
            />
          </div>
        ) : rules.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-text-muted text-sm">{t('alerts.noRules')}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('alerts.ruleName')}</TableHead>
                    <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('alerts.task')}</TableHead>
                    <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('alerts.metric')}</TableHead>
                    <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('alerts.condition')}</TableHead>
                    <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('alerts.mnStrategy')}</TableHead>
                    <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.status')}</TableHead>
                    {isAdmin && (
                      <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.owner')}</TableHead>
                    )}
                    <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.rule_uuid} className="border-white/5 hover:bg-white/5">
                      <TableCell className="text-text-primary font-medium">
                        {rule.rule_name}
                      </TableCell>
                      <TableCell className="text-text-secondary text-sm">
                        {getTaskName(rule.task_uuid)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`border text-xs ${METRIC_COLORS[rule.metric_type] ?? ''}`}>
                          {rule.metric_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-text-secondary text-sm font-[family-name:var(--font-mono)]">
                        {OPERATOR_LABELS[rule.operator] ?? rule.operator} {rule.threshold}
                      </TableCell>
                      <TableCell className="text-text-secondary text-sm font-[family-name:var(--font-mono)]">
                        {rule.m_count}/{rule.n_count}
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.is_active ? 'success' : 'inactive'}>
                          {rule.is_active ? t('common.active') : t('common.inactive')}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-text-secondary text-xs">
                          {getUserName(rule.user_uuid)}
                        </TableCell>
                      )}
                      <TableCell>
                        {canManageRule(rule) && (
                          <div className="flex items-center gap-1">
                            {rule.is_active && (
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => openEditDialog(rule)}
                                className="text-text-muted hover:text-text-primary"
                              >
                                {t('common.edit')}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleToggleActive(rule)}
                              className="text-text-muted hover:text-text-primary"
                            >
                              {rule.is_active ? t('common.disable') : t('common.enable')}
                            </Button>
                            {rule.is_active && (
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => setDeleteUuid(rule.rule_uuid)}
                                className="text-status-error-fg hover:opacity-80"
                              >
                                {t('common.delete')}
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden flex flex-col divide-y divide-white/5">
              {rules.map((rule) => (
                <div key={rule.rule_uuid} className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-text-primary font-medium text-sm">{rule.rule_name}</span>
                      <span className="text-text-secondary text-xs mt-0.5">{getTaskName(rule.task_uuid)}</span>
                    </div>
                    <Badge variant={rule.is_active ? 'success' : 'inactive'} className="text-[10px]">
                      {rule.is_active ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex flex-col gap-1 bg-white/5 p-2 rounded-md">
                      <span className="text-text-muted text-[10px] uppercase">{t('alerts.metric')}</span>
                      <Badge className={`border text-[10px] w-fit ${METRIC_COLORS[rule.metric_type] ?? ''}`}>
                        {rule.metric_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1 bg-white/5 p-2 rounded-md">
                      <span className="text-text-muted text-[10px] uppercase">{t('alerts.condition')}</span>
                      <span className="text-text-secondary font-mono">
                        {OPERATOR_LABELS[rule.operator] ?? rule.operator} {rule.threshold}
                      </span>
                    </div>
                  </div>

                  {canManageRule(rule) && (
                    <div className="flex items-center justify-end gap-2 mt-2">
                      {rule.is_active && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => openEditDialog(rule)}
                          className="text-text-muted hover:text-text-primary"
                        >
                          {t('common.edit')}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleToggleActive(rule)}
                        className="text-text-muted hover:text-text-primary"
                      >
                        {rule.is_active ? t('common.disable') : t('common.enable')}
                      </Button>
                      {rule.is_active && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setDeleteUuid(rule.rule_uuid)}
                          className="text-status-error-fg hover:opacity-80"
                        >
                          {t('common.delete')}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={isLoading} />

      {/* Create Rule Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('alerts.dialogTitle')}</DialogTitle>
            <DialogDescription>{t('alerts.dialogDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('alerts.ruleName')}</Label>
              <Input
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder={t('alerts.ruleNamePlaceholder')}
                required
              />
            </div>
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('alerts.task')}</Label>
              <Select value={taskUuid} onValueChange={(val) => setTaskUuid(val ?? '')}>
                <SelectTrigger className="w-full" disabled={tasks.length === 0}>
                  <SelectValue placeholder={tasks.length === 0 ? t('alerts.noTasksAvailable') : t('alerts.selectTask')}>
                    {(value: string | null) => value ? getTaskName(value) : (tasks.length === 0 ? t('alerts.noTasksAvailable') : t('alerts.selectTask'))}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.task_uuid} value={task.task_uuid}>
                      {task.task_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('alerts.metricType')}</Label>
              <Select value={metricType} onValueChange={(v) => setMetricType(v as MetricTypeEnum)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latency">{t('alerts.latency')}</SelectItem>
                  <SelectItem value="jitter">{t('alerts.jitter')}</SelectItem>
                  <SelectItem value="packet_loss">{t('alerts.packetLoss')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-text-secondary mb-1.5">{t('alerts.operator')}</Label>
                <Select value={operator} onValueChange={(v) => setOperator(v as OperatorEnum)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gt">{t('alerts.gt')}</SelectItem>
                    <SelectItem value="lt">{t('alerts.lt')}</SelectItem>
                    <SelectItem value="gte">{t('alerts.gte')}</SelectItem>
                    <SelectItem value="lte">{t('alerts.lte')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-text-secondary mb-1.5">{t('alerts.threshold')}</Label>
                <Input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder={t('alerts.thresholdPlaceholder')}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-text-secondary mb-1.5">{t('alerts.mTriggers')}</Label>
                <Input
                  type="number"
                  value={mCount}
                  onChange={(e) => setMCount(e.target.value)}
                  min="1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs text-text-secondary mb-1.5">{t('alerts.nWindow')}</Label>
                <Input
                  type="number"
                  value={nCount}
                  onChange={(e) => setNCount(e.target.value)}
                  min="1"
                  required
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('alerts.webhooksOptional')}</Label>
              <CheckableList
                items={webhookItems}
                selectedIds={webhookUuids}
                onToggle={(id) => {
                  const next = new Set(webhookUuids)
                  if (next.has(id)) next.delete(id)
                  else next.add(id)
                  setWebhookUuids(next)
                }}
                emptyMessage={t('alerts.noWebhooksAvailable')}
                maxHeight="max-h-32"
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={createAlertRule.isPending || !taskUuid || !ruleName.trim()}
              >
                {createAlertRule.isPending ? t('common.creating') : t('alerts.createRule')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Rule Dialog */}
      <Dialog open={editUuid !== null} onOpenChange={(open) => { if (!open) setEditUuid(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('alerts.editRule')}</DialogTitle>
            <DialogDescription>{t('alerts.editRuleDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('alerts.ruleName')}</Label>
              <Input
                value={editRuleName}
                onChange={(e) => setEditRuleName(e.target.value)}
                placeholder={t('alerts.ruleNamePlaceholder')}
                required
              />
            </div>
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('alerts.task')}</Label>
              <Input
                value={editTarget ? getTaskName(editTarget.task_uuid) : ''}
                disabled
                className="opacity-60"
              />
            </div>
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('alerts.metricType')}</Label>
              <Input
                value={editMetricType.replace('_', ' ')}
                disabled
                className="opacity-60 capitalize"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-text-secondary mb-1.5">{t('alerts.operator')}</Label>
                <Select value={editOperator} onValueChange={(v) => setEditOperator(v as OperatorEnum)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gt">{t('alerts.gt')}</SelectItem>
                    <SelectItem value="lt">{t('alerts.lt')}</SelectItem>
                    <SelectItem value="gte">{t('alerts.gte')}</SelectItem>
                    <SelectItem value="lte">{t('alerts.lte')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-text-secondary mb-1.5">{t('alerts.threshold')}</Label>
                <Input
                  type="number"
                  value={editThreshold}
                  onChange={(e) => setEditThreshold(e.target.value)}
                  placeholder={t('alerts.thresholdPlaceholder')}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-text-secondary mb-1.5">{t('alerts.mTriggers')}</Label>
                <Input
                  type="number"
                  value={editMCount}
                  onChange={(e) => setEditMCount(e.target.value)}
                  min="1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs text-text-secondary mb-1.5">{t('alerts.nWindow')}</Label>
                <Input
                  type="number"
                  value={editNCount}
                  onChange={(e) => setEditNCount(e.target.value)}
                  min="1"
                  required
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('alerts.webhooksOptional')}</Label>
              <CheckableList
                items={webhookItems}
                selectedIds={editWebhookUuids}
                onToggle={(id) => {
                  const next = new Set(editWebhookUuids)
                  if (next.has(id)) next.delete(id)
                  else next.add(id)
                  setEditWebhookUuids(next)
                }}
                emptyMessage={t('alerts.noWebhooksAvailable')}
                maxHeight="max-h-32"
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={updateAlertRule.isPending || !editRuleName.trim()}
              >
                {updateAlertRule.isPending ? t('alerts.updatingRule') : t('alerts.updateRule')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteUuid !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteUuid(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('alerts.deleteRule')}</DialogTitle>
            <DialogDescription>
              {t('alerts.deleteConfirm')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUuid(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={disableAlertRule.isPending}
            >
              {disableAlertRule.isPending ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

