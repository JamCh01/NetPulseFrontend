import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  useWebhooks,
  useDeleteWebhook,
  useUpdateWebhook,
  useTestWebhook,
  useRotateSecret,
  useWebhookDeliveries,
  useRetryDelivery,
} from '@/api/hooks/use-webhooks'
import { useUsers } from '@/api/hooks/use-users'
import { formatDateTime } from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/ui/pagination'
import { WebhookFormDialog } from '@/features/webhooks/components/webhook-form-dialog'
import type { WebhookResponse, WebhookDeliveryResponse, UserResponse, PaginatedResponseWebhookResponse, PaginatedResponseWebhookDeliveryResponse, PaginatedResponseUserResponse } from '@/api/generated/types.gen'

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-status-success-bg text-status-success-fg border-status-success-border',
  failed: 'bg-status-error-bg text-status-error-fg border-status-error-border',
  pending: 'bg-status-warning-bg text-status-warning-fg border-status-warning-border',
}

const PAGE_SIZE = 50

export default function WebhooksPage() {
  const { t } = useTranslation()
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const currentUserUuid = useAuthStore((s) => s.user?.uuid)
  const [page, setPage] = useState(1)
  const { data, isLoading, error } = useWebhooks({ skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE })
  const { data: usersData } = useUsers(isAdmin ? { limit: 100 } : undefined)
  const deleteWebhook = useDeleteWebhook()
  const updateWebhook = useUpdateWebhook()
  const testWebhook = useTestWebhook()
  const rotateSecret = useRotateSecret()

  const webhooks = ((data as PaginatedResponseWebhookResponse)?.items ?? []) as WebhookResponse[]
  const totalPages = Math.ceil(((data as PaginatedResponseWebhookResponse)?.total ?? 0) / PAGE_SIZE)
  const users = ((usersData as PaginatedResponseUserResponse)?.items ?? []) as UserResponse[]

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)

  // Edit dialog
  const [editUuid, setEditUuid] = useState<string | null>(null)
  const editTarget = editUuid ? webhooks.find((w) => w.webhook_uuid === editUuid) : null

  // Secret dialog (shown after create or rotate)
  const [secretDialogOpen, setSecretDialogOpen] = useState(false)
  const [shownSecret, setShownSecret] = useState('')
  const [copied, setCopied] = useState(false)

  // Delete dialog
  const [deleteUuid, setDeleteUuid] = useState<string | null>(null)
  const deleteTarget = deleteUuid ? webhooks.find((w) => w.webhook_uuid === deleteUuid) : null

  // Rotate dialog
  const [rotateUuid, setRotateUuid] = useState<string | null>(null)
  const rotateTarget = rotateUuid ? webhooks.find((w) => w.webhook_uuid === rotateUuid) : null

  // Deliveries panel
  const [deliveriesUuid, setDeliveriesUuid] = useState<string | null>(null)

  const getUserName = (uuid: string): string => {
    const found = users.find((u) => u.user_uuid === uuid)
    return found?.username ?? uuid.slice(0, 8)
  }

  const canManageWebhook = (wh: WebhookResponse): boolean => {
    if (isAdmin) return true
    return wh.user_uuid === currentUserUuid
  }

  const handleDelete = () => {
    if (!deleteUuid) return
    deleteWebhook.mutate(deleteUuid, {
      onSuccess: () => {
        setDeleteUuid(null)
        toast.success(t('webhooks.deleteSuccess') || 'Webhook deleted successfully')
      },
      onError: () => {
        toast.error(t('webhooks.deleteFailed') || 'Failed to delete webhook')
      },
    })
  }

  const handleToggleActive = (wh: WebhookResponse) => {
    updateWebhook.mutate(
      { uuid: wh.webhook_uuid, data: { is_active: !wh.is_active } },
      {
        onSuccess: () => {
          toast.success(
            wh.is_active
              ? t('webhooks.disabledSuccess') || 'Webhook disabled'
              : t('webhooks.enabledSuccess') || 'Webhook enabled'
          )
        },
        onError: () => {
          toast.error(t('webhooks.updateFailed') || 'Failed to update webhook')
        },
      }
    )
  }

  const handleTest = (uuid: string) => {
    testWebhook.mutate(uuid, {
      onSuccess: () => {
        toast.success(t('webhooks.testSuccess') || 'Test webhook triggered successfully')
      },
      onError: () => {
        toast.error(t('webhooks.testFailed') || 'Test webhook trigger failed')
      },
    })
  }

  const handleRotate = () => {
    if (!rotateUuid) return
    rotateSecret.mutate(rotateUuid, {
      onSuccess: (result) => {
        setRotateUuid(null)
        const res = result as { secret?: string }
        if (res?.secret) {
          setShownSecret(res.secret)
          setSecretDialogOpen(true)
        }
        toast.success(t('webhooks.rotateSuccess') || 'Secret rotated successfully')
      },
      onError: () => {
        toast.error(t('webhooks.rotateFailed') || 'Failed to rotate secret')
      },
    })
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shownSecret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard not available */ }
  }

  const handleSecretReceived = (secret: string) => {
    setShownSecret(secret)
    setSecretDialogOpen(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t('webhooks.title')}</h1>
        <Button
          onClick={() => setCreateOpen(true)}
        >
          {t('webhooks.createWebhook')}
        </Button>
      </div>

      {/* Webhook list */}
      <div className="glass-light rounded-xl p-1">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-status-error-fg text-sm">{t('webhooks.failedToLoad')}</p>
          </div>
        ) : webhooks.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-text-muted text-sm">{t('webhooks.noWebhooks')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.name')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('webhooks.url')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.status')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('webhooks.consecutiveFailures')}</TableHead>
                {isAdmin && (
                  <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.owner')}</TableHead>
                )}
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((wh) => (
                <TableRow key={wh.webhook_uuid} className="border-white/5 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-text-primary font-medium">{wh.name}</span>
                      {wh.body_template && (
                        <span className="text-[9px] px-1 py-px rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          {t('webhooks.hasTemplate')}
                        </span>
                      )}
                      {wh.custom_headers && Object.keys(wh.custom_headers).length > 0 && (
                        <span className="text-[9px] px-1 py-px rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {t('webhooks.hasHeaders')}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-text-secondary text-xs font-mono max-w-[240px] truncate">{wh.url}</TableCell>
                  <TableCell>
                    <Badge variant={wh.is_active ? 'success' : 'inactive'}>
                      {wh.is_active ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-mono ${wh.consecutive_failures > 0 ? 'text-status-error-fg' : 'text-text-dim'}`}>
                      {wh.consecutive_failures}
                    </span>
                    {wh.consecutive_failures >= 100 && (
                      <Badge variant="warning" className="ml-1 text-[9px]">
                        {t('webhooks.autoDisabled')}
                      </Badge>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-text-secondary text-xs">
                      {getUserName(wh.user_uuid)}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {canManageWebhook(wh) && (
                        <>
                          <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-text-muted hover:text-text-primary"
                            onClick={() => setEditUuid(wh.webhook_uuid)}
                          >
                            {t('common.edit')}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-text-muted hover:text-text-primary"
                            onClick={() => handleTest(wh.webhook_uuid)}
                            disabled={testWebhook.isPending}
                          >
                            {t('webhooks.test')}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-text-muted hover:text-text-primary"
                            onClick={() => setDeliveriesUuid(wh.webhook_uuid)}
                          >
                            {t('webhooks.deliveries')}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-status-warning-fg hover:opacity-80"
                            onClick={() => setRotateUuid(wh.webhook_uuid)}
                          >
                            {t('webhooks.rotateSecret')}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-text-muted hover:text-text-primary"
                            onClick={() => handleToggleActive(wh)}
                          >
                            {wh.is_active ? t('common.disable') : t('common.enable')}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-status-error-fg hover:opacity-80"
                            onClick={() => setDeleteUuid(wh.webhook_uuid)}
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

      {/* Create Dialog */}
      <WebhookFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSecretReceived={handleSecretReceived}
      />

      {/* Edit Dialog */}
      <WebhookFormDialog
        mode="edit"
        webhook={editTarget}
        open={editUuid !== null}
        onOpenChange={(open) => { if (!open) setEditUuid(null) }}
      />

      {/* Secret Dialog */}
      <Dialog open={secretDialogOpen} onOpenChange={setSecretDialogOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t('webhooks.secret')}</DialogTitle>
            <DialogDescription>{t('webhooks.secretDesc')}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-status-success-fg text-sm font-mono break-all">
              {shownSecret}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
              {copied ? t('common.copied') : t('common.copy')}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setSecretDialogOpen(false)} >
              {t('common.done')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteUuid !== null} onOpenChange={(open) => { if (!open) setDeleteUuid(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('webhooks.deleteWebhook')}</DialogTitle>
            <DialogDescription>{t('webhooks.deleteConfirm', { name: deleteTarget?.name ?? '' })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUuid(null)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteWebhook.isPending}>
              {deleteWebhook.isPending ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rotate Secret Confirmation */}
      <Dialog open={rotateUuid !== null} onOpenChange={(open) => { if (!open) setRotateUuid(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('webhooks.rotateSecret')}</DialogTitle>
            <DialogDescription>{t('webhooks.rotateConfirm', { name: rotateTarget?.name ?? '' })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRotateUuid(null)}>{t('common.cancel')}</Button>
            <Button onClick={handleRotate} disabled={rotateSecret.isPending} className="bg-status-warning-solid text-slate-950 hover:opacity-90 border-none">
              {rotateSecret.isPending ? t('common.loading') : t('webhooks.rotateSecret')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deliveries Panel */}
      <Dialog open={deliveriesUuid !== null} onOpenChange={(open) => { if (!open) setDeliveriesUuid(null) }}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('webhooks.deliveries')}</DialogTitle>
          </DialogHeader>
          {deliveriesUuid && <DeliveriesTable webhookUuid={deliveriesUuid} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

const DELIVERIES_PAGE_SIZE = 50

function DeliveriesTable({ webhookUuid }: { webhookUuid: string }) {
  const { t, i18n } = useTranslation()
  const [deliveryPage, setDeliveryPage] = useState(1)
  const { data, isLoading } = useWebhookDeliveries(webhookUuid, { skip: (deliveryPage - 1) * DELIVERIES_PAGE_SIZE, limit: DELIVERIES_PAGE_SIZE })
  const retryDelivery = useRetryDelivery()
  const deliveries = ((data as PaginatedResponseWebhookDeliveryResponse)?.items ?? []) as WebhookDeliveryResponse[]
  const deliveryTotalPages = Math.ceil(((data as PaginatedResponseWebhookDeliveryResponse)?.total ?? 0) / DELIVERIES_PAGE_SIZE)

  if (isLoading) {
    return <div className="space-y-2">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
  }

  if (deliveries.length === 0) {
    return <p className="text-text-muted text-sm py-4 text-center">{t('webhooks.noDeliveries')}</p>
  }

  return (
    <>
      <Table>
      <TableHeader>
        <TableRow className="border-white/5 hover:bg-transparent">
          <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('webhooks.eventType')}</TableHead>
          <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.status')}</TableHead>
          <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('webhooks.responseStatus')}</TableHead>
          <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('webhooks.responseTime')}</TableHead>
          <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('webhooks.attempt')}</TableHead>
          <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('webhooks.nextRetry')}</TableHead>
          <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.createdAt')}</TableHead>
          <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deliveries.map((d) => {
          const statusKey = d.status as keyof typeof STATUS_COLORS
          return (
            <TableRow key={d.delivery_uuid} className="border-white/5 hover:bg-white/5">
              <TableCell className="text-text-secondary text-xs font-mono">{d.event_type}</TableCell>
              <TableCell>
                <Badge className={`border text-xs ${STATUS_COLORS[statusKey] ?? STATUS_COLORS.pending}`}>
                  {t(`webhooks.delivery${d.status.charAt(0).toUpperCase() + d.status.slice(1)}` as never) as string}
                </Badge>
              </TableCell>
              <TableCell className="text-text-secondary text-xs font-mono">
                {d.response_status ?? '-'}
              </TableCell>
              <TableCell className="text-text-secondary text-xs font-mono">
                {d.response_time_ms != null ? `${d.response_time_ms}ms` : '-'}
              </TableCell>
              <TableCell className="text-text-secondary text-xs font-mono">{d.attempt} / 5</TableCell>
              <TableCell className="text-text-secondary text-xs font-mono">
                {(d as WebhookDeliveryResponse & { next_retry_at?: string | null }).next_retry_at && d.status === 'failed'
                  ? formatDateTime((d as WebhookDeliveryResponse & { next_retry_at?: string | null }).next_retry_at!, i18n.language)
                  : '-'
                }
              </TableCell>
              <TableCell className="text-text-secondary text-xs font-mono">
                {formatDateTime(d.created_at, i18n.language)}
              </TableCell>
              <TableCell>
                {d.status === 'failed' && (
                  (d as WebhookDeliveryResponse & { next_retry_at?: string | null }).next_retry_at ? (
                    <span className="text-[10px] text-status-warning-fg">{t('webhooks.waitingRetry')}</span>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-status-warning-fg hover:opacity-80"
                      onClick={() => retryDelivery.mutate({ webhookUuid, deliveryUuid: d.delivery_uuid }, {
                        onSuccess: () => {
                          toast.success(t('webhooks.retrySuccess') || 'Retry request dispatched')
                        },
                        onError: () => {
                          toast.error(t('webhooks.retryFailed') || 'Failed to retry delivery')
                        }
                      })}
                      disabled={retryDelivery.isPending}
                    >
                      {retryDelivery.isPending ? t('webhooks.retrying') : t('webhooks.retry')}
                    </Button>
                  )
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
      </Table>
      <Pagination page={deliveryPage} totalPages={deliveryTotalPages} onPageChange={setDeliveryPage} disabled={isLoading} />
    </>
  )
}

