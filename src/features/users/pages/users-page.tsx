import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUsers, useDisableUser, useChangePassword } from '@/api/hooks/use-users'
import { formatDate } from '@/lib/format'
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
import { Pagination } from '@/components/ui/pagination'
import type { UserResponse, PaginatedResponseUserResponse } from '@/api/generated/types.gen'

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  subscriber: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
}

const PAGE_SIZE = 20

export default function UsersPage() {
  const { t, i18n } = useTranslation()
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const { data, isLoading, error } = useUsers(
    roleFilter
      ? { role: roleFilter, skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE }
      : { skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE },
  )
  const disableUser = useDisableUser()
  const changePassword = useChangePassword()

  const users = ((data as PaginatedResponseUserResponse)?.items ?? []) as UserResponse[]
  const totalPages = Math.ceil(((data as PaginatedResponseUserResponse)?.total ?? 0) / PAGE_SIZE)

  // Disable dialog
  const [disableUuid, setDisableUuid] = useState<string | null>(null)
  const disableTarget = disableUuid
    ? users.find((u) => u.user_uuid === disableUuid)
    : null

  // Change password dialog
  const [passwordUuid, setPasswordUuid] = useState<string | null>(null)
  const passwordTarget = passwordUuid
    ? users.find((u) => u.user_uuid === passwordUuid)
    : null
  const [newPassword, setNewPassword] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const handleDisable = () => {
    if (!disableUuid) return
    disableUser.mutate(disableUuid, {
      onSuccess: () => setDisableUuid(null),
    })
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordUuid) return
    changePassword.mutate(
      { uuid: passwordUuid, newPassword },
      {
        onSuccess: () => {
          setPasswordSuccess(true)
          setNewPassword('')
          setTimeout(() => {
            setPasswordUuid(null)
            setPasswordSuccess(false)
          }, 1500)
        },
      },
    )
  }

  const handlePasswordDialogClose = (open: boolean) => {
    if (!open) {
      setPasswordUuid(null)
      setNewPassword('')
      setPasswordSuccess(false)
      changePassword.reset()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t('users.title')}</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{t('users.filterByRole')}</span>
          <Select
            value={roleFilter}
            onValueChange={(val) => { setRoleFilter(val ?? ''); setPage(1) }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('users.allRoles')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('users.allRoles')}</SelectItem>
              <SelectItem value="admin">{t('users.admin')}</SelectItem>
              <SelectItem value="subscriber">{t('users.subscriber')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="glass-light rounded-xl p-1">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-400 text-sm">{t('users.failedToLoad')}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-text-muted text-sm">{t('users.noUsers')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('users.username')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('users.email')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('auth.role')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.active')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.createdAt')}</TableHead>
                <TableHead className="text-text-muted text-xs uppercase tracking-wider">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.user_uuid} className="border-white/5 hover:bg-white/5">
                  <TableCell className="text-text-primary font-medium">{user.username}</TableCell>
                  <TableCell className="text-text-secondary text-sm">{user.email}</TableCell>
                  <TableCell>
                    <Badge className={`border text-xs capitalize ${ROLE_COLORS[user.role] ?? ''}`}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`border text-xs ${
                        user.is_active
                          ? 'bg-green-500/15 text-green-400 border-green-500/30'
                          : 'bg-red-500/15 text-red-400 border-red-500/30'
                      }`}
                    >
                      {user.is_active ? t('common.active') : t('common.disabled')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-text-secondary text-sm font-[family-name:var(--font-mono)]">
                    {formatDate(user.created_at, i18n.language)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setPasswordUuid(user.user_uuid)}
                        className="text-text-muted hover:text-text-primary"
                      >
                        {t('users.changePassword')}
                      </Button>
                      {user.is_active && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setDisableUuid(user.user_uuid)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          {t('users.disableUser')}
                        </Button>
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

      {/* Disable Confirmation Dialog */}
      <Dialog
        open={disableUuid !== null}
        onOpenChange={(open) => {
          if (!open) setDisableUuid(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.disableUser')}</DialogTitle>
            <DialogDescription>
              {t('users.disableConfirm', { name: disableTarget?.username ?? 'this user' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableUuid(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={disableUser.isPending}
            >
              {disableUser.isPending ? t('common.disabling') : t('users.disableUser')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordUuid !== null} onOpenChange={handlePasswordDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('users.changePassword')}</DialogTitle>
            <DialogDescription>
              {t('users.changePasswordDesc', { name: passwordTarget?.username ?? '' })}
            </DialogDescription>
          </DialogHeader>
          {passwordSuccess ? (
            <p className="text-emerald-400 text-sm py-4 text-center">{t('users.changePasswordSuccess')}</p>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4 mt-2">
              <div>
                <Label className="text-xs text-text-secondary mb-1.5">{t('users.newPassword')}</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('users.newPasswordPlaceholder')}
                  minLength={8}
                  maxLength={128}
                  required
                />
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => handlePasswordDialogClose(false)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={changePassword.isPending || newPassword.length < 8}
                  className="bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 border-none"
                >
                  {changePassword.isPending ? t('users.changingPassword') : t('users.changePasswordBtn')}
                </Button>
              </DialogFooter>
              {changePassword.isError && (
                <p className="text-red-400 text-xs">{t('users.changePasswordFailed')}</p>
              )}
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
