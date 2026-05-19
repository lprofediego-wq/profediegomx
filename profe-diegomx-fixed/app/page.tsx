// app/page.tsx — Landing Page
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import CourseCard from '@/components/ui/CourseCard'
import { ArrowRight, Star, Users, BookOpen, Trophy, CheckCircle } from 'lucide-react'
import type { Course } from '@/types'

async function getCourses(): Promise<Course[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('created_at')
  return data ?? []
}

const STATS = [
  { label: 'Alumnos preparados', value: '2,400+', icon: Users },
  { label: 'Cursos disponibles',  value: '12+',    icon: BookOpen },
  { label: 'Tasa de ingreso',     value: '94%',    icon: Trophy },
  { label: 'Calificación media',  value: '4.9 ★',  icon: Star },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Elige tu curso',       desc: 'Selecciona el examen de admisión o materia que quieres dominar.' },
  { step: '02', title: 'Estudia a tu ritmo',   desc: 'Accede a videos, ejercicios y materiales desde cualquier dispositivo.' },
  { step: '03', title: 'Practica y evalúate',  desc: 'Exámenes simulacro con retroalimentación instantánea.' },
  { step: '04', title: '¡Logra tu meta!',      desc: 'Ingresa a la institución de tus sueños con la preparación correcta.' },
]

export default async function LandingPage() {
  const courses = await getCourses()

  return (
    <>
      <Navbar />

      <main className="relative overflow-hidden">
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="relative min-h-[92vh] flex items-center bg-[#f8fafc] overflow-hidden">
          {/* Grid de fondo */}
          <div className="absolute inset-0 bg-hero-grid pointer-events-none" />
          {/* Blobs */}
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-100 rounded-full blur-[120px] opacity-50 pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-sky-50 rounded-full blur-[100px] opacity-60 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24">
            <div className="max-w-3xl">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 border border-brand-100 rounded-full text-brand-700 text-[13px] font-semibold mb-8 animate-fade-in"
                style={{ animationDelay: '0ms' }}
              >
                <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse-slow" />
                Plataforma educativa #1 para exámenes de admisión
              </div>

              {/* Headline */}
              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.05] tracking-tight text-balance animate-slide-up"
                style={{ animationDelay: '80ms' }}
              >
                Prepárate y{' '}
                <span className="text-brand-600 relative">
                  logra tu meta
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                    <path d="M2 9 Q75 2 150 8 Q225 14 298 7" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5"/>
                  </svg>
                </span>
              </h1>

              <p
                className="mt-8 text-xl text-slate-500 leading-relaxed max-w-xl animate-slide-up"
                style={{ animationDelay: '150ms' }}
              >
                Cursos especializados para IPN, UNAM, Cálculo y más.
                Aprende con el Profe Diego y consigue el lugar que mereces.
              </p>

              {/* CTAs */}
              <div
                className="mt-10 flex flex-wrap gap-4 animate-slide-up"
                style={{ animationDelay: '220ms' }}
              >
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-[15px] shadow-lg hover:shadow-blue-500/25 transition-all duration-200 active:scale-95"
                >
                  Comenzar ahora <ArrowRight size={16} />
                </Link>
                <a
                  href="https://wa.me/525574818256"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl font-semibold text-[15px] border border-slate-200 shadow-card hover:shadow-card-hover transition-all duration-200"
                >
                  Más información
                </a>
              </div>

              {/* Social proof */}
              <div
                className="mt-10 flex items-center gap-3 animate-fade-in"
                style={{ animationDelay: '350ms' }}
              >
                <div className="flex -space-x-2">
                  {['CM', 'AV', 'LR', 'JP'].map((init, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold"
                    >
                      {init}
                    </div>
                  ))}
                </div>
                <p className="text-[13px] text-slate-500">
                  <span className="font-bold text-slate-700">+2,400 alumnos</span> ya confían en Profe Diego
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ───────────────────────────────────────────── */}
        <section className="bg-white border-y border-slate-100 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {STATS.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                    <Icon size={18} className="text-brand-600" />
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900">{value}</p>
                  <p className="text-[13px] text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CURSOS ──────────────────────────────────────────── */}
        <section id="cursos" className="py-24 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-brand-600 font-semibold text-[13px] uppercase tracking-widest mb-3">Catálogo completo</p>
              <h2 className="text-4xl font-extrabold text-slate-900">Nuestros cursos</h2>
              <p className="mt-3 text-slate-500 text-[16px] max-w-xl mx-auto">
                Contenido diseñado específicamente para los exámenes de admisión más exigentes de México.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.length > 0 ? (
                courses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))
              ) : (
                // Cursos placeholder si no hay datos aún
                PLACEHOLDER_COURSES.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))
              )}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
              >
                Ver todos los cursos <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ────────────────────────────────────── */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-brand-600 font-semibold text-[13px] uppercase tracking-widest mb-3">Proceso simple</p>
              <h2 className="text-4xl font-extrabold text-slate-900">¿Cómo funciona?</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {HOW_IT_WORKS.map(({ step, title, desc }) => (
                <div key={step} className="relative">
                  <div className="text-[48px] font-black text-brand-100 leading-none mb-3">{step}</div>
                  <h3 className="text-[16px] font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-[14px] text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ───────────────────────────────────────── */}
        <section className="py-24 bg-brand-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-grid opacity-10 pointer-events-none" />
          <div className="relative max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-extrabold text-white mb-4">¿Listo para ingresar?</h2>
            <p className="text-blue-200 text-[16px] mb-8">
              Únete a miles de alumnos que ya aprobaron su examen con Profe Diego MX.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-700 rounded-2xl font-bold hover:bg-blue-50 transition-all"
              >
                Registrarme gratis <ArrowRight size={16} />
              </Link>
              <a
                href="https://wa.me/525574818256"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-brand-700 text-white rounded-2xl font-bold hover:bg-brand-800 transition-all border border-brand-500"
              >
                Hablar con el profe
              </a>
            </div>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────── */}
        <footer className="bg-slate-900 text-slate-400 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="https://i.ibb.co/d4m853YQ/logo-sin-letras.png"
                alt="Profe Diego MX"
                width={32}
                height={32}
                className="object-contain opacity-90"
              />
              <span className="font-bold text-white text-[15px]">Profe Diego MX</span>
            </div>
            <p className="text-[13px]">© {new Date().getFullYear()} Profe Diego MX. Todos los derechos reservados.</p>
          </div>
        </footer>
      </main>

      <WhatsAppButton />
    </>
  )
}

