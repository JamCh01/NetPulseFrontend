import { useThemeStore } from '@/stores/theme-store'

export interface ChartThemeConfig {
  medianColor: string
  medianGlow: string
  bandColors: [string, string, string, string] // innermost → outermost
  lossColor: string
  lossAreaColor: string
  gridLineColor: string
  axisLabelColor: string
  tooltipBg: string
  tooltipBorder: string
  tooltipTextColor: string
  backgroundColor: string
}

export const darkTheme: ChartThemeConfig = {
  medianColor: '#00dcc8',
  medianGlow: 'rgba(0, 220, 200, 0.4)',
  bandColors: [
    'rgba(0, 220, 180, 0.35)', // min~avg (innermost, darkest)
    'rgba(0, 220, 180, 0.22)', // avg~p95
    'rgba(0, 220, 180, 0.12)', // p95~p99
    'rgba(0, 220, 180, 0.06)', // p99~max (outermost, lightest)
  ],
  lossColor: 'rgba(255, 50, 80, 0.8)',
  lossAreaColor: 'rgba(255, 50, 80, 0.15)',
  gridLineColor: 'rgba(0, 255, 200, 0.04)',
  axisLabelColor: '#4b5563',
  tooltipBg: 'rgba(6, 12, 24, 0.95)',
  tooltipBorder: 'rgba(0, 255, 200, 0.1)',
  tooltipTextColor: '#d1d5db',
  backgroundColor: 'transparent',
}

export const lightTheme: ChartThemeConfig = {
  medianColor: '#1d4ed8',
  medianGlow: 'rgba(29, 78, 216, 0.3)',
  bandColors: [
    'rgba(29, 78, 216, 0.30)',
    'rgba(29, 78, 216, 0.18)',
    'rgba(29, 78, 216, 0.10)',
    'rgba(29, 78, 216, 0.05)',
  ],
  lossColor: 'rgba(220, 38, 38, 0.8)',
  lossAreaColor: 'rgba(220, 38, 38, 0.1)',
  gridLineColor: 'rgba(0, 0, 0, 0.06)',
  axisLabelColor: '#6b7280',
  tooltipBg: 'rgba(255, 255, 255, 0.95)',
  tooltipBorder: 'rgba(0, 0, 0, 0.1)',
  tooltipTextColor: '#1f2937',
  backgroundColor: 'transparent',
}

export function useChartTheme(): ChartThemeConfig {
  const theme = useThemeStore((s) => s.theme)
  return theme === 'dark' ? darkTheme : lightTheme
}
