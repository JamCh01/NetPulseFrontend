import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useRegister } from '@/api/hooks/use-auth'

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
      }
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary mb-1">{t('auth.createAccount')}</h2>
      <p className="text-sm text-text-muted mb-6">{t('auth.createAccountDesc')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">{t('auth.username')}</label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full px-3 py-2 rounded-lg glass-light text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-accent/30"
            placeholder={t('auth.usernameHint')}
            required
            minLength={2}
            maxLength={64}
            disabled={register.isPending}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">{t('auth.email')}</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 rounded-lg glass-light text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-accent/30"
            placeholder={t('auth.emailPlaceholder')}
            required
            disabled={register.isPending}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">{t('auth.password')}</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-3 py-2 rounded-lg glass-light text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-accent/30"
            placeholder={t('auth.passwordHint')}
            required
            minLength={8}
            maxLength={128}
            disabled={register.isPending}
          />
        </div>
        <button
          type="submit"
          disabled={cooldown || register.isPending}
          className="w-full py-2.5 rounded-lg bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {register.isPending ? t('auth.creatingAccount') : t('auth.createAccountBtn')}
        </button>
      </form>

      {register.isError && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {getErrorMessage(register.error)}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-text-muted">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="text-accent-foreground hover:underline">
          {t('auth.signIn')}
        </Link>
      </p>
    </div>
  )
}
