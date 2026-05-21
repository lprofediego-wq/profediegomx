/**
 * lib/db.ts
 * ──────────────────────────────────────────────────────────────────
 * Capa de base de datos sin Supabase.
 *
 * EN PRODUCCIÓN (Vercel): usa @vercel/kv (Redis, cero setup externo)
 * EN DESARROLLO LOCAL:    usa .data/db.json
 */

import type { Profile, Course, Lesson, CourseAccess, LessonProgress } from '@/types'
import fs from 'fs'
import path from 'path'

export interface StoredUser extends Profile {
  password_hash: string
}

// ─────────────────────────────────────────────────────────────────
// Detección de entorno
// ─────────────────────────────────────────────────────────────────

const IS_VERCEL = !!process.env.VERCEL || !!process.env.KV_REST_API_URL
const LOCAL_DB  = path.join(process.cwd(), '.data', 'db.json')

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

// ── Vercel KV ──────────────────────────────────────────────────────
async function vGet<T>(key: string): Promise<T | null> {
  try {
    const { kv } = await import('@vercel/kv')
    return await kv.get<T>(key)
  } catch (e) {
    console.error('[db] vGet error:', e)
    return null
  }
}
async function vSet(key: string, val: unknown): Promise<void> {
  try {
    const { kv } = await import('@vercel/kv')
    await kv.set(key, val)
  } catch (e) {
    console.error('[db] vSet error:', e)
  }
}
async function vDel(key: string): Promise<void> {
  try {
    const { kv } = await import('@vercel/kv')
    await kv.del(key)
  } catch (e) {
    console.error('[db] vDel error:', e)
  }
}
async function vList(prefix: string): Promise<string[]> {
  try {
    const { kv } = await import('@vercel/kv')
    // scan con patrón prefix*
    let cursor = 0
    const keys: string[] = []
    do {
      const [nextCursor, batch] = await kv.scan(cursor, { match: `${prefix}*`, count: 100 })
      keys.push(...(batch as string[]))
      cursor = nextCursor as number
    } while (cursor !== 0)
    return keys
  } catch (e) {
    console.error('[db] vList error:', e)
    return []
  }
}

