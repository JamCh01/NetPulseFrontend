import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuditLogs } from '@/api/hooks/use-audit'
import { useUsers } from '@/api/hooks/use-users'
import { formatDateTime } from '@/lib/format'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/ui/pagination'
import type { UserResponse } from '@/api/generated/types.gen'

interface AuditLog {
  log_uuid: string
  actor_uuid: string | null
  actor_role: string
  action: string
  resource_type: string
  resource_uuid: string | null
  ip_address: string | null
  details: Record<string, unknown> | null
  created_at: string
}

const PAGE_SIZE = 50

const RESOURCE_TYPES = ['agent', 'task', 'alert_rule', 'webhook', 'user', 'group']

export default function AuditPage() {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(1)
  const [actorFilter, setActorFilter] = useState<string | null>(null)
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string | null>(null)
  const [actionFilter, setActionFilter] = useState('')

  const { data, isLoading, error } = useAuditLogs({
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    actor_uuid: actorFilter,
    resource_type: resourceTypeFilter,
    action: actionFilter || null,
  })
  const { data: usersData } = useUsers({ limit: 100 })

  const paginatedData = data as { items?: AuditLog[]; total?: number } | undefined
  const logs = (paginatedData?.items ?? []) as AuditLog[]
  const total = paginatedData?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const users = ((usersData as { items?: UserResponse[] })?.items ?? []) as UserResponse[]

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const getUserName = (uuid: string | null): string => {
    if (!uuid) return '-'
    const found = users.find((u) => u.user_uuid === uuid)
    return found?.username ?? uuid.slice(0, 8)
  }

  const toggleDetails = (uuid: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(uuid)) {
        next.delete(uuid)
      } else {
        next.add(uuid)
      }
      return next
    })
  }

  const handleActorChange = (value: string | null) => {
    setActorFilter(!value || value === '__all__' ? null : value)
    setPage(1)
  }

  const handleResourceTypeChange = (value: string | null) => {
    setResourceTypeFilter(!value || value === '__all__' ? null : value)
    setPage(1)
  }

  const handleActionChange = (value: string) => {
    setActionFilter(value)
    setPage(1)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t('audit.title')}</h1>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <Select value={actorFilter ?? '__all__'} onValueChange={handleActorChange}>
          <SelectTrigger className="w-48">
            <SelectValue>
              {(value: string | null) => value && value !== '__all__' ? getUserName(value) : t('audit.allActors')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('audit.allActors')}</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.user_uuid} value={u.user_uuid}>
                {u.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={resourceTypeFilter ?? '__all__'} onValueChange={handleResourceTypeChange}>
          <SelectTrigger className="w-48">
            <SelectValue>
              {(value: string | null) => value && value !== '__all__' ? value : t('audit.allResourceTypes')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('audit.allResourceTypes')}</SelectItem>
            {RESOURCE_TYPES.map((rt) => (
              <SelectItem key={rt} value={rt}>
                {rt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={actionFilter}
          onChange={(e) => handleActionChange(e.target.value)}
          placeholder={t('audit.filterAction')}
          className="w-48"
        />
      </div>

      {/* Table */}
      <div className="glass-light rounded-xl p-1">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-400 text-sm">{t('audit.failedToLoad')}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-text-muted text-sm">{t('audit.noLogs')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('audit.action')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('audit.resourceType')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('audit.actor')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('audit.ipAddress')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('audit.details')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.createdAt')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.log_uuid} className="border-white/5 hover:bg-white/5">
                  <TableCell className="text-text-primary font-medium text-xs">{log.action}</TableCell>
                  <TableCell className="text-text-secondary text-xs">{log.resource_type}</TableCell>
                  <TableCell className="text-text-secondary text-xs">{getUserName(log.actor_uuid)}</TableCell>
                  <TableCell className="text-text-secondary text-xs font-mono">{log.ip_address ?? '-'}</TableCell>
                  <TableCell>
                    {log.details ? (
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 px-2 text-text-muted hover:text-text-primary"
                          onClick={() => toggleDetails(log.log_uuid)}
                        >
                          {expandedRows.has(log.log_uuid) ? t('audit.hideDetails') : t('audit.showDetails')}
                        </Button>
                        {expandedRows.has(log.log_uuid) && (
                          <pre className="mt-2 p-2 rounded-lg bg-white/5 border border-white/10 text-xs text-text-secondary font-mono overflow-x-auto max-w-md">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    ) : (
                      <span className="text-text-dim text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-text-secondary text-xs font-mono">
                    {formatDateTime(log.created_at, i18n.language)}
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
