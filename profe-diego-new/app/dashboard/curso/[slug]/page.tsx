// app/dashboard/curso/[slug]/page.tsx (sin Supabase)
import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import {
  getCourseBySlug, hasAccess as checkAccess,
  getLessonsByCourse, getLessonsProgress,
} from '@/lib/db'
import CourseViewer from '@/components/student/CourseViewer'
import type { Lesson, LessonProgress } from '@/types'

interface Props { params: { slug: string } }

export default async function CourseViewerPage({ params }: Props) {
  const session = await getSession()
  if (!session) redirect('/login')

  const course = await getCourseBySlug(params.slug)
  if (!course) notFound()

  const access = await checkAccess(session.sub, course.id)
  if (!access) redirect('/dashboard')

  const lessons: Lesson[] = await getLessonsByCourse(course.id)
  const lessonIds = lessons.map(l => l.id)
  const progress: LessonProgress[] = lessonIds.length > 0
    ? await getLessonsProgress(session.sub, lessonIds)
    : []

  return <CourseViewer course={course} lessons={lessons} progress={progress} />
}
