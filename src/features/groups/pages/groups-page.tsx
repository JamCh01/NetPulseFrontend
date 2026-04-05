import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGroups, useCreateGroup, useUpdateGroup, useDeleteGroup } from '@/api/hooks/use-groups'
import { formatDateTime } from '@/lib/format'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
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
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/ui/pagination'
import type { GroupResponse } from '@/api/generated/types.gen'

const PAGE_SIZE = 50

export default function GroupsPage() {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(1)
  const { data, isLoading, error } = useGroups({
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
  })
  const createGroup = useCreateGroup()
  const updateGroup = useUpdateGroup()
  const deleteGroup = useDeleteGroup()

  const paginatedData = data as { items?: GroupResponse[]; total?: number } | undefined
  const groups = (paginatedData?.items ?? []) as GroupResponse[]
  const total = paginatedData?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [description, setDescription] = useState('')

  // Edit dialog state
  const [editUuid, setEditUuid] = useState<string | null>(null)
  const [editGroupName, setEditGroupName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // Delete dialog state
  const [deleteUuid, setDeleteUuid] = useState<string | null>(null)
  const deleteTarget = deleteUuid ? groups.find((g) => g.group_uuid === deleteUuid) : null

  const resetCreateForm = () => {
    setGroupName('')
    setDescription('')
  }

  const openEditDialog = (group: GroupResponse) => {
    setEditGroupName(group.group_name)
    setEditDescription(group.description ?? '')
    setEditUuid(group.group_uuid)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createGroup.mutate(
      {
        group_name: groupName,
        description: description || null,
      },
      {
        onSuccess: () => {
          setCreateOpen(false)
          resetCreateForm()
        },
      },
    )
  }

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUuid) return
    updateGroup.mutate(
      {
        uuid: editUuid,
        data: {
          group_name: editGroupName,
          description: editDescription || null,
        },
      },
      {
        onSuccess: () => setEditUuid(null),
      },
    )
  }

  const handleDelete = () => {
    if (!deleteUuid) return
    deleteGroup.mutate(deleteUuid, {
      onSuccess: () => setDeleteUuid(null),
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t('groups.title')}</h1>
        <Button
          className="bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 border-none"
          onClick={() => setCreateOpen(true)}
        >
          {t('groups.createGroup')}
        </Button>
      </div>

      {/* Group list */}
      <div className="glass-light rounded-xl p-1">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-400 text-sm">{t('groups.failedToLoad')}</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-text-muted text-sm">{t('groups.noGroups')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('groups.groupName')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('groups.description')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.createdAt')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.group_uuid} className="border-white/5 hover:bg-white/5">
                  <TableCell className="text-text-primary font-medium">{group.group_name}</TableCell>
                  <TableCell className="text-text-secondary text-sm max-w-[300px] truncate">
                    {group.description ?? '-'}
                  </TableCell>
                  <TableCell className="text-text-secondary text-xs font-mono">
                    {formatDateTime(group.created_at, i18n.language)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 px-2 text-text-muted hover:text-text-primary"
                        onClick={() => openEditDialog(group)}
                      >
                        {t('common.edit')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => setDeleteUuid(group.group_uuid)}
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('groups.createGroup')}</DialogTitle>
            <DialogDescription>{t('groups.createDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('groups.groupName')}</Label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={t('groups.groupNamePlaceholder')}
                required
                minLength={1}
                maxLength={128}
              />
            </div>
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('groups.description')}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('groups.descriptionPlaceholder')}
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={createGroup.isPending || !groupName.trim()}
                className="bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 border-none"
              >
                {createGroup.isPending ? t('common.creating') : t('groups.createGroup')}
              </Button>
            </DialogFooter>
            {createGroup.isError && (
              <p className="text-red-400 text-xs mt-2">{t('groups.createFailed')}</p>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editUuid !== null} onOpenChange={(open) => { if (!open) setEditUuid(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('groups.editGroup')}</DialogTitle>
            <DialogDescription>{t('groups.editDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('groups.groupName')}</Label>
              <Input
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                placeholder={t('groups.groupNamePlaceholder')}
                required
                minLength={1}
                maxLength={128}
              />
            </div>
            <div>
              <Label className="text-xs text-text-secondary mb-1.5">{t('groups.description')}</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder={t('groups.descriptionPlaceholder')}
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={updateGroup.isPending || !editGroupName.trim()}
                className="bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 border-none"
              >
                {updateGroup.isPending ? t('groups.updatingGroup') : t('groups.updateGroup')}
              </Button>
            </DialogFooter>
            {updateGroup.isError && (
              <p className="text-red-400 text-xs mt-2">{t('groups.updateFailed')}</p>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteUuid !== null} onOpenChange={(open) => { if (!open) setDeleteUuid(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('groups.deleteGroup')}</DialogTitle>
            <DialogDescription>{t('groups.deleteConfirm', { name: deleteTarget?.group_name ?? '' })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUuid(null)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteGroup.isPending}>
              {deleteGroup.isPending ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
