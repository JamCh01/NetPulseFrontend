import { useState } from 'react'

import { useResultIngestionEvents } from '@/api/hooks/admin-api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime } from '@/features/admin/utils'

const PAGE_SIZE = 50

function statusVariant(status: string) {
  if (status === 'processed') return 'success'
  if (status === 'failed') return 'destructive'
  if (status === 'duplicate') return 'warning'
  return 'secondary'
}

export default function ResultIngestionEventsPage() {
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
        <h1 className="text-2xl font-bold text-text-primary">结果入库事件</h1>
        <p className="text-sm text-text-muted">通过 /api/v1/results/* 查看 NATS worker 的入库记录、重复消息和失败原因。</p>
      </div>

      <div className="glass-light rounded-xl p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            value={messageId}
            onChange={(event) => {
              setMessageId(event.target.value)
              setPage(1)
            }}
            placeholder="按 message_id 搜索"
            className="md:max-w-md"
          />
          <Select value={status} onValueChange={(value) => {
            setStatus(value ?? 'all')
            setPage(1)
          }}>
            <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="processed">processed</SelectItem>
              <SelectItem value="duplicate">duplicate</SelectItem>
              <SelectItem value="failed">failed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void eventsQuery.refetch()}>刷新</Button>
        </div>

        {eventsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}
          </div>
        ) : eventsQuery.error ? (
          <div className="p-6 text-center text-sm text-red-400">入库事件加载失败</div>
        ) : events.length === 0 ? (
          <div className="p-6 text-center text-sm text-text-muted">暂无入库事件</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead>状态</TableHead>
                <TableHead>消息</TableHead>
                <TableHead>关联对象</TableHead>
                <TableHead>原因 / 错误</TableHead>
                <TableHead>接收时间</TableHead>
                <TableHead>更新时间</TableHead>
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
            <span>第 {pagination.page} / {pagination.total_pages} 页，共 {pagination.total} 条</span>
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>上一页</Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.total_pages} onClick={() => setPage((value) => value + 1)}>下一页</Button>
          </div>
        )}
      </div>
    </div>
  )
}
