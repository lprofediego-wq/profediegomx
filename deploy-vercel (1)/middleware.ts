/**
 * middleware.ts — protección de rutas con JWT (sin Supabase)
 * Edge Runtime: NO importar lib/session.ts ni lib/auth.ts (usan bcrypt/next/headers)
 */
import { NextResponse, type NextRequest } from 'next/server'
import { verifyTokenEdge } from '@/lib/jwt'

// Definido aquí directamente para no importar lib/session.ts en Edge
const SESSION_COOKIE = 'pdmx_session'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? null
  const session = token ? await verifyTokenEdge(token) : null

  const isAdmin     = pathname.startsWith('/admin')
  const isDashboard = pathname.startsWith('/dashboard')
  const isLogin     = pathname === '/login'

  if (!session && (isAdmin || isDashboard)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session && isLogin) {
    return NextResponse.redirect(new URL(
      session.role === 'admin' ? '/admin' : '/dashboard',
      request.url
    ))
  }

  if (session && isAdmin && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
