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

export interface Lesson {
  id: string
  course_id: string
  title: string
  description: string | null
  video_url: string | null
  duration_sec: number
  position: number
  is_free: boolean
  created_at: string
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
