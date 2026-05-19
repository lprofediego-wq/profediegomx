// app/admin/cursos/page.tsx — Gestión de Cursos
import { createClient } from '@/lib/supabase/server'
import { BookOpen, CheckCircle, Clock, DollarSign } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { Course } from '@/types'

const CATEGORY_COLORS: Record<string, string> = {
  'IPN':         'bg-red-50 text-red-600',
  'UNAM':        'bg-yellow-50 text-yellow-700',
  'Cálculo':     'bg-purple-50 text-purple-600',
  'Matemáticas': 'bg-indigo-50 text-indigo-600',
  'Física':      'bg-emerald-50 text-emerald-600',
  'Química':     'bg-orange-50 text-orange-600',
}

export default async function CoursesPage() {
  const supabase = await createClient()
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .order('created_at')

  const all: Course[] = courses ?? []
  const published = all.filter(c => c.is_published)
  const drafts    = all.filter(c => !c.is_published)

  return (
    <div className="p-6 sm:p-8 pt-20 lg:pt-8">
      <div className="mb-7 flex flex-wrap items-start gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Gestión de cursos</h1>
          <p className="text-slate-400 text-[14px] mt-0.5">
            {published.length} publicado{published.length !== 1 ? 's' : ''} · {drafts.length} borrador{drafts.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <div className="px-4 py-2 bg-brand-50 text-brand-700 rounded-xl text-[13px] font-medium border border-brand-100">
          Agrega cursos por SQL o Supabase Dashboard
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
            <CheckCircle size={17} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900">{published.length}</p>
            <p className="text-[11px] text-slate-400">Publicados</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
            <Clock size={17} className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900">{drafts.length}</p>
            <p className="text-[11px] text-slate-400">Borradores</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center">
            <DollarSign size={17} className="text-brand-600" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900">{all.length}</p>
            <p className="text-[11px] text-slate-400">Total cursos</p>
          </div>
        </div>
      </div>

      {/* Tabla de cursos */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <h2 className="font-bold text-slate-900 text-[15px]">Todos los cursos</h2>
        </div>

        {all.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No hay cursos registrados</p>
            <p className="text-slate-400 text-[13px] mt-1">
              Ejecuta el schema SQL para agregar los cursos de ejemplo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Curso</th>
                  <th className="px-5 py-3 text-left">Categoría</th>
                  <th className="px-5 py-3 text-left">Precio</th>
                  <th className="px-5 py-3 text-left">Estado</th>
                  <th className="px-5 py-3 text-left">Slug</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {all.map(course => (
                  <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                          <BookOpen size={14} className="text-brand-600" />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-slate-900">{course.title}</p>
                          {course.description && (
                            <p className="text-[11px] text-slate-400 truncate max-w-[240px]">{course.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {course.category ? (
                        <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${CATEGORY_COLORS[course.category] ?? 'bg-slate-100 text-slate-600'}`}>
                          {course.category}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] font-bold text-slate-900">{formatPrice(course.price)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        course.is_published
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${course.is_published ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {course.is_published ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <code className="text-[11px] bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-mono">
                        /{course.slug}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instrucciones SQL */}
      <div className="mt-6 bg-slate-900 rounded-2xl p-5 text-slate-300">
        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-3">Agregar lecciones via SQL</p>
        <pre className="text-[12px] font-mono overflow-x-auto leading-relaxed text-emerald-400">
{`insert into public.lessons (course_id, title, video_url, position, duration_sec)
values (
  '(uuid-del-curso)',
  'Título de la lección',
  'https://youtu.be/VIDEO_ID',
  1,
  600
);`}
        </pre>
      </div>
    </div>
  )
}
