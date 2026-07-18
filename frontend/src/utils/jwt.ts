import { jwtDecode } from 'jwt-decode'
import type { JwtPayload } from '../types'

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwtDecode<JwtPayload>(token)
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded) return true
  const now = Math.floor(Date.now() / 1000)
  return decoded.exp < now
}

export function getTokenRole(token: string): string | null {
  const decoded = decodeToken(token)
  return decoded?.role ?? null
}

export function getTokenUserId(token: string): number | null {
  const decoded = decodeToken(token)
  return decoded?.userId ?? null
}
