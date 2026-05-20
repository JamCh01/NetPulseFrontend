import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Compass, Home, Undo2 } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[70vh] px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl border border-accent/20 bg-[rgba(6,12,24,0.6)] p-8 text-center backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
          <Compass className="h-6 w-6 text-accent" />
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-text-dim">404</p>
        <h1 className="mt-2 text-2xl font-bold text-text-primary">页面不存在</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
          这个地址可能已变更，或你访问了不存在的页面。你可以返回上一页，或者跳转到核心页面继续操作。
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={() => navigate(-1)} variant="outline">
            <Undo2 className="mr-1.5 h-4 w-4" />
            返回上一页
          </Button>
          <Button render={<Link to="/monitoring" />}>
            <Compass className="mr-1.5 h-4 w-4" />
            去监控页
          </Button>
          <Button render={<Link to="/" />} variant="secondary">
            <Home className="mr-1.5 h-4 w-4" />
            回到首页
          </Button>
        </div>
      </div>
    </div>
  )
}
