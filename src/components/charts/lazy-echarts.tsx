import { lazy, Suspense } from 'react'
import type { EChartsProps } from './echarts'

const EChartsCore = lazy(() => import('./echarts').then((module) => ({ default: module.ECharts })))

export function LazyECharts({ className, style, ...props }: EChartsProps) {
  return (
    <Suspense fallback={<div className={className} style={style} />}>
      <EChartsCore className={className} style={style} {...props} />
    </Suspense>
  )
}
