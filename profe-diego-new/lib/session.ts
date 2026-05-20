/**
 * lib/session.ts
 * Helpers para leer / escribir la cookie de sesión JWT en Server Components y API Routes.
 */
import { cookies } from 'next/headers'
import { verifyToken, type SessionPayload } from './auth'

export const SESSION_COOKIE = 'pdmx_session'

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

/** Sólo usable desde API Routes (Response) o Server Actions con setcookie */
export function sessionCookieOptions(token: string) {
  return {
    name:     SESSION_COOKIE,
    value:    token,
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path:     '/',
    maxAge:   60 * 60 * 24 * 7, // 7 días
  }
}
