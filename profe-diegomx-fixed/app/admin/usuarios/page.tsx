// app/admin/usuarios/page.tsx — Gestión de Usuarios
import { createClient } from '@/lib/supabase/server'
import UserManagementClient from '@/components/admin/UserManagementClient'

async function getData() {
  const supabase = await createClient()

  const [
    { data: profiles },
    { data: courses },
    { data: allAccess },
  ] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('courses').select('id, title, category').eq('is_published', true),
    supabase.from('course_access').select('user_id, course_id'),
  ])

  return { profiles: profiles ?? [], courses: courses ?? [], allAccess: allAccess ?? [] }
}

export default async function UsersPage() {
  const { profiles, courses, allAccess } = await getData()

  return (
    <div className="p-6 sm:p-8 pt-20 lg:pt-8">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold text-slate-900">Gestión de usuarios</h1>
        <p className="text-slate-400 text-[14px] mt-0.5">
          {profiles.length} usuario{profiles.length !== 1 ? 's' : ''} registrado{profiles.length !== 1 ? 's' : ''}
        </p>
      </div>
      <UserManagementClient
        profiles={profiles}
        courses={courses}
        allAccess={allAccess}
      />
    </div>
  )
}
