import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useResultIngestionEvents } from '@/api/hooks/admin-api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime } from '@/features/admin/utils'

const PAGE_SIZE = 50

function eventStatusLabel(status: string | null, allStatusesLabel: string) {
  if (status === 'processed') return 'processed'
  if (status === 'duplicate') return 'duplicate'
  if (status === 'failed') return 'failed'
  return allStatusesLabel
}

function statusVariant(status: string) {
  if (status === 'processed') return 'success'
  if (status === 'failed') return 'destructive'
  if (status === 'duplicate') return 'warning'
  return 'secondary'
}

export default function ResultIngestionEventsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [messageId, setMessageId] = useState('')
  const [status, setStatus] = useState('all')
  const eventsQuery = useResultIngestionEvents({
    page,
    page_size: PAGE_SIZE,
    message_id: messageId,
    status,
  })
  const events = eventsQuery.data?.items ?? []
  const pagination = eventsQuery.data?.pagination

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('results.title')}</h1>
        <p className="text-sm text-text-muted">{t('results.description')}</p>
      </div>

      <div className="glass-light rounded-xl p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            value={messageId}
            onChange={(event) => {
              setMessageId(event.target.value)
              setPage(1)
            }}
            placeholder={t('results.searchPlaceholder')}
            className="md:max-w-md"
          />
          <Select value={status} onValueChange={(value) => {
            setStatus(value ?? 'all')
            setPage(1)
          }}>
            <SelectTrigger aria-label={t('results.status')} className="w-full md:w-44">
              <SelectValue>
                {(value: string | null) => eventStatusLabel(value, t('results.allStatuses'))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('results.allStatuses')}</SelectItem>
              <SelectItem value="processed">processed</SelectItem>
              <SelectItem value="duplicate">duplicate</SelectItem>
              <SelectItem value="failed">failed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void eventsQuery.refetch()}>{t('results.refresh')}</Button>
        </div>

        {eventsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}
          </div>
        ) : eventsQuery.error ? (
          <div className="p-6 text-center text-sm text-red-400">{t('results.failedToLoad')}</div>
        ) : events.length === 0 ? (
          <div className="p-6 text-center text-sm text-text-muted">{t('results.empty')}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('results.message')}</TableHead>
                <TableHead>{t('results.relatedObjects')}</TableHead>
                <TableHead>{t('results.reasonOrError')}</TableHead>
                <TableHead>{t('results.receivedAt')}</TableHead>
                <TableHead>{t('results.updatedAt')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.event_uuid} className="border-white/5 hover:bg-white/5">
                  <TableCell>
                    <Badge variant={statusVariant(event.status)}>{event.status}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[320px] whitespace-normal text-sm text-text-secondary">
                    <div className="font-[family-name:var(--font-mono)]">{event.message_id ?? '-'}</div>
                    <div className="text-xs text-text-muted">{event.message_type ?? event.subject ?? '-'}</div>
                  </TableCell>
                  <TableCell className="text-xs text-text-secondary">
                    <div>task: {event.task_uuid ?? '-'}</div>
                    <div>agent: {event.agent_uuid ?? '-'}</div>
                    <div>result: {event.result_uuid ?? '-'}</div>
                  </TableCell>
                  <TableCell className="max-w-[360px] whitespace-normal text-sm text-text-secondary">
                    {event.error_message ?? event.reason ?? '-'}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">{formatDateTime(event.received_at)}</TableCell>
                  <TableCell className="text-sm text-text-secondary">{formatDateTime(event.updated_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {pagination && pagination.total_pages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-2 text-sm text-text-muted">
            <span>{t('results.pagination', { page: pagination.page, totalPages: pagination.total_pages, total: pagination.total })}</span>
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>{t('common.previous')}</Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.total_pages} onClick={() => setPage((value) => value + 1)}>{t('common.next')}</Button>
          </div>
        )}
      </div>
    </div>
  )
}
