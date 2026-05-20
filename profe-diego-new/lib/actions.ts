'use server'
/**
 * lib/actions.ts — Server Actions (sin Supabase)
 */
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getSession, SESSION_COOKIE } from '@/lib/session'
import {
  getUserById, updateUser, listUsers,
  grantAccess, revokeAccess, getUserCourseIds,
  markLessonComplete as dbMarkLessonComplete,
  upsertCourse as dbUpsertCourse,
} from '@/lib/db'
import type { Role } from '@/types'

// ── Helper admin ────────────────────────────────────────────────
async function requireAdmin() {
  const session = await getSession()
  if (!session) throw new Error('No autenticado')
  if (session.role !== 'admin') throw new Error('Sin permisos de administrador')
  return session
}

// ── Cambiar rol ─────────────────────────────────────────────────
export async function updateUserRole(userId: string, newRole: Role) {
  await requireAdmin()
  await updateUser(userId, { role: newRole })
  revalidatePath('/admin')
  return { success: true }
}

// ── Activar / desactivar ────────────────────────────────────────
export async function toggleUserActive(userId: string, isActive: boolean) {
  await requireAdmin()
  await updateUser(userId, { is_active: isActive })
  revalidatePath('/admin')
  return { success: true }
}

// ── Dar acceso a un curso ───────────────────────────────────────
export async function grantCourseAccess(userId: string, courseId: string) {
  const admin = await requireAdmin()
  await grantAccess(userId, courseId, admin.sub)
  revalidatePath('/admin')
  return { success: true }
}

// ── Quitar acceso a un curso ────────────────────────────────────
export async function revokeCourseAccess(userId: string, courseId: string) {
  await requireAdmin()
  await revokeAccess(userId, courseId)
  revalidatePath('/admin')
  return { success: true }
}

// ── Marcar lección como completada (alumno) ─────────────────────
export async function markLessonComplete(lessonId: string) {
  const session = await getSession()
  if (!session) throw new Error('No autenticado')
  await dbMarkLessonComplete(session.sub, lessonId)
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
  await requireAdmin()
  await dbUpsertCourse(data)
  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true }
}

// ── Cerrar sesión ───────────────────────────────────────────────
export async function signOut() {
  cookies().set({ name: SESSION_COOKIE, value: '', maxAge: 0, path: '/' })
  redirect('/')
}
