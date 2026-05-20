import { useEffect } from 'react'
import { BrowserRouter } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/query-client'
import { AppRouter } from '@/router'
import { useAuthStore } from '@/stores/auth-store'
import { LoadingState } from '@/components/ui/loading-state'
import { ErrorBoundary } from '@/components/ui/error-boundary'

export default function App() {
  const initFromStorage = useAuthStore((s) => s.initFromStorage)
  const initialized = useAuthStore((s) => s.initialized)

  useEffect(() => {
    initFromStorage()
  }, [initFromStorage])

  if (!initialized) {
    return <LoadingState fullscreen label="Preparing workspace" hint="Syncing local session" />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </ErrorBoundary>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
