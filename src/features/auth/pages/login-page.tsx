import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useLogin } from '@/api/hooks/use-auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [cooldown, setCooldown] = useState(false)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useLogin()
  const registeredSuccess = searchParams.get('registered') === 'true'

  function getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 429) return t('auth.loginRateLimited')
    if (error && typeof error === 'object' && 'detail' in error) {
      const detail = (error as { detail: unknown }).detail
      if (typeof detail === 'string') return detail
      if (Array.isArray(detail) && detail.length > 0) {
        return detail.map((d: { msg?: string }) => d.msg ?? t('auth.validationError')).join(', ')
      }
    }
    if (error instanceof Error) return error.message
    return t('auth.loginFailed')
  }

  useEffect(() => {
    if (registeredSuccess) {
      toast.success(t('auth.registerSuccess'))
      navigate('/login', { replace: true })
    }
  }, [registeredSuccess, navigate, t])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCooldown(true)
    setTimeout(() => setCooldown(false), 3000)
    login.mutate(
      { username, password },
      {
        onSuccess: () => {
          navigate('/dashboard')
        },
        onError: (err) => {
          toast.error(getErrorMessage(err))
        },
      }
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary mb-1">{t('auth.signIn')}</h2>
      <p className="text-sm text-text-muted mb-6">{t('auth.signInDesc')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="username" className="block text-xs font-medium text-text-secondary mb-1.5">{t('auth.username')}</Label>
          <Input
            id="username"
            name="username"
            autoComplete="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('auth.usernamePlaceholder')}
            required
            disabled={login.isPending}
          />
        </div>
        <div>
          <Label htmlFor="password" className="block text-xs font-medium text-text-secondary mb-1.5">{t('auth.password')}</Label>
          <Input
            id="password"
            name="password"
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.passwordPlaceholder')}
            required
            disabled={login.isPending}
          />
        </div>
        <Button
          type="submit"
          disabled={cooldown || login.isPending}
          className="w-full h-10 text-sm font-semibold transition-colors mt-2"
        >
          {login.isPending ? t('auth.signingIn') : t('auth.signInBtn')}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-text-muted">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="text-accent-foreground hover:underline">
          {t('auth.register')}
        </Link>
      </p>
    </div>
  )
}

