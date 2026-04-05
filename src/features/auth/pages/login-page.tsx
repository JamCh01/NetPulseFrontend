import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useLogin } from '@/api/hooks/use-auth'

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
      }
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary mb-1">{t('auth.signIn')}</h2>
      <p className="text-sm text-text-muted mb-6">{t('auth.signInDesc')}</p>

      {registeredSuccess && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
          {t('auth.registerSuccess')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">{t('auth.username')}</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 rounded-lg glass-light text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-accent/30"
            placeholder={t('auth.usernamePlaceholder')}
            required
            disabled={login.isPending}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">{t('auth.password')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg glass-light text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-accent/30"
            placeholder={t('auth.passwordPlaceholder')}
            required
            disabled={login.isPending}
          />
        </div>
        <button
          type="submit"
          disabled={cooldown || login.isPending}
          className="w-full py-2.5 rounded-lg bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {login.isPending ? t('auth.signingIn') : t('auth.signInBtn')}
        </button>
      </form>

      {login.isError && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {getErrorMessage(login.error)}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-text-muted">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="text-accent hover:underline">
          {t('auth.register')}
        </Link>
      </p>
    </div>
  )
}
