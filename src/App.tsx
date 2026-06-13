import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter } from 'react-router'
import { useTranslation } from 'react-i18next'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/query-client'
import { AppRouter } from '@/router'
import { useAuthStore } from '@/stores/auth-store'
import { useThemeStore } from '@/stores/theme-store'
import { LoadingState } from '@/components/ui/loading-state'
import { ErrorBoundary } from '@/components/ui/error-boundary'

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() => import('@tanstack/react-query-devtools').then((module) => ({ default: module.ReactQueryDevtools })))
  : null

export default function App() {
  const initFromStorage = useAuthStore((s) => s.initFromStorage)
  const initialized = useAuthStore((s) => s.initialized)
  const theme = useThemeStore((s) => s.theme)
  const { t } = useTranslation()

  useEffect(() => {
    initFromStorage()
  }, [initFromStorage])

  if (!initialized) {
    return <LoadingState fullscreen label={t('common.preparingWorkspace')} hint={t('common.syncingSession')} />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </ErrorBoundary>
      <Toaster 
        theme={theme} 
        position="top-right"
        toastOptions={{
          className: 'glass-light dark:glass border border-border text-text-primary rounded-xl font-sans',
        }}
      />
      {ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  )
}
