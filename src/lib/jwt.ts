export interface JwtPayload {
  sub: string
  role: 'admin' | 'subscriber'
  exp: number
}

export function isJwtToken(token: string): boolean {
  return token.split('.').length === 3
}

export function decodeJwt(token: string): JwtPayload | null {
  if (!isJwtToken(token)) return null
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const parsed: unknown = JSON.parse(decoded)
    if (
      typeof parsed === 'object' && parsed !== null &&
      'sub' in parsed && typeof (parsed as Record<string, unknown>).sub === 'string' &&
      'role' in parsed && ((parsed as Record<string, unknown>).role === 'admin' || (parsed as Record<string, unknown>).role === 'subscriber') &&
      'exp' in parsed && typeof (parsed as Record<string, unknown>).exp === 'number'
    ) {
      return parsed as JwtPayload
    }
    return null
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token)
  if (!payload) return true
  return payload.exp * 1000 < Date.now()
}