// ── Cursos placeholder para demo visual ──────────────────────────
const PLACEHOLDER_COURSES: Course[] = [
  { id: '1', title: 'Admisión IPN',  description: 'Preparación completa para el examen de admisión al IPN.', slug: 'admision-ipn',  category: 'IPN',         price: 1299, is_published: true, thumbnail: null, created_at: '', updated_at: '' },
  { id: '2', title: 'Admisión UNAM', description: 'Curso intensivo para el CENEVAL / COMIPEMS orientado a UNAM.', slug: 'admision-unam', category: 'UNAM',        price: 1299, is_published: true, thumbnail: null, created_at: '', updated_at: '' },
  { id: '3', title: 'Cálculo I',     description: 'Límites, derivadas e integrales desde cero.', slug: 'calculo-i',      category: 'Cálculo',     price: 999,  is_published: true, thumbnail: null, created_at: '', updated_at: '' },
  { id: '4', title: 'Álgebra',       description: 'Ecuaciones, sistemas y polinomios a fondo.', slug: 'algebra',         category: 'Matemáticas', price: 799,  is_published: true, thumbnail: null, created_at: '', updated_at: '' },
  { id: '5', title: 'Física I',      description: 'Mecánica, cinemática y dinámica.', slug: 'fisica-i',       category: 'Física',      price: 999,  is_published: true, thumbnail: null, created_at: '', updated_at: '' },
  { id: '6', title: 'Química',       description: 'Química inorgánica y orgánica básica.', slug: 'quimica',         category: 'Química',     price: 799,  is_published: true, thumbnail: null, created_at: '', updated_at: '' },
]
