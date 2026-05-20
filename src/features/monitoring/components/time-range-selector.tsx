import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

type Granularity = 'raw' | 'hourly' | 'daily'

interface TimeRangeValue {
  start: number
  end: number
  granularity: Granularity
}

export interface TimeRangeSelectorProps {
  value: TimeRangeValue
  onChange: (range: TimeRangeValue) => void
}

interface PresetConfig {
  label: string
  durationMs: number
  granularity: Granularity
}

const PRESETS: readonly PresetConfig[] = [
  { label: '1h', durationMs: 60 * 60 * 1000, granularity: 'raw' },
  { label: '6h', durationMs: 6 * 60 * 60 * 1000, granularity: 'raw' },
  { label: '24h', durationMs: 24 * 60 * 60 * 1000, granularity: 'raw' },
  { label: '7d', durationMs: 7 * 24 * 60 * 60 * 1000, granularity: 'hourly' },
  { label: '30d', durationMs: 30 * 24 * 60 * 60 * 1000, granularity: 'daily' },
  { label: '1y', durationMs: 365 * 24 * 60 * 60 * 1000, granularity: 'daily' },
] as const

const GRANULARITY_KEYS: Record<Granularity, string> = {
  raw: 'monitoring.raw',
  hourly: 'monitoring.hourly',
  daily: 'monitoring.daily',
}

function findActivePreset(value: TimeRangeValue): string | null {
  const duration = value.end - value.start
  for (const preset of PRESETS) {
    const tolerance = preset.durationMs * 0.05
    if (Math.abs(duration - preset.durationMs) < tolerance) {
      return preset.label
    }
  }
  return null
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const { t } = useTranslation()
  const activePreset = useMemo(() => findActivePreset(value), [value])

  const handlePresetClick = useCallback(
    (preset: PresetConfig) => {
      const now = Date.now()
      onChange({
        start: now - preset.durationMs,
        end: now,
        granularity: preset.granularity,
      })
    },
    [onChange],
  )

  return (
    <div className="glass-light rounded-lg px-3 py-2 flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1">
        {PRESETS.map((preset) => {
          const isActive = activePreset === preset.label
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={`
                px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150
                font-[family-name:var(--font-mono)]
                ${
                  isActive
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-text-muted hover:text-text-primary hover:bg-muted'
                }
              `}
            >
              {preset.label}
            </button>
          )
        })}
      </div>

      <div className="w-px h-5 bg-accent-border mx-1" />

      <span
        className="
          inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider
          bg-accent text-accent-foreground
          font-[family-name:var(--font-mono)]
        "
      >
        {t(GRANULARITY_KEYS[value.granularity])}
      </span>
    </div>
  )
}
