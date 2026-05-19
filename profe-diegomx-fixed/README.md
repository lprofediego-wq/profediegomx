# Profe Diego MX — Plataforma Educativa

Plataforma educativa premium construida con **Next.js 15**, **Tailwind CSS**, **Framer Motion** y **Supabase**.

---

## Stack técnico

| Tecnología     | Versión  | Uso                                  |
|----------------|----------|--------------------------------------|
| Next.js        | 15       | App Router, Server Actions, Middleware |
| Supabase       | ^2.45    | Auth, Base de datos, RLS             |
| Tailwind CSS   | ^3.4     | Estilos y diseño                     |
| Framer Motion  | ^11      | Animaciones                          |
| TypeScript     | ^5       | Tipos                                |

---

## Instalación rápida

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.local.example .env.local
# Edita .env.local con tus credenciales de Supabase

# 3. Ejecutar en desarrollo
npm run dev
```

---

## Configurar Supabase

### 1. Ejecutar el schema SQL
1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Abre **SQL Editor**
3. Pega y ejecuta todo el contenido de `supabase_schema.sql`

### 2. Variables de entorno
En `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Configurar Auth en Supabase
- **Authentication → Settings → Site URL**: `http://localhost:3000`
- **Email Confirmation**: actívalo o desactívalo según prefieras para pruebas

### 4. Crear el primer Admin
Después de registrarte en la app, ve a Supabase → **Table Editor → profiles** y cambia manualmente tu `role` de `student` a `admin`.

---

## Estructura del proyecto

```
profe-diegomx/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout
│   ├── login/page.tsx        # Página de acceso
│   ├── dashboard/
│   │   ├── layout.tsx        # Layout alumno (nav top)
│   │   ├── page.tsx          # Mis cursos
│   │   └── curso/[slug]/page.tsx  # Aula virtual
│   └── admin/
│       ├── layout.tsx        # Layout admin (sidebar)
│       ├── page.tsx          # Dashboard con KPIs
│       ├── usuarios/page.tsx # Gestión de usuarios
│       └── cursos/page.tsx   # Gestión de cursos
├── components/
│   ├── layout/               # Navbar, Hero, Stats
│   ├── ui/                   # CourseCard, WhatsAppButton
│   ├── admin/                # Sidebar, UserManagement
│   └── student/              # CourseViewer, MobileHeader
├── lib/
│   ├── actions.ts            # Server Actions
│   ├── utils.ts              # Helpers
│   └── supabase/
│       ├── client.ts         # Browser client
│       └── server.ts         # Server client
├── types/index.ts            # TypeScript types
├── middleware.ts             # Protección de rutas
└── supabase_schema.sql       # Schema completo
```

---

## Sistema de roles

| Rol       | Acceso                                              |
|-----------|-----------------------------------------------------|
| `student` | `/dashboard` — Ve sus cursos asignados y estudia    |
| `admin`   | `/admin` — KPIs, gestión de usuarios y cursos       |

**Flujo de login:**
1. Usuario entra a `/login` y se autentica
2. El middleware consulta `profiles.role`
3. Redirige a `/admin` (admin) o `/dashboard` (alumno)

---

## Funcionalidades

### Landing Page (`/`)
- Hero animado con Framer Motion
- Grid de cursos con tarjetas
- Sección de estadísticas
- Sección "Cómo funciona"
- Botón flotante de WhatsApp

### Panel Admin (`/admin`)
- **Dashboard**: KPIs en tiempo real
- **Usuarios**: Tabla con búsqueda, cambio de rol, toggle activo/inactivo, asignación de cursos por usuario
- **Cursos**: Lista de cursos con estado de publicación

### Aula Virtual (`/dashboard/curso/[slug]`)
- Reproductor de video (YouTube/Vimeo embed) que no navega fuera del sitio
- Sidebar con lista de lecciones y progreso visual
- Marcar lecciones como completadas
- Barra de progreso por curso

---

## Agregar lecciones a un curso

Por ahora vía SQL (próxima mejora: UI de admin):
```sql
insert into public.lessons (course_id, title, video_url, position, duration_sec)
values (
  '(uuid del curso)',
  'Título de la lección',
  'https://youtu.be/VIDEO_ID',
  1,
  600
);
```

---

## WhatsApp
El botón flotante y los CTAs apuntan a `+52 55 7481 8256`. Para cambiar el número, edita `PHONE` en `components/ui/WhatsAppButton.tsx` y los `href` en los otros componentes.

---

## Despliegue en Vercel

```bash
# Conecta el repo a Vercel y agrega las variables de entorno:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
```

En Supabase → Auth → URL Configuration agrega:
- Site URL: `https://tu-dominio.com`
- Redirect URLs: `https://tu-dominio.com/**`
