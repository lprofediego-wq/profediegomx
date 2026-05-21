export const dynamic = 'force-dynamic'
import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import {
  getCourseBySlug, hasAccess as checkAccess,
  getLessonsByCourse, getLessonsProgress,
  getSubjectsByCourse, getMaterialsByLesson,
  getExamsByCourse, getQuestionsByExam, getAttemptsByUserExam,
} from '@/lib/db'
import CourseViewer from '@/components/student/CourseViewer'
import type { Lesson, LessonProgress, LessonMaterial, ExamQuestion, ExamAttempt } from '@/types'

interface Props { params: { slug: string } }

export default async function CourseViewerPage({ params }: Props) {
  const session = await getSession()
  if (!session) redirect('/login')

  const course = await getCourseBySlug(params.slug)
  if (!course) notFound()

  const access = await checkAccess(session.sub, course.id)
  if (!access) redirect('/dashboard')

  const [lessons, subjects, exams] = await Promise.all([
    getLessonsByCourse(course.id),
    getSubjectsByCourse(course.id),
    getExamsByCourse(course.id),
  ])

  const lessonIds = lessons.map((l: Lesson) => l.id)
  const progress: LessonProgress[] = lessonIds.length > 0
    ? await getLessonsProgress(session.sub, lessonIds)
    : []

  // Materials per lesson
  const materialsArr = await Promise.all(lessonIds.map((id: string) => getMaterialsByLesson(id)))
  const materials: Record<string, LessonMaterial[]> = {}
  lessonIds.forEach((id: string, i: number) => { materials[id] = materialsArr[i] })

  // Exam questions & attempts
  const examQuestions: Record<string, ExamQuestion[]> = {}
  const examAttempts: Record<string, ExamAttempt[]>   = {}
  await Promise.all(exams.map(async (exam: { id: string }) => {
    examQuestions[exam.id] = await getQuestionsByExam(exam.id)
    examAttempts[exam.id]  = await getAttemptsByUserExam(session.sub, exam.id)
  }))

  return (
    <CourseViewer
      course={course}
      subjects={subjects}
      lessons={lessons}
      progress={progress}
      materials={materials}
      exams={exams}
      examQuestions={examQuestions}
      examAttempts={examAttempts}
    />
  )
}
