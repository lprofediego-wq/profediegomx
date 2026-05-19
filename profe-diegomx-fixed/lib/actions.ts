'use server'
// lib/actions.ts — Server Actions (Next.js 15 App Router)

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Role } from '@/types'

// ── Helper: verificar que el llamante es admin ──────────────────
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Sin permisos de administrador')
  return { supabase, adminId: user.id }
}

// ── Cambiar rol de un usuario ───────────────────────────────────
export async function updateUserRole(userId: string, newRole: Role) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  return { success: true }
}

// ── Activar / desactivar usuario ────────────────────────────────
export async function toggleUserActive(userId: string, isActive: boolean) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  return { success: true }
}

// ── Dar acceso a un curso ────────────────────────────────────────
export async function grantCourseAccess(userId: string, courseId: string) {
  const { supabase, adminId } = await requireAdmin()

  const { error } = await supabase
    .from('course_access')
    .upsert({ user_id: userId, course_id: courseId, granted_by: adminId })

  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  return { success: true }
}

// ── Quitar acceso a un curso ─────────────────────────────────────
export async function revokeCourseAccess(userId: string, courseId: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('course_access')
    .delete()
    .eq('user_id', userId)
    .eq('course_id', courseId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  return { success: true }
}

// ── Marcar lección como completada (alumno) ─────────────────────
export async function markLessonComplete(lessonId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('lesson_progress')
    .upsert({
      user_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
    })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  return { success: true }
}

// ── Crear / actualizar curso ────────────────────────────────────
export async function upsertCourse(data: {
  id?: string
  title: string
  description?: string
  slug: string
  category?: string
  price?: number
  thumbnail?: string
  is_published?: boolean
}) {
  const { supabase } = await requireAdmin()

  const { error } = data.id
    ? await supabase.from('courses').update(data).eq('id', data.id)
    : await supabase.from('courses').insert(data)

  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true }
}

// ── Cerrar sesión ───────────────────────────────────────────────
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/')
}
