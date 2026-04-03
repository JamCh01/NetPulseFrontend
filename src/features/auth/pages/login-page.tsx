import { useState } from 'react'
import { useNavigate, Link } from 'react-router'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement useLogin hook
    navigate('/dashboard')
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary mb-1">Sign in</h2>
      <p className="text-sm text-text-muted mb-6">Enter your credentials to access NetPulse</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 rounded-lg glass-light text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-accent/30"
            placeholder="Enter your username"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg glass-light text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-accent/30"
            placeholder="Enter your password"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-emerald-500/90 hover:bg-emerald-400 text-gray-950 text-sm font-semibold transition-colors"
        >
          Sign In
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-text-muted">
        Don't have an account?{' '}
        <Link to="/register" className="text-accent hover:underline">
          Register
        </Link>
      </p>
    </div>
  )
}
