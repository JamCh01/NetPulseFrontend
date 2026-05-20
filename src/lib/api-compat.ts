const warnedMissingEndpoints = new Set<string>()

declare global {
  interface Window {
    __NETPULSE_MISSING_APIS__?: string[]
  }
}

export function reportMissingApi(endpoint: string) {
  if (!warnedMissingEndpoints.has(endpoint)) {
    warnedMissingEndpoints.add(endpoint)
    console.warn(`[API Compatibility] Missing endpoint: ${endpoint}`)
  }
  const current = window.__NETPULSE_MISSING_APIS__ ?? []
  if (!current.includes(endpoint)) {
    window.__NETPULSE_MISSING_APIS__ = [...current, endpoint]
  }
}
