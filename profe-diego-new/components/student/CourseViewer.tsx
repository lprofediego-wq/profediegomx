'use client'
// components/student/CourseViewer.tsx
import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  CheckCircle2, Circle, ChevronLeft, Menu, X,
  Clock, BookOpen, PlayCircle, Award, Lock
} from 'lucide-react'
import { markLessonComplete } from '@/lib/actions'
import { formatDuration } from '@/lib/utils'
import type { Course, Lesson, LessonProgress } from '@/types'

interface Props {
  course: Course
  lessons: Lesson[]
  progress: LessonProgress[]
}

export default function CourseViewer({ course, lessons, progress }: Props) {
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(lessons[0] ?? null)
  const [sidebarOpen, setSidebarOpen]     = useState(false)
  const [isPending, startTransition]      = useTransition()
  const [localProgress, setLocalProgress] = useState<Set<string>>(
    new Set(progress.filter(p => p.completed).map(p => p.lesson_id))
  )

  const completedCount = localProgress.size
  const totalCount     = lessons.length
  const progressPct    = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleComplete = () => {
    if (!currentLesson || localProgress.has(currentLesson.id)) return
    const newSet = new Set(localProgress)
    newSet.add(currentLesson.id)
    setLocalProgress(newSet)
    startTransition(async () => { await markLessonComplete(currentLesson.id) })
  }

  const goNext = () => {
    if (!currentLesson) return
    const idx = lessons.findIndex(l => l.id === currentLesson.id)
    if (idx < lessons.length - 1) setCurrentLesson(lessons[idx + 1])
  }

  const isCompleted = (id: string) => localProgress.has(id)

  const getEmbedUrl = (url: string | null): string | null => {
    if (!url) return null
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`
    const vmMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`
    if (url.includes('/embed/')) return url
    return null
  }

  const embedUrl = getEmbedUrl(currentLesson?.video_url ?? null)
  const currentIdx = lessons.findIndex(l => l.id === currentLesson?.id)

  // ── Sidebar content ───────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-brand-600 text-[13px] font-medium mb-3 hover:text-brand-700"
        >
          <ChevronLeft size={14} /> Mis cursos
        </Link>
        <h2 className="font-bold text-slate-900 text-[14px] leading-snug mb-2">{course.title}</h2>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span>{completedCount}/{totalCount} lecciones</span>
          <span className="font-bold text-brand-600">{progressPct}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {progressPct === 100 && (
          <div className="mt-2.5 flex items-center gap-1.5 text-emerald-600 text-[12px] font-semibold bg-emerald-50 px-2.5 py-1.5 rounded-lg">
            <Award size={13} /> ¡Curso completado! 🎉
          </div>
        )}
      </div>

      {/* Lista lecciones */}
      <div className="flex-1 overflow-y-auto py-2">
        {lessons.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-400 text-[13px]">
            <BookOpen size={24} className="mx-auto mb-2 opacity-30" />
            Aún no hay lecciones en este curso.
          </div>
        ) : (
          lessons.map((lesson, i) => {
            const done   = isCompleted(lesson.id)
            const active = currentLesson?.id === lesson.id
            return (
              <button
                key={lesson.id}
                onClick={() => { setCurrentLesson(lesson); setSidebarOpen(false) }}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                  active
                    ? 'bg-brand-50 border-r-2 border-brand-600'
                    : 'hover:bg-slate-50 border-r-2 border-transparent'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {done
                    ? <CheckCircle2 size={16} className="text-emerald-500" />
                    : active
                      ? <PlayCircle size={16} className="text-brand-600" />
                      : <Circle size={16} className="text-slate-300" />
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] font-medium leading-snug ${
                    active ? 'text-brand-700' : done ? 'text-slate-500' : 'text-slate-700'
                  }`}>
                    <span className="text-[10px] text-slate-300 mr-1">{String(i + 1).padStart(2, '0')}.</span>
                    {lesson.title}
                  </p>
                  {lesson.duration_sec > 0 && (
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock size={10} /> {formatDuration(lesson.duration_sec)}
                    </p>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-56px)] bg-[#f8fafc] overflow-hidden">
      {/* ── Sidebar Desktop ─────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-white border-r border-slate-100 shadow-sm">
        <SidebarContent />
      </aside>

      {/* ── Sidebar Mobile Overlay ───────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-[14px]">Lecciones</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                  <X size={18} className="text-slate-500" />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Barra superior mobile */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <Menu size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-800 truncate">{currentLesson?.title ?? 'Sin lección'}</p>
            <p className="text-[11px] text-slate-400">{course.title}</p>
          </div>
          <span className="text-[11px] font-bold text-brand-600 shrink-0">{progressPct}%</span>
        </div>

        {/* Video + controles */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

            {currentLesson ? (
              <>
                {/* Video player */}
                <div className="relative bg-black rounded-2xl overflow-hidden shadow-xl mb-6">
                  {embedUrl ? (
                    <div className="aspect-video">
                      <iframe
                        src={embedUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={currentLesson.title}
                        referrerPolicy="strict-origin-when-cross-origin"
                        sandbox="allow-scripts allow-same-origin allow-presentation"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-800 to-slate-900">
                      <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                        <Lock size={28} className="text-white/50" />
                      </div>
                      <p className="text-white/50 text-[14px]">Video no disponible</p>
                    </div>
                  )}
                </div>

                {/* Info + acciones */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-bold text-slate-300">
                          Lección {currentIdx + 1} de {totalCount}
                        </span>
                        {isCompleted(currentLesson.id) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full">
                            <CheckCircle2 size={10} /> Completada
                          </span>
                        )}
                      </div>
                      <h1 className="text-xl font-extrabold text-slate-900 mb-1">{currentLesson.title}</h1>
                      {currentLesson.description && (
                        <p className="text-[14px] text-slate-500 leading-relaxed">{currentLesson.description}</p>
                      )}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {!isCompleted(currentLesson.id) && (
                        <button
                          onClick={handleComplete}
                          disabled={isPending}
                          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl font-semibold text-[13px] transition-all active:scale-95"
                        >
                          <CheckCircle2 size={15} />
                          Marcar completada
                        </button>
                      )}
                      {currentIdx < lessons.length - 1 && (
                        <button
                          onClick={goNext}
                          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-[13px] transition-all active:scale-95"
                        >
                          Siguiente lección →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Sin lecciones */
              <div className="aspect-video bg-white rounded-2xl border border-slate-100 shadow-card flex flex-col items-center justify-center gap-4">
                <BookOpen size={48} className="text-slate-200" />
                <div className="text-center">
                  <p className="font-bold text-slate-700 text-[16px]">Próximamente</p>
                  <p className="text-slate-400 text-[14px] mt-1">Las lecciones de este curso se agregarán pronto.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
