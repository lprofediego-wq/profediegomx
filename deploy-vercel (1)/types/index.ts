// types/index.ts

export type Role = 'student' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: Role
  is_active: boolean
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  title: string
  description: string | null
  slug: string
  thumbnail: string | null
  category: string | null
  price: number
  is_published: boolean
  created_at: string
  updated_at: string
}

/** Asignatura / módulo dentro de un curso */
export interface Subject {
  id: string
  course_id: string
  title: string
  description: string | null
  position: number
  created_at: string
}

export interface Lesson {
  id: string
  course_id: string
  subject_id: string | null   // asignatura a la que pertenece
  title: string
  description: string | null
  video_url: string | null
  duration_sec: number
  position: number
  is_free: boolean
  created_at: string
}

/** Material descargable adjunto a una lección */
export interface LessonMaterial {
  id: string
  lesson_id: string
  title: string
  url: string
  type: 'pdf' | 'doc' | 'zip' | 'link' | 'other'
  created_at: string
}

/** Pregunta de examen simulacro */
export interface ExamQuestion {
  id: string
  exam_id: string
  question: string
  options: string[]      // 4 opciones
  correct_index: number  // 0-3
  explanation: string | null
  position: number
}

/** Examen simulacro asociado a un curso */
export interface Exam {
  id: string
  course_id: string
  title: string
  description: string | null
  duration_min: number   // duración en minutos
  pass_score: number     // puntaje mínimo para aprobar (0-100)
  is_published: boolean
  created_at: string
}

/** Resultado de un intento de examen */
export interface ExamAttempt {
  id: string
  exam_id: string
  user_id: string
  score: number          // 0-100
  answers: number[]      // índice respondido por pregunta
  completed_at: string
}

export interface CourseAccess {
  id: string
  user_id: string
  course_id: string
  granted_by: string | null
  granted_at: string
  expires_at: string | null
}

export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  completed: boolean
  watched_sec: number
  completed_at: string | null
}

export interface LessonWithProgress extends Lesson {
  progress?: LessonProgress | null
}

export interface CourseWithAccess extends Course {
  hasAccess?: boolean
  progress?: number
}

export interface ProfileWithCourses extends Profile {
  course_access?: CourseAccess[]
}