// ── Unificado ──────────────────────────────────────────────────────
async function kGet<T>(key: string): Promise<T | null> {
  if (IS_VERCEL) return vGet<T>(key)
  return lGet(key) as T | null
}
async function kSet(key: string, val: unknown): Promise<void> {
  if (IS_VERCEL) return vSet(key, val)
  lSet(key, val)
}
async function kDel(key: string): Promise<void> {
  if (IS_VERCEL) return vDel(key)
  lDel(key)
}
async function kList(prefix: string): Promise<string[]> {
  if (IS_VERCEL) return vList(prefix)
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
// SEED INICIAL
// ─────────────────────────────────────────────────────────────────

export async function seedIfNeeded(): Promise<void> {
  try {
    const already = await kGet<string>('seeded')
    if (already) return

    const seedCourses = [
      { title: 'Admisión IPN',  description: 'Preparación completa para el examen de admisión al IPN.', slug: 'admision-ipn',  category: 'IPN',         price: 1299, is_published: true },
      { title: 'Admisión UNAM', description: 'Curso intensivo para el CENEVAL / COMIPEMS orientado a UNAM.', slug: 'admision-unam', category: 'UNAM',        price: 1299, is_published: true },
      { title: 'Cálculo I',     description: 'Límites, derivadas e integrales desde cero.',            slug: 'calculo-i',     category: 'Cálculo',      price:  999, is_published: true },
      { title: 'Álgebra',       description: 'Ecuaciones, sistemas y polinomios a fondo.',              slug: 'algebra',        category: 'Matemáticas', price:  799, is_published: true },
      { title: 'Física I',      description: 'Mecánica, cinemática y dinámica.',                        slug: 'fisica-i',       category: 'Física',       price:  999, is_published: true },
      { title: 'Química',       description: 'Química inorgánica y orgánica básica.',                   slug: 'quimica',        category: 'Química',      price:  799, is_published: true },
    ]
    for (const c of seedCourses) await upsertCourse(c)

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
  } catch (e) {
    console.error('[db] seedIfNeeded error (non-fatal):', e)
  }
}

// ─────────────────────────────────────────────────────────────────
// ASIGNATURAS / MÓDULOS
// ─────────────────────────────────────────────────────────────────

import type { Subject, LessonMaterial, Exam, ExamQuestion, ExamAttempt } from '@/types'

export async function getSubjectsByCourse(courseId: string): Promise<Subject[]> {
  const ids = (await kGet<string[]>(`subjects-by-course:${courseId}`)) ?? []
  const subjects = await Promise.all(ids.map(id => kGet<Subject>(`subject:${id}`)))
  const all = subjects.filter(Boolean) as Subject[]
  return all.sort((a, b) => a.position - b.position)
}
export async function upsertSubject(data: Omit<Subject, 'created_at'> & { id?: string }): Promise<Subject> {
  const existing = data.id ? await kGet<Subject>(`subject:${data.id}`) : null
  const now = new Date().toISOString()
  const subject: Subject = {
    id: data.id ?? crypto.randomUUID(),
    course_id: data.course_id,
    title: data.title,
    description: data.description ?? null,
    position: data.position,
    created_at: (existing as Subject | null)?.created_at ?? now,
  }
  await kSet(`subject:${subject.id}`, subject)
  const ids = (await kGet<string[]>(`subjects-by-course:${subject.course_id}`)) ?? []
  if (!ids.includes(subject.id)) {
    ids.push(subject.id)
    await kSet(`subjects-by-course:${subject.course_id}`, ids)
  }
  return subject
}
export async function deleteSubject(id: string, courseId: string): Promise<void> {
  await kDel(`subject:${id}`)
  const ids = (await kGet<string[]>(`subjects-by-course:${courseId}`)) ?? []
  await kSet(`subjects-by-course:${courseId}`, ids.filter(i => i !== id))
}

// ─────────────────────────────────────────────────────────────────
// MATERIAL DE LECCIONES
// ─────────────────────────────────────────────────────────────────

export async function getMaterialsByLesson(lessonId: string): Promise<LessonMaterial[]> {
  const ids = (await kGet<string[]>(`materials-by-lesson:${lessonId}`)) ?? []
  const mats = await Promise.all(ids.map(id => kGet<LessonMaterial>(`material:${id}`)))
  return mats.filter(Boolean) as LessonMaterial[]
}
export async function upsertMaterial(data: Omit<LessonMaterial, 'created_at'> & { id?: string }): Promise<LessonMaterial> {
  const now = new Date().toISOString()
  const mat: LessonMaterial = {
    id: data.id ?? crypto.randomUUID(),
    lesson_id: data.lesson_id,
    title: data.title,
    url: data.url,
    type: data.type,
    created_at: now,
  }
  await kSet(`material:${mat.id}`, mat)
  const ids = (await kGet<string[]>(`materials-by-lesson:${mat.lesson_id}`)) ?? []
  if (!ids.includes(mat.id)) {
    ids.push(mat.id)
    await kSet(`materials-by-lesson:${mat.lesson_id}`, ids)
  }
  return mat
}
export async function deleteMaterial(id: string, lessonId: string): Promise<void> {
  await kDel(`material:${id}`)
  const ids = (await kGet<string[]>(`materials-by-lesson:${lessonId}`)) ?? []
  await kSet(`materials-by-lesson:${lessonId}`, ids.filter(i => i !== id))
}

// ─────────────────────────────────────────────────────────────────
// EXÁMENES SIMULACRO
// ─────────────────────────────────────────────────────────────────

export async function getExamsByCourse(courseId: string): Promise<Exam[]> {
  const ids = (await kGet<string[]>(`exams-by-course:${courseId}`)) ?? []
  const exams = await Promise.all(ids.map(id => kGet<Exam>(`exam:${id}`)))
  return exams.filter(Boolean) as Exam[]
}
export async function getExamById(id: string): Promise<Exam | null> {
  return kGet<Exam>(`exam:${id}`)
}
export async function upsertExam(data: Omit<Exam, 'created_at'> & { id?: string }): Promise<Exam> {
  const existing = data.id ? await kGet<Exam>(`exam:${data.id}`) : null
  const now = new Date().toISOString()
  const exam: Exam = {
    id: data.id ?? crypto.randomUUID(),
    course_id: data.course_id,
    title: data.title,
    description: data.description ?? null,
    duration_min: data.duration_min ?? 60,
    pass_score: data.pass_score ?? 70,
    is_published: data.is_published ?? false,
    created_at: (existing as Exam | null)?.created_at ?? now,
  }
  await kSet(`exam:${exam.id}`, exam)
  const ids = (await kGet<string[]>(`exams-by-course:${exam.course_id}`)) ?? []
  if (!ids.includes(exam.id)) {
    ids.push(exam.id)
    await kSet(`exams-by-course:${exam.course_id}`, ids)
  }
  return exam
}

// ─────────────────────────────────────────────────────────────────
// PREGUNTAS DE EXAMEN
// ─────────────────────────────────────────────────────────────────

export async function getQuestionsByExam(examId: string): Promise<ExamQuestion[]> {
  const ids = (await kGet<string[]>(`questions-by-exam:${examId}`)) ?? []
  const qs = await Promise.all(ids.map(id => kGet<ExamQuestion>(`question:${id}`)))
  const all = qs.filter(Boolean) as ExamQuestion[]
  return all.sort((a, b) => a.position - b.position)
}
export async function upsertQuestion(data: Omit<ExamQuestion, never> & { id?: string }): Promise<ExamQuestion> {
  const q: ExamQuestion = {
    id: data.id ?? crypto.randomUUID(),
    exam_id: data.exam_id,
    question: data.question,
    options: data.options,
    correct_index: data.correct_index,
    explanation: data.explanation ?? null,
    position: data.position,
  }
  await kSet(`question:${q.id}`, q)
  const ids = (await kGet<string[]>(`questions-by-exam:${q.exam_id}`)) ?? []
  if (!ids.includes(q.id)) {
    ids.push(q.id)
    await kSet(`questions-by-exam:${q.exam_id}`, ids)
  }
  return q
}
export async function deleteQuestion(id: string, examId: string): Promise<void> {
  await kDel(`question:${id}`)
  const ids = (await kGet<string[]>(`questions-by-exam:${examId}`)) ?? []
  await kSet(`questions-by-exam:${examId}`, ids.filter(i => i !== id))
}

// ─────────────────────────────────────────────────────────────────
// INTENTOS DE EXAMEN
// ─────────────────────────────────────────────────────────────────

export async function saveExamAttempt(attempt: Omit<ExamAttempt, 'id'>): Promise<ExamAttempt> {
  const rec: ExamAttempt = { id: crypto.randomUUID(), ...attempt }
  await kSet(`attempt:${rec.id}`, rec)
  const ids = (await kGet<string[]>(`attempts-by-user-exam:${rec.user_id}:${rec.exam_id}`)) ?? []
  ids.push(rec.id)
  await kSet(`attempts-by-user-exam:${rec.user_id}:${rec.exam_id}`, ids)
  return rec
}
export async function getAttemptsByUserExam(userId: string, examId: string): Promise<ExamAttempt[]> {
  const ids = (await kGet<string[]>(`attempts-by-user-exam:${userId}:${examId}`)) ?? []
  const attempts = await Promise.all(ids.map(id => kGet<ExamAttempt>(`attempt:${id}`)))
  return (attempts.filter(Boolean) as ExamAttempt[]).sort((a, b) =>
    new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  )
}
