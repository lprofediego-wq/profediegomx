// middleware.ts  (raíz del proyecto)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refrescar sesión (IMPORTANTE: no eliminar esta llamada)
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Rutas protegidas ──────────────────────────────────────────────
  const isAdminRoute    = pathname.startsWith('/admin')
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isLoginPage     = pathname === '/login'

  // Si no hay sesión e intenta entrar a zona protegida → login
  if (!user && (isAdminRoute || isDashboardRoute)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si hay sesión e intenta entrar al login → redirigir según rol
  if (user && isLoginPage) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const redirect = profile?.role === 'admin' ? '/admin' : '/dashboard'
    return NextResponse.redirect(new URL(redirect, request.url))
  }

  // Proteger /admin: solo rol 'admin'
  if (user && isAdminRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
