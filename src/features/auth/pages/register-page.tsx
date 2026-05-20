import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useRegister } from '@/api/hooks/use-auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [cooldown, setCooldown] = useState(false)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const register = useRegister()

  function getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 429) return t('auth.registerRateLimited')
    if (error && typeof error === 'object' && 'detail' in error) {
      const detail = (error as { detail: unknown }).detail
      if (typeof detail === 'string') return detail
      if (Array.isArray(detail) && detail.length > 0) {
        return detail.map((d: { msg?: string }) => d.msg ?? t('auth.validationError')).join(', ')
      }
    }
    if (error instanceof Error) return error.message
    return t('auth.registerFailed')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCooldown(true)
    setTimeout(() => setCooldown(false), 3000)
    register.mutate(
      { username: form.username, email: form.email, password: form.password, role: 'subscriber' },
      {
        onSuccess: () => {
          navigate('/login?registered=true')
        },
        onError: (err) => {
          toast.error(getErrorMessage(err))
        },
      }
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary mb-1">{t('auth.createAccount')}</h2>
      <p className="text-sm text-text-muted mb-6">{t('auth.createAccountDesc')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="block text-xs font-medium text-text-secondary mb-1.5">{t('auth.username')}</Label>
          <Input
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder={t('auth.usernameHint')}
            required
            minLength={2}
            maxLength={64}
            disabled={register.isPending}
          />
        </div>
        <div>
          <Label className="block text-xs font-medium text-text-secondary mb-1.5">{t('auth.email')}</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={t('auth.emailPlaceholder')}
            required
            disabled={register.isPending}
          />
        </div>
        <div>
          <Label className="block text-xs font-medium text-text-secondary mb-1.5">{t('auth.password')}</Label>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={t('auth.passwordHint')}
            required
            minLength={8}
            maxLength={128}
            disabled={register.isPending}
          />
        </div>
        <Button
          type="submit"
          disabled={cooldown || register.isPending}
          className="w-full h-10 text-sm font-semibold transition-colors mt-2"
        >
          {register.isPending ? t('auth.creatingAccount') : t('auth.createAccountBtn')}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-text-muted">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="text-accent-foreground hover:underline">
          {t('auth.signIn')}
        </Link>
      </p>
    </div>
  )
}

