// app/dashboard/curso/[slug]/page.tsx — Aula Virtual
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CourseViewer from '@/components/student/CourseViewer'
import type { Lesson, LessonProgress } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CourseViewerPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obtener curso
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!course) notFound()

  // Verificar acceso
  const { data: access } = await supabase
    .from('course_access')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .single()

  if (!access) {
    redirect('/dashboard')
  }

  // Obtener lecciones
  const { data: lessonsData } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', course.id)
    .order('position')

  const lessons: Lesson[] = lessonsData ?? []

  // Obtener progreso del alumno
  const lessonIds = lessons.map(l => l.id)
  const { data: progressData } = lessonIds.length > 0
    ? await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds)
    : { data: [] }

  const progress: LessonProgress[] = progressData ?? []

  return (
    <CourseViewer
      course={course}
      lessons={lessons}
      progress={progress}
    />
  )
}
