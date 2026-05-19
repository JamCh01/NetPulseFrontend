const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''

export function getApiBaseUrl(): string {
  return rawApiBaseUrl.replace(/\/+$/, '')
}

export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl()
  return baseUrl ? `${baseUrl}${path}` : path
}

export function buildWsApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl()
  if (!baseUrl) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}${path}`
  }

  const httpUrl = new URL(baseUrl)
  const wsProtocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${wsProtocol}//${httpUrl.host}${path}`
}
