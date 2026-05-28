import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { CalendarClock, Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  createAbsoluteTimeRange,
  createRelativeTimeRange,
  defaultStepForGranularity,
  granularityForTimeRange,
  normalizeStep,
  type MonitoringGranularity,
  type MonitoringTimeRange,
} from '@/features/monitoring/lib/time-range'

export interface TimeRangeSelectorProps {
  value: MonitoringTimeRange
  onChange: (range: MonitoringTimeRange) => void
}

interface GrafanaTimeRangeSelectorProps extends TimeRangeSelectorProps {
  showStep?: boolean
  density?: 'default' | 'compact'
  className?: string
}

interface PresetConfig {
  label: string
  grafanaLabel: string
  durationMs: number
  granularity: MonitoringGranularity
}

const PRESETS: readonly PresetConfig[] = [
  { label: '1h', grafanaLabel: 'Last 1 hour', durationMs: 60 * 60 * 1000, granularity: 'raw' },
  { label: '6h', grafanaLabel: 'Last 6 hours', durationMs: 6 * 60 * 60 * 1000, granularity: 'raw' },
  { label: '24h', grafanaLabel: 'Last 24 hours', durationMs: 24 * 60 * 60 * 1000, granularity: 'raw' },
  { label: '7d', grafanaLabel: 'Last 7 days', durationMs: 7 * 24 * 60 * 60 * 1000, granularity: 'hourly' },
  { label: '30d', grafanaLabel: 'Last 30 days', durationMs: 30 * 24 * 60 * 60 * 1000, granularity: 'daily' },
  { label: '1y', grafanaLabel: 'Last 1 year', durationMs: 365 * 24 * 60 * 60 * 1000, granularity: 'daily' },
] as const

type GranularityTranslationKey = 'monitoring.raw' | 'monitoring.hourly' | 'monitoring.daily'

const GRANULARITY_KEYS: Record<MonitoringGranularity, GranularityTranslationKey> = {
  raw: 'monitoring.raw',
  hourly: 'monitoring.hourly',
  daily: 'monitoring.daily',
} as const

const STEP_OPTIONS: ReadonlyArray<{ label: string; value: number | null }> = [
  { label: 'Auto', value: null },
  { label: '1m', value: 60 },
  { label: '5m', value: 300 },
  { label: '15m', value: 900 },
  { label: '1h', value: 3600 },
  { label: '1d', value: 86400 },
] as const

function findActivePreset(value: MonitoringTimeRange): string | null {
  if (value.relativeDurationMs) {
    return PRESETS.find((preset) => preset.durationMs === value.relativeDurationMs)?.label ?? null
  }
  const duration = value.end - value.start
  for (const preset of PRESETS) {
    const tolerance = preset.durationMs * 0.05
    if (Math.abs(duration - preset.durationMs) < tolerance) {
      return preset.label
    }
  }
  return null
}

function displayStep(value: MonitoringTimeRange): string {
  const stepSec = value.stepSec ?? defaultStepForGranularity(value.granularity)
  const option = STEP_OPTIONS.find((item) => item.value === stepSec)
  if (option) return option.label
  return `${stepSec}s`
}

function formatAbsoluteLabel(timestamp: number): string {
  return toDateTimeTextValue(timestamp)
}

function toDateTimeTextValue(timestamp: number): string {
  const date = new Date(timestamp)
  const pad = (value: number) => String(value).padStart(2, '0')
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    ' ',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
    ':',
    pad(date.getSeconds()),
  ].join('')
}

