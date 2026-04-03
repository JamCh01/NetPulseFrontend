import { useState } from 'react'
import { useNavigate, Link } from 'react-router'

export default function RegisterPage() {
  const [form, setForm] = useState<{ username: string; email: string; password: string; role: 'admin' | 'subscriber' }>({ username: '', email: '', password: '', role: 'subscriber' })
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement useRegister hook
    navigate('/login')
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary mb-1">Create account</h2>
      <p className="text-sm text-text-muted mb-6">Register for a new NetPulse account</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Username</label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full px-3 py-2 rounded-lg glass-light text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-accent/30"
            placeholder="2-64 characters"
            required
            minLength={2}
            maxLength={64}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 rounded-lg glass-light text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-accent/30"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-3 py-2 rounded-lg glass-light text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-accent/30"
            placeholder="Minimum 8 characters"
            required
            minLength={8}
            maxLength={128}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'subscriber' })}
            className="w-full px-3 py-2 rounded-lg glass-light text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30 bg-transparent"
          >
            <option value="subscriber">Subscriber</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 text-sm font-semibold transition-colors"
        >
          Create Account
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-text-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
