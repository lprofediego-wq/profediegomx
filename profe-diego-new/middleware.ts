/**
 * middleware.ts — protección de rutas con JWT (sin Supabase)
 */
import { NextResponse, type NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { SESSION_COOKIE } from '@/lib/session'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? null
  const session = token ? await verifyToken(token) : null

  const isAdmin     = pathname.startsWith('/admin')
  const isDashboard = pathname.startsWith('/dashboard')
  const isLogin     = pathname === '/login'

  // Sin sesión → redirigir a /login
  if (!session && (isAdmin || isDashboard)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Con sesión en /login → redirigir según rol
  if (session && isLogin) {
    return NextResponse.redirect(new URL(
      session.role === 'admin' ? '/admin' : '/dashboard',
      request.url
    ))
  }

  // /admin solo para admins
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
