import type { MonitoringDataPoint } from '@/api/generated/types.gen'

interface BandPair {
  lower: number[]
  delta: number[]
}

export interface ChartBandData {
  timestamps: number[]
  medianLine: number[]
  packetLoss: number[]
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
  lossPcts: number[],
): [number, number][] {
  const intervals: [number, number][] = []
  let start = -1

  for (let i = 0; i < timestamps.length; i++) {
    if (lossPcts[i] > 0) {
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

export function transformToChartData(points: MonitoringDataPoint[]): ChartBandData {
  if (points.length === 0) return emptyBandData()

  const timestamps: number[] = []
  const medianLine: number[] = []
  const minToAvg: BandPair = { lower: [], delta: [] }
  const avgToP95: BandPair = { lower: [], delta: [] }
  const p95ToP99: BandPair = { lower: [], delta: [] }
  const p99ToMax: BandPair = { lower: [], delta: [] }
  const lossPcts: number[] = []

  for (const p of points) {
    const ts = p.timestamp * 1000 // convert to ms for ECharts
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

  const lossIntervals = mergeLossIntervals(timestamps, lossPcts)

  return {
    timestamps,
    medianLine,
    packetLoss: lossPcts,
    bands: { minToAvg, avgToP95, p95ToP99, p99ToMax },
    lossIntervals,
  }
}
