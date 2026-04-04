import { useEffect } from 'react'
import { BrowserRouter } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/query-client'
import { AppRouter } from '@/router'
import { useAuthStore } from '@/stores/auth-store'

export default function App() {
  const initFromStorage = useAuthStore((s) => s.initFromStorage)
  const initialized = useAuthStore((s) => s.initialized)

  useEffect(() => {
    initFromStorage()
  }, [initFromStorage])

  if (!initialized) {
    return (
      <div className="min-h-screen gradient-bg grid-pattern flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
