/**
 * lib/db.ts
 * ──────────────────────────────────────────────────────────────────
 * Capa de base de datos sin Supabase.
 *
 * EN PRODUCCIÓN (Netlify):  usa @netlify/blobs  (cero setup externo)
 * EN DESARROLLO LOCAL:      usa .data/db.json   (npm run dev funciona directo)
 *
 * Estructura de claves en el store:
 *   user:{id}                 → StoredUser
 *   user-email:{email}        → string (id del usuario)
 *   users-index               → string[] (todos los IDs)
 *   course:{id}               → Course
 *   course-slug:{slug}        → string (id del curso)
 *   courses-index             → string[] (todos los IDs)
 *   lesson:{id}               → Lesson
 *   lessons-by-course:{cid}   → string[] (IDs de lecciones del curso)
 *   access:{uid}:{cid}        → CourseAccess
 *   access-by-user:{uid}      → string[] (courseIds del usuario)
 *   progress:{uid}:{lid}      → LessonProgress
 *   seeded                    → "1" (flag para no re-sembrar)
 */

import type { Profile, Course, Lesson, CourseAccess, LessonProgress } from '@/types'
import fs from 'fs'
import path from 'path'

// ── Stored user incluye el hash de contraseña ──────────────────────
export interface StoredUser extends Profile {
  password_hash: string
}

// ─────────────────────────────────────────────────────────────────
// Adaptador de almacenamiento (Netlify Blobs vs archivo local)
// ─────────────────────────────────────────────────────────────────

const IS_NETLIFY = !!process.env.NETLIFY
const LOCAL_DB = path.join(process.cwd(), '.data', 'db.json')

// ── Local (desarrollo) ─────────────────────────────────────────────
function ensureLocal() {
  const dir = path.dirname(LOCAL_DB)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(LOCAL_DB)) fs.writeFileSync(LOCAL_DB, '{}', 'utf-8')
}
function lGet(key: string): unknown | null {
  ensureLocal()
  const db = JSON.parse(fs.readFileSync(LOCAL_DB, 'utf-8'))
  return key in db ? db[key] : null
}
function lSet(key: string, val: unknown) {
  ensureLocal()
  const db = JSON.parse(fs.readFileSync(LOCAL_DB, 'utf-8'))
  db[key] = val
  fs.writeFileSync(LOCAL_DB, JSON.stringify(db, null, 2), 'utf-8')
}
function lDel(key: string) {
  ensureLocal()
  const db = JSON.parse(fs.readFileSync(LOCAL_DB, 'utf-8'))
  delete db[key]
  fs.writeFileSync(LOCAL_DB, JSON.stringify(db, null, 2), 'utf-8')
}
function lList(prefix: string): string[] {
  ensureLocal()
  const db = JSON.parse(fs.readFileSync(LOCAL_DB, 'utf-8'))
  return Object.keys(db).filter(k => k.startsWith(prefix))
}

// ── Unificado ──────────────────────────────────────────────────────
async function kGet<T>(key: string): Promise<T | null> {
  if (IS_NETLIFY) {
    const { getStore } = await import('@netlify/blobs')
    const store = getStore('profe-diegomx')
    return (await store.get(key, { type: 'json' })) as T | null
  }
  return lGet(key) as T | null
}
async function kSet(key: string, val: unknown): Promise<void> {
  if (IS_NETLIFY) {
    const { getStore } = await import('@netlify/blobs')
    const store = getStore('profe-diegomx')
    await store.setJSON(key, val)
    return
  }
  lSet(key, val)
}
async function kDel(key: string): Promise<void> {
  if (IS_NETLIFY) {
    const { getStore } = await import('@netlify/blobs')
    const store = getStore('profe-diegomx')
    await store.delete(key)
    return
  }
  lDel(key)
}
async function kList(prefix: string): Promise<string[]> {
  if (IS_NETLIFY) {
    const { getStore } = await import('@netlify/blobs')
    const store = getStore('profe-diegomx')
    const result = await store.list({ prefix })
    return result.blobs.map((b: { key: string }) => b.key)
  }
  return lList(prefix)
}

// ─────────────────────────────────────────────────────────────────
// USUARIOS
// ─────────────────────────────────────────────────────────────────

export async function getUserById(id: string): Promise<StoredUser | null> {
  return kGet<StoredUser>(`user:${id}`)
}

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const id = await kGet<string>(`user-email:${email.toLowerCase()}`)
  if (!id) return null
  return getUserById(id)
}