function parseDateTimeTextValue(value: string): number | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/)
  if (!match) return null
  const [, year, month, day, hour, minute, second] = match
  const timestamp = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  ).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const { t } = useTranslation()
  const activePreset = useMemo(() => findActivePreset(value), [value])

  const handlePresetClick = useCallback(
    (preset: PresetConfig) => {
      onChange(createRelativeTimeRange(preset.durationMs, Date.now(), defaultStepForGranularity(preset.granularity)))
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

export function GrafanaTimeRangeSelector({
  value,
  onChange,
  showStep = true,
  density = 'default',
  className,
}: GrafanaTimeRangeSelectorProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 736, maxHeight: 640 })
  const [absoluteStart, setAbsoluteStart] = useState(() => toDateTimeTextValue(value.start))
  const [absoluteEnd, setAbsoluteEnd] = useState(() => toDateTimeTextValue(value.end))
  const [stepValue, setStepValue] = useState<string>(() => String(value.stepSec ?? defaultStepForGranularity(value.granularity)))
  const [absoluteError, setAbsoluteError] = useState<string | null>(null)
  const activePreset = useMemo(() => findActivePreset(value), [value])
  const active = PRESETS.find((preset) => preset.label === activePreset)
  const triggerLabel = active?.grafanaLabel ?? `${formatAbsoluteLabel(value.start)} - ${formatAbsoluteLabel(value.end)}`

  const updateDropdownPosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const viewportPadding = 16
    const width = Math.min(736, window.innerWidth - viewportPadding * 2)
    const maxHeight = window.innerHeight - viewportPadding * 2
    const dropdownHeight = Math.min(dropdownRef.current?.offsetHeight ?? 320, maxHeight)
    const preferredTop = rect.bottom + 8
    const top = preferredTop + dropdownHeight > window.innerHeight - viewportPadding
      ? Math.max(viewportPadding, window.innerHeight - dropdownHeight - viewportPadding)
      : preferredTop
    setDropdownPosition({
      top,
      left: Math.min(Math.max(rect.right - width, viewportPadding), window.innerWidth - width - viewportPadding),
      width,
      maxHeight,
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updateDropdownPosition()
    window.addEventListener('resize', updateDropdownPosition)
    window.addEventListener('scroll', updateDropdownPosition, true)
    return () => {
      window.removeEventListener('resize', updateDropdownPosition)
      window.removeEventListener('scroll', updateDropdownPosition, true)
    }
  }, [open, updateDropdownPosition])

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  const handlePresetClick = useCallback(
    (preset: PresetConfig) => {
      onChange(createRelativeTimeRange(preset.durationMs, Date.now(), defaultStepForGranularity(preset.granularity)))
      setOpen(false)
    },
    [onChange],
  )

  const handleAbsoluteApply = useCallback(() => {
    const start = parseDateTimeTextValue(absoluteStart)
    const end = parseDateTimeTextValue(absoluteEnd)
    if (start === null || end === null) {
      setAbsoluteError(t('timeRange.invalidRange'))
      return
    }
    if (start >= end) {
      setAbsoluteError(t('timeRange.startBeforeEnd'))
      return
    }
    const nextGranularity = granularityForTimeRange(start, end)
    const parsedStep = showStep
      ? stepValue === 'auto'
        ? defaultStepForGranularity(nextGranularity)
        : Number(stepValue)
      : defaultStepForGranularity(nextGranularity)
    if (showStep) {
      if (!Number.isFinite(parsedStep) || parsedStep < 60) {
        setAbsoluteError(t('timeRange.minStep'))
        return
      }
      if (parsedStep > 86400) {
        setAbsoluteError(t('timeRange.maxStep'))
        return
      }
    }
    setAbsoluteError(null)
    onChange(createAbsoluteTimeRange(start, end, normalizeStep(parsedStep, nextGranularity)))
    setOpen(false)
  }, [absoluteEnd, absoluteStart, onChange, showStep, stepValue, t])

  const handleOpenChange = () => {
    setAbsoluteStart(toDateTimeTextValue(value.start))
    setAbsoluteEnd(toDateTimeTextValue(value.end))
    setStepValue(String(value.stepSec ?? defaultStepForGranularity(value.granularity)))
    setAbsoluteError(null)
    setOpen((current) => !current)
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpenChange}
        className={`inline-flex min-w-0 items-center gap-2 rounded-md border border-border bg-bg-surface-light text-xs font-medium text-text-secondary shadow-sm transition-colors hover:border-accent-border hover:bg-muted hover:text-text-primary ${
          density === 'compact' ? 'h-9 px-3' : 'h-8 px-2.5'
        } ${className ?? ''}`}
      >
        <CalendarClock className="h-3.5 w-3.5 text-text-muted" />
        <span className="min-w-0 flex-1 truncate text-left font-[family-name:var(--font-mono)]">{triggerLabel}</span>
        <span className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] uppercase text-text-dim">
          {t(GRANULARITY_KEYS[value.granularity])}
        </span>
        {showStep && (
          <span className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] text-text-dim">
            step {displayStep(value)}
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-text-dim" />
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            maxHeight: dropdownPosition.maxHeight,
          }}
          className="fixed z-[80] overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-xl"
        >
          <div className="grid md:grid-cols-[16rem_minmax(0,1fr)]">
            <div className="border-b border-border md:border-b-0 md:border-r">
              <div className="border-b border-border px-3 py-2 text-[10px] font-medium uppercase text-text-dim">
                {t('timeRange.quickRanges')}
              </div>
              <div className="py-1">
                {PRESETS.map((preset) => {
                  const isActive = activePreset === preset.label
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handlePresetClick(preset)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text-secondary transition-colors hover:bg-muted hover:text-text-primary"
                    >
                      <span className="flex h-4 w-4 items-center justify-center">
                        {isActive && <Check className="h-3.5 w-3.5 text-accent-foreground" />}
                      </span>
                      <span className="flex-1 font-medium">{preset.grafanaLabel}</span>
                      <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase text-text-dim">
                        {t(GRANULARITY_KEYS[preset.granularity])}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="px-3 py-3">
              <div className="mb-2 text-[10px] font-medium uppercase text-text-dim">{t('timeRange.absoluteRange')}</div>
              <div className="grid gap-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs text-text-muted">
                    <span>{t('timeRange.startTime')}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="YYYY-MM-DD HH:mm:ss"
                      value={absoluteStart}
                      onChange={(event) => setAbsoluteStart(event.target.value)}
                      className="h-8 min-w-0 rounded-md border border-border bg-bg-surface-light px-2 font-[family-name:var(--font-mono)] text-xs text-text-primary outline-none transition-colors focus:border-accent-border"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-text-muted">
                    <span>{t('timeRange.endTime')}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="YYYY-MM-DD HH:mm:ss"
                      value={absoluteEnd}
                      onChange={(event) => setAbsoluteEnd(event.target.value)}
                      className="h-8 min-w-0 rounded-md border border-border bg-bg-surface-light px-2 font-[family-name:var(--font-mono)] text-xs text-text-primary outline-none transition-colors focus:border-accent-border"
                    />
                  </label>
                </div>
                {showStep && (
                  <label className="grid gap-1 text-xs text-text-muted sm:max-w-40">
                    <span>Step</span>
                    <select
                      value={stepValue}
                      onChange={(event) => setStepValue(event.target.value)}
                      className="h-8 rounded-md border border-border bg-bg-surface-light px-2 font-[family-name:var(--font-mono)] text-xs text-text-primary outline-none transition-colors focus:border-accent-border"
                    >
                      {STEP_OPTIONS.map((option) => (
                        <option key={option.label} value={option.value ?? 'auto'}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <div className="rounded-md border border-border bg-bg-surface-light px-2 py-1.5 text-[11px] leading-relaxed text-text-dim">
                  {showStep
                    ? t('timeRange.metricsStepHelp')
                    : t('timeRange.eventStepHelp')}
                </div>
                {absoluteError && (
                  <div className="text-xs text-status-error-fg">{absoluteError}</div>
                )}
                <div className="flex justify-end">
                  <Button type="button" size="sm" onClick={handleAbsoluteApply}>
                    {t('timeRange.apply')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
