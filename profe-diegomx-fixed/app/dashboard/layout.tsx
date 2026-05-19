// app/dashboard/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { signOut } from '@/lib/actions'
import { BookOpen, LogOut, User } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') redirect('/admin')

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center border border-brand-100">
              <Image
                src="https://i.ibb.co/d4m853YQ/logo-sin-letras.png"
                alt="Profe Diego MX"
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
            <span className="font-extrabold text-[15px] text-slate-900 hidden sm:block">
              Profe Diego <span className="text-brand-600">MX</span>
            </span>
          </Link>

          {/* Nav center */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            >
              <BookOpen size={14} /> Mis cursos
            </Link>
          </nav>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
                <User size={13} className="text-brand-700" />
              </div>
              <span className="text-[13px] text-slate-600 font-medium max-w-[140px] truncate">
                {profile?.full_name ?? profile?.email}
              </span>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
