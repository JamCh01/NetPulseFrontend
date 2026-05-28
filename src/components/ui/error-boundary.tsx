import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorState } from '@/components/ui/error-state'
import i18n from '@/i18n'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled render error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen gradient-bg grid-pattern px-4 py-10">
          <div className="mx-auto max-w-xl">
            <ErrorState
              title={i18n.t('errorBoundary.title')}
              description={i18n.t('errorBoundary.description')}
              onRetry={this.handleRetry}
              retryLabel={i18n.t('errorBoundary.retry')}
              className="min-h-[40vh]"
            />
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
