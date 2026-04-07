import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useChangePassword } from '@/api/hooks/use-users'
import { useAuthStore } from '@/stores/auth-store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLogout } from '@/api/hooks/use-auth'
import { useNavigate } from 'react-router'

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const changePassword = useChangePassword()
  const logoutMutation = useLogout()
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError(t('users.passwordTooShort') || 'Password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError(t('users.passwordsDoNotMatch') || 'Passwords do not match.')
      return
    }

    if (!user?.uuid) return

    changePassword.mutate(
      { uuid: user.uuid, newPassword },
      {
        onSuccess: () => {
          onOpenChange(false)
          setNewPassword('')
          setConfirmPassword('')
          
          // Optional: Force logout on password change to force re-login with new credentials
          logoutMutation.mutate(undefined, {
            onSettled: () => {
              navigate('/login')
            },
          })
        },
        onError: () => {
          setError(t('users.changePasswordFailed') || 'Failed to change password. Please try again.')
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('users.changePassword') || 'Change Password'}</DialogTitle>
          <DialogDescription>
            {t('users.changePasswordDesc') || 'Set a new password for your account. You will be logged out after changing your password.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className="text-xs text-text-secondary mb-1.5">{t('users.newPassword') || 'New Password'}</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('users.newPasswordPlaceholder') || 'Minimum 8 characters'}
              required
            />
          </div>
          <div>
            <Label className="text-xs text-text-secondary mb-1.5">{t('users.confirmPassword') || 'Confirm Password'}</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('users.confirmPasswordPlaceholder') || 'Type your new password again'}
              required
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={changePassword.isPending || !newPassword || !confirmPassword}
              className="bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 border-none"
            >
              {changePassword.isPending ? (t('users.changingPassword') || 'Changing...') : (t('users.changePasswordBtn') || 'Change Password')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
