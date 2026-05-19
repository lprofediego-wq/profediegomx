// app/admin/page.tsx — Dashboard del Administrador
import { createClient } from '@/lib/supabase/server'
import { Users, BookOpen, TrendingUp, UserCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'

async function getKPIs() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: totalCourses },
    { count: totalAccess },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('course_access').select('*', { count: 'exact', head: true }),
  ])

  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at, is_active')
    .order('created_at', { ascending: false })
    .limit(5)

  return { totalUsers, activeUsers, totalCourses, totalAccess, recentUsers }
}

export default async function AdminDashboardPage() {
  const { totalUsers, activeUsers, totalCourses, totalAccess, recentUsers } = await getKPIs()

  const kpis = [
    { label: 'Total alumnos',     value: totalUsers ?? 0,   icon: Users,      color: 'bg-blue-50 text-blue-600',     border: 'border-blue-100'    },
    { label: 'Alumnos activos',   value: activeUsers ?? 0,  icon: UserCheck,  color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
    { label: 'Cursos publicados', value: totalCourses ?? 0, icon: BookOpen,   color: 'bg-purple-50 text-purple-600', border: 'border-purple-100'  },
    { label: 'Accesos otorgados', value: totalAccess ?? 0,  icon: TrendingUp, color: 'bg-amber-50 text-amber-600',   border: 'border-amber-100'   },
  ]

  return (
    <div className="p-6 sm:p-8 pt-20 lg:pt-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="text-slate-400 text-[14px] mt-0.5">Resumen general de la plataforma</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(kpi => (
          <div key={kpi.label} className={`bg-white rounded-2xl border ${kpi.border} p-5 shadow-card`}>
            <div className={`w-10 h-10 rounded-xl ${kpi.color} flex items-center justify-center mb-3`}>
              <kpi.icon size={18} />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{kpi.value}</p>
            <p className="text-[12px] text-slate-400 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <Link
          href="/admin/usuarios"
          className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
        >
          <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center group-hover:bg-brand-100 transition-colors">
            <Users size={20} className="text-brand-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 text-[15px]">Gestionar usuarios</p>
            <p className="text-slate-400 text-[13px]">Roles, accesos y estado de cuentas</p>
          </div>
          <ArrowRight size={16} className="text-slate-300 group-hover:text-brand-600 transition-colors" />
        </Link>

        <Link
          href="/admin/cursos"
          className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
        >
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
            <BookOpen size={20} className="text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 text-[15px]">Gestionar cursos</p>
            <p className="text-slate-400 text-[13px]">Publicar, editar y organizar cursos</p>
          </div>
          <ArrowRight size={16} className="text-slate-300 group-hover:text-purple-600 transition-colors" />
        </Link>
      </div>

      {/* Alumnos recientes */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-[15px]">Últimos registros</h2>
          <Link href="/admin/usuarios" className="text-[12px] text-brand-600 hover:text-brand-700 font-medium">
            Ver todos →
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {recentUsers?.map(u => (
            <div key={u.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 text-[11px] font-bold shrink-0">
                  {(u.full_name ?? u.email).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-slate-800 truncate">{u.full_name ?? '—'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  u.role === 'admin'
                    ? 'bg-brand-100 text-brand-700'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {u.role === 'admin' ? 'Admin' : 'Alumno'}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-slate-300'}`} />
              </div>
            </div>
          ))}
          {!recentUsers?.length && (
            <div className="py-8 text-center text-slate-400 text-[14px]">
              Aún no hay registros.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