export async function createUser(user: StoredUser): Promise<void> {
  await kSet(`user:${user.id}`, user)
  await kSet(`user-email:${user.email.toLowerCase()}`, user.id)
  // actualizar índice
  const idx = (await kGet<string[]>('users-index')) ?? []
  if (!idx.includes(user.id)) idx.push(user.id)
  await kSet('users-index', idx)
}

export async function updateUser(id: string, data: Partial<StoredUser>): Promise<void> {
  const user = await getUserById(id)
  if (!user) throw new Error('Usuario no encontrado')
  const updated: StoredUser = { ...user, ...data, id, updated_at: new Date().toISOString() }
  await kSet(`user:${id}`, updated)
}

export async function listUsers(): Promise<StoredUser[]> {
  const idx = (await kGet<string[]>('users-index')) ?? []
  const users = await Promise.all(idx.map(id => getUserById(id)))
  return users.filter(Boolean) as StoredUser[]
}

// ─────────────────────────────────────────────────────────────────
// CURSOS
// ─────────────────────────────────────────────────────────────────

export async function getCourseById(id: string): Promise<Course | null> {
  return kGet<Course>(`course:${id}`)
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const id = await kGet<string>(`course-slug:${slug}`)
  if (!id) return null
  return getCourseById(id)
}

export async function listCourses(publishedOnly = false): Promise<Course[]> {
  const idx = (await kGet<string[]>('courses-index')) ?? []
  const courses = await Promise.all(idx.map(id => getCourseById(id)))
  const all = courses.filter(Boolean) as Course[]
  return publishedOnly ? all.filter(c => c.is_published) : all
}

export async function upsertCourse(data: Partial<Course> & { id?: string; slug: string; title: string }): Promise<Course> {
  const existing = data.id ? await getCourseById(data.id) : null
  const now = new Date().toISOString()
  const course: Course = {
    id: data.id ?? crypto.randomUUID(),
    title: data.title,
    description: data.description ?? null,
    slug: data.slug,
    thumbnail: data.thumbnail ?? null,
    category: data.category ?? null,
    price: data.price ?? 0,
    is_published: data.is_published ?? false,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  }
  await kSet(`course:${course.id}`, course)
  await kSet(`course-slug:${course.slug}`, course.id)
  const idx = (await kGet<string[]>('courses-index')) ?? []
  if (!idx.includes(course.id)) {
    idx.push(course.id)
    await kSet('courses-index', idx)
  }
  return course
}

// ─────────────────────────────────────────────────────────────────
// LECCIONES
// ─────────────────────────────────────────────────────────────────

export async function getLessonById(id: string): Promise<Lesson | null> {
  return kGet<Lesson>(`lesson:${id}`)
}

export async function getLessonsByCourse(courseId: string): Promise<Lesson[]> {
  const ids = (await kGet<string[]>(`lessons-by-course:${courseId}`)) ?? []
  const lessons = await Promise.all(ids.map(id => getLessonById(id)))
  const all = lessons.filter(Boolean) as Lesson[]
  return all.sort((a, b) => a.position - b.position)
}

export async function upsertLesson(data: Omit<Lesson, 'created_at'> & { id?: string }): Promise<Lesson> {
  const existing = data.id ? await getLessonById(data.id) : null
  const now = new Date().toISOString()
  const lesson: Lesson = {
    id: data.id ?? crypto.randomUUID(),
    course_id: data.course_id,
    title: data.title,
    description: data.description ?? null,
    video_url: data.video_url ?? null,
    duration_sec: data.duration_sec ?? 0,
    position: data.position,
    is_free: data.is_free ?? false,
    created_at: existing?.created_at ?? now,
  }
  await kSet(`lesson:${lesson.id}`, lesson)
  // actualizar índice del curso
  const ids = (await kGet<string[]>(`lessons-by-course:${lesson.course_id}`)) ?? []
  if (!ids.includes(lesson.id)) {
    ids.push(lesson.id)
    await kSet(`lessons-by-course:${lesson.course_id}`, ids)
  }
  return lesson
}

// ─────────────────────────────────────────────────────────────────
// ACCESO A CURSOS
// ─────────────────────────────────────────────────────────────────

export async function hasAccess(userId: string, courseId: string): Promise<boolean> {
  const rec = await kGet(`access:${userId}:${courseId}`)
  return rec !== null
}

