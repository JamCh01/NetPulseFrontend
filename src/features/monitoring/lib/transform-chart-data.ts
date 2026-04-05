import type { MonitoringDataPoint } from '@/api/generated/types.gen'

// Maximum gap between data points before we show a break in the chart (5 minutes)
const MAX_GAP_MS = 5 * 60 * 1000

interface BandPair {
  lower: (number | null)[]
  delta: (number | null)[]
}

export interface ChartBandData {
  timestamps: number[]
  medianLine: (number | null)[]
  packetLoss: (number | null)[]
  bands: {
    minToAvg: BandPair
    avgToP95: BandPair
    p95ToP99: BandPair
    p99ToMax: BandPair
  }
  lossIntervals: [number, number][]
}

function emptyBandData(): ChartBandData {
  return {
    timestamps: [],
    medianLine: [],
    packetLoss: [],
    bands: {
      minToAvg: { lower: [], delta: [] },
      avgToP95: { lower: [], delta: [] },
      p95ToP99: { lower: [], delta: [] },
      p99ToMax: { lower: [], delta: [] },
    },
    lossIntervals: [],
  }
}

/**
 * Merge consecutive timestamps with packet loss into intervals.
 * Points are considered consecutive if they are adjacent in the data array.
 */
function mergeLossIntervals(
  timestamps: number[],
  lossPcts: (number | null)[],
): [number, number][] {
  const intervals: [number, number][] = []
  let start = -1

  for (let i = 0; i < timestamps.length; i++) {
    const loss = lossPcts[i]
    if (loss !== null && loss > 0) {
      if (start === -1) start = i
    } else {
      if (start !== -1) {
        intervals.push([timestamps[start], timestamps[i - 1]])
        start = -1
      }
    }
  }

  // Close trailing interval
  if (start !== -1) {
    intervals.push([timestamps[start], timestamps[timestamps.length - 1]])
  }

  return intervals
}

/**
 * Insert null values into data arrays where there are time gaps > MAX_GAP_MS.
 * This creates visual breaks in the ECharts line chart.
 */
function insertGaps(
  points: MonitoringDataPoint[],
): {
  timestamps: number[]
  medianLine: (number | null)[]
  packetLoss: (number | null)[]
  bands: {
    minToAvg: BandPair
    avgToP95: BandPair
    p95ToP99: BandPair
    p99ToMax: BandPair
  }
} {
  const timestamps: number[] = []
  const medianLine: (number | null)[] = []
  const minToAvg: BandPair = { lower: [], delta: [] }
  const avgToP95: BandPair = { lower: [], delta: [] }
  const p95ToP99: BandPair = { lower: [], delta: [] }
  const p99ToMax: BandPair = { lower: [], delta: [] }
  const lossPcts: (number | null)[] = []

  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const ts = p.timestamp * 1000

    // Check if there's a gap from the previous point
    if (i > 0) {
      const prevTs = points[i - 1].timestamp * 1000
      if (ts - prevTs > MAX_GAP_MS) {
        // Insert null at the midpoint of the gap to create a clean break
        const midTs = prevTs + (ts - prevTs) / 2
        timestamps.push(midTs)
        medianLine.push(null)
        lossPcts.push(null)
        minToAvg.lower.push(null)
        minToAvg.delta.push(null)
        avgToP95.lower.push(null)
        avgToP95.delta.push(null)
        p95ToP99.lower.push(null)
        p95ToP99.delta.push(null)
        p99ToMax.lower.push(null)
        p99ToMax.delta.push(null)
      }
    }

    // Add the actual data point
    timestamps.push(ts)
    medianLine.push(p.median_rtt)
    lossPcts.push(p.packet_loss_pct)

    // Band 1: min → avg
    minToAvg.lower.push(p.min_rtt)
    minToAvg.delta.push(Math.max(0, p.avg_rtt - p.min_rtt))

    // Band 2: avg → p95
    avgToP95.lower.push(p.avg_rtt)
    avgToP95.delta.push(Math.max(0, p.p95_rtt - p.avg_rtt))

    // Band 3: p95 → p99
    p95ToP99.lower.push(p.p95_rtt)
    p95ToP99.delta.push(Math.max(0, p.p99_rtt - p.p95_rtt))

    // Band 4: p99 → max
    p99ToMax.lower.push(p.p99_rtt)
    p99ToMax.delta.push(Math.max(0, p.max_rtt - p.p99_rtt))
  }

  return {
    timestamps,
    medianLine,
    packetLoss: lossPcts,
    bands: { minToAvg, avgToP95, p95ToP99, p99ToMax },
  }
}

export function transformToChartData(points: MonitoringDataPoint[]): ChartBandData {
  if (points.length === 0) return emptyBandData()

  const { timestamps, medianLine, packetLoss, bands } = insertGaps(points)
  const lossIntervals = mergeLossIntervals(timestamps, packetLoss)

  return {
    timestamps,
    medianLine,
    packetLoss,
    bands,
    lossIntervals,
  }
}
