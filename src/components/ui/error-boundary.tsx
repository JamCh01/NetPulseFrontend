import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorState } from '@/components/ui/error-state'

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
              title="页面发生异常"
              description="我们已拦截这次错误，你可以重试或刷新页面继续使用。"
              onRetry={this.handleRetry}
              retryLabel="重试渲染"
              className="min-h-[40vh]"
            />
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