export async function grantAccess(userId: string, courseId: string, grantedBy: string): Promise<void> {
  const rec: CourseAccess = {
    id: crypto.randomUUID(),
    user_id: userId,
    course_id: courseId,
    granted_by: grantedBy,
    granted_at: new Date().toISOString(),
    expires_at: null,
  }
  await kSet(`access:${userId}:${courseId}`, rec)
  // índice por usuario
  const ids = (await kGet<string[]>(`access-by-user:${userId}`)) ?? []
  if (!ids.includes(courseId)) {
    ids.push(courseId)
    await kSet(`access-by-user:${userId}`, ids)
  }
}

export async function revokeAccess(userId: string, courseId: string): Promise<void> {
  await kDel(`access:${userId}:${courseId}`)
  const ids = (await kGet<string[]>(`access-by-user:${userId}`)) ?? []
  await kSet(`access-by-user:${userId}`, ids.filter(id => id !== courseId))
}

export async function getUserCourseIds(userId: string): Promise<string[]> {
  return (await kGet<string[]>(`access-by-user:${userId}`)) ?? []
}

export async function countAllAccess(): Promise<number> {
  const keys = await kList('access:')
  // filtrar solo las claves de formato access:{uid}:{cid} (no access-by-user:)
  return keys.filter(k => k.startsWith('access:') && !k.startsWith('access-by-user:')).length
}

// ─────────────────────────────────────────────────────────────────
// PROGRESO DE LECCIONES
// ─────────────────────────────────────────────────────────────────

export async function getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | null> {
  return kGet<LessonProgress>(`progress:${userId}:${lessonId}`)
}

export async function getLessonsProgress(userId: string, lessonIds: string[]): Promise<LessonProgress[]> {
  const all = await Promise.all(lessonIds.map(lid => getLessonProgress(userId, lid)))
  return all.filter(Boolean) as LessonProgress[]
}

export async function markLessonComplete(userId: string, lessonId: string): Promise<void> {
  const existing = await getLessonProgress(userId, lessonId)
  const rec: LessonProgress = {
    id: existing?.id ?? crypto.randomUUID(),
    user_id: userId,
    lesson_id: lessonId,
    completed: true,
    watched_sec: existing?.watched_sec ?? 0,
    completed_at: new Date().toISOString(),
  }
  await kSet(`progress:${userId}:${lessonId}`, rec)
}

// ─────────────────────────────────────────────────────────────────
// SEED INICIAL (cursos de ejemplo + admin)
// ─────────────────────────────────────────────────────────────────

export async function seedIfNeeded(): Promise<void> {
  const already = await kGet<string>('seeded')
  if (already) return

  // Cursos de ejemplo
  const seedCourses = [
    { title: 'Admisión IPN',  description: 'Preparación completa para el examen de admisión al IPN.', slug: 'admision-ipn',  category: 'IPN',          price: 1299, is_published: true  },
    { title: 'Admisión UNAM', description: 'Curso intensivo para el CENEVAL / COMIPEMS orientado a UNAM.', slug: 'admision-unam', category: 'UNAM',         price: 1299, is_published: true  },
    { title: 'Cálculo I',     description: 'Límites, derivadas e integrales desde cero.',            slug: 'calculo-i',      category: 'Cálculo',       price:  999, is_published: true  },
    { title: 'Álgebra',       description: 'Ecuaciones, sistemas y polinomios a fondo.',              slug: 'algebra',         category: 'Matemáticas',  price:  799, is_published: true  },
    { title: 'Física I',      description: 'Mecánica, cinemática y dinámica.',                        slug: 'fisica-i',        category: 'Física',        price:  999, is_published: true  },
    { title: 'Química',       description: 'Química inorgánica y orgánica básica.',                   slug: 'quimica',         category: 'Química',       price:  799, is_published: true  },
  ]
  for (const c of seedCourses) await upsertCourse(c)

  // Admin por defecto
  const { hashPassword } = await import('./auth')
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@profediegomx.com'
  const adminPass  = process.env.ADMIN_PASSWORD ?? 'admin123'
  const existing   = await getUserByEmail(adminEmail)
  if (!existing) {
    const admin: StoredUser = {
      id:            crypto.randomUUID(),
      email:         adminEmail,
      full_name:     'Profe Diego',
      role:          'admin',
      is_active:     true,
      avatar_url:    null,
      password_hash: await hashPassword(adminPass),
      created_at:    new Date().toISOString(),
      updated_at:    new Date().toISOString(),
    }
    await createUser(admin)
  }

  await kSet('seeded', '1')
}
