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

// ── Asignaturas ─────────────────────────────────────────────────
import {
  upsertSubject as dbUpsertSubject,
  deleteSubject as dbDeleteSubject,
  upsertLesson as dbUpsertLesson,
  upsertMaterial as dbUpsertMaterial,
  deleteMaterial as dbDeleteMaterial,
  upsertExam as dbUpsertExam,
  upsertQuestion as dbUpsertQuestion,
  deleteQuestion as dbDeleteQuestion,
  saveExamAttempt,
} from '@/lib/db'

export async function upsertSubject(data: {
  id?: string; course_id: string; title: string; description?: string; position: number
}) {
  await requireAdmin()
  await dbUpsertSubject({ ...data, description: data.description ?? null })
  revalidatePath('/admin/cursos')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteSubject(id: string, courseId: string) {
  await requireAdmin()
  await dbDeleteSubject(id, courseId)
  revalidatePath('/admin/cursos')
  return { success: true }
}

export async function upsertLesson(data: {
  id?: string; course_id: string; subject_id?: string | null
  title: string; description?: string; video_url?: string
  duration_sec?: number; position: number; is_free?: boolean
}) {
  await requireAdmin()
  await dbUpsertLesson({
    course_id: data.course_id,
    subject_id: data.subject_id ?? null,
    title: data.title,
    description: data.description ?? null,
    video_url: data.video_url ?? null,
    duration_sec: data.duration_sec ?? 0,
    position: data.position,
    is_free: data.is_free ?? false,
    ...(data.id ? { id: data.id } : {}),
  })
  revalidatePath('/admin/cursos')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function upsertMaterial(data: {
  id?: string; lesson_id: string; title: string; url: string
  type: 'pdf' | 'doc' | 'zip' | 'link' | 'other'
}) {
  await requireAdmin()
  await dbUpsertMaterial(data)
  revalidatePath('/admin/cursos')
  return { success: true }
}

export async function deleteMaterial(id: string, lessonId: string) {
  await requireAdmin()
  await dbDeleteMaterial(id, lessonId)
  revalidatePath('/admin/cursos')
  return { success: true }
}

export async function upsertExam(data: {
  id?: string; course_id: string; title: string; description?: string
  duration_min?: number; pass_score?: number; is_published?: boolean
}) {
  await requireAdmin()
  await dbUpsertExam({ ...data, description: data.description ?? null,
    duration_min: data.duration_min ?? 60, pass_score: data.pass_score ?? 70,
    is_published: data.is_published ?? false })
  revalidatePath('/admin/cursos')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function upsertQuestion(data: {
  id?: string; exam_id: string; question: string; options: string[]
  correct_index: number; explanation?: string; position: number
}) {
  await requireAdmin()
  await dbUpsertQuestion({ ...data, explanation: data.explanation ?? null })
  revalidatePath('/admin/cursos')
  return { success: true }
}

export async function deleteQuestion(id: string, examId: string) {
  await requireAdmin()
  await dbDeleteQuestion(id, examId)
  revalidatePath('/admin/cursos')
  return { success: true }
}

export async function submitExamAttempt(data: {
  exam_id: string; answers: number[]; score: number
}) {
  const session = await getSession()
  if (!session) throw new Error('No autenticado')
  const attempt = await saveExamAttempt({
    exam_id: data.exam_id, user_id: session.sub,
    score: data.score, answers: data.answers,
    completed_at: new Date().toISOString(),
  })
  revalidatePath('/dashboard')
  return { success: true, attempt }
}
