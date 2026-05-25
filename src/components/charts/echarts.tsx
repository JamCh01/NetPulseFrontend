import { useEffect, useRef, type CSSProperties } from 'react'
import { BarChart, LineChart, ScatterChart } from 'echarts/charts'
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { init, use as registerEChartsModules, type EChartsCoreOption, type EChartsType } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

registerEChartsModules([
  BarChart,
  LineChart,
  ScatterChart,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
])

export interface EChartsProps {
  option: EChartsCoreOption
  className?: string
  style?: CSSProperties
  notMerge?: boolean
  lazyUpdate?: boolean
  onEvents?: Record<string, (params: unknown) => void>
}

export function ECharts({ option, className, style, notMerge = false, lazyUpdate = false, onEvents }: EChartsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<EChartsType | null>(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const chart = init(element, undefined, { renderer: 'canvas' })
    chartRef.current = chart

    const resizeObserver = new ResizeObserver(() => {
      chart.resize()
    })
    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    chartRef.current?.setOption(option, notMerge, lazyUpdate)
  }, [lazyUpdate, notMerge, option])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart || !onEvents) return

    for (const [eventName, handler] of Object.entries(onEvents)) {
      chart.on(eventName, handler)
    }

    return () => {
      for (const [eventName, handler] of Object.entries(onEvents)) {
        chart.off(eventName, handler)
      }
    }
  }, [onEvents])

  return <div ref={containerRef} className={className} style={style} />
}
