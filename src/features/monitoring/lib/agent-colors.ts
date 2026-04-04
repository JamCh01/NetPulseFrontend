/**
 * Distinct color palette for multi-agent overlay chart.
 * Each agent gets a unique hue so lines are visually distinguishable.
 */
export const AGENT_COLORS = [
  { line: '#00dcc8', glow: 'rgba(0, 220, 200, 0.3)',  bg: 'rgba(0, 220, 200, 0.08)', label: 'Cyan' },
  { line: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)', bg: 'rgba(245, 158, 11, 0.08)', label: 'Amber' },
  { line: '#a78bfa', glow: 'rgba(167, 139, 250, 0.3)', bg: 'rgba(167, 139, 250, 0.08)', label: 'Violet' },
  { line: '#f472b6', glow: 'rgba(244, 114, 182, 0.3)', bg: 'rgba(244, 114, 182, 0.08)', label: 'Pink' },
  { line: '#38bdf8', glow: 'rgba(56, 189, 248, 0.3)',  bg: 'rgba(56, 189, 248, 0.08)', label: 'Sky' },
  { line: '#4ade80', glow: 'rgba(74, 222, 128, 0.3)',  bg: 'rgba(74, 222, 128, 0.08)', label: 'Green' },
  { line: '#fb923c', glow: 'rgba(251, 146, 60, 0.3)',  bg: 'rgba(251, 146, 60, 0.08)', label: 'Orange' },
  { line: '#e879f9', glow: 'rgba(232, 121, 249, 0.3)', bg: 'rgba(232, 121, 249, 0.08)', label: 'Fuchsia' },
  { line: '#2dd4bf', glow: 'rgba(45, 212, 191, 0.3)',  bg: 'rgba(45, 212, 191, 0.08)', label: 'Teal' },
  { line: '#fbbf24', glow: 'rgba(251, 191, 36, 0.3)',  bg: 'rgba(251, 191, 36, 0.08)', label: 'Yellow' },
] as const

export function getAgentColor(index: number) {
  return AGENT_COLORS[index % AGENT_COLORS.length]
}
