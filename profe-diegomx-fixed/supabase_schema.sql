-- ============================================================
-- PROFE_DIEGOMX — Supabase Schema
-- Ejecuta este script en el SQL Editor de Supabase
-- ============================================================

-- 1. PROFILES (extiende auth.users)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  role       text not null default 'student' check (role in ('student', 'admin')),
  is_active  boolean not null default true,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. COURSES
create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  slug        text unique not null,
  thumbnail   text,
  category    text,       -- 'IPN', 'UNAM', 'Cálculo', etc.
  price       numeric(10,2) default 0,
  is_published boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 3. LESSONS
create table if not exists public.lessons (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  title        text not null,
  description  text,
  video_url    text,        -- URL del iframe (YouTube embed, Vimeo, etc.)
  duration_sec int default 0,
  position     int not null default 0,
  is_free      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- 4. COURSE_ACCESS (qué alumno tiene acceso a qué curso)
create table if not exists public.course_access (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  course_id   uuid not null references public.courses(id) on delete cascade,
  granted_by  uuid references public.profiles(id),
  granted_at  timestamptz not null default now(),
  expires_at  timestamptz,
  unique(user_id, course_id)
);

-- 5. LESSON_PROGRESS (progreso del alumno por lección)
create table if not exists public.lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  lesson_id    uuid not null references public.lessons(id) on delete cascade,
  completed    boolean not null default false,
  watched_sec  int default 0,
  completed_at timestamptz,
  unique(user_id, lesson_id)
);

-- ============================================================
-- TRIGGERS: actualizar updated_at automáticamente
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger courses_updated_at before update on public.courses
  for each row execute function public.handle_updated_at();

-- ============================================================
-- TRIGGER: crear profile automáticamente al registrarse
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.courses        enable row level security;
alter table public.lessons        enable row level security;
alter table public.course_access  enable row level security;
alter table public.lesson_progress enable row level security;

-- PROFILES: cada usuario lee y edita su propio perfil; admins ven todo
create policy "profiles_own_read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles_own_update" on public.profiles for update using (auth.uid() = id);
create policy "profiles_admin_all"  on public.profiles for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- COURSES: alumnos ven publicados; admins gestionan todo
create policy "courses_published_read" on public.courses for select using (is_published = true);
create policy "courses_admin_all"      on public.courses for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- LESSONS: igual que courses
create policy "lessons_published_read" on public.lessons for select using (
  exists (select 1 from public.courses c where c.id = course_id and c.is_published = true)
);
create policy "lessons_admin_all" on public.lessons for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- COURSE_ACCESS: el alumno ve sus propios accesos; admins gestionan todo
create policy "access_own_read"  on public.course_access for select using (auth.uid() = user_id);
create policy "access_admin_all" on public.course_access for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- LESSON_PROGRESS: el alumno gestiona su propio progreso
create policy "progress_own_all" on public.lesson_progress for all using (auth.uid() = user_id);

-- ============================================================
-- DATOS SEMILLA (cursos de ejemplo)
-- ============================================================
insert into public.courses (title, description, slug, category, price, is_published) values
  ('Admisión IPN',  'Preparación completa para el examen de admisión al IPN.', 'admision-ipn',  'IPN',     1299, true),
  ('Admisión UNAM', 'Curso intensivo para el CENEVAL / COMIPEMS orientado a UNAM.', 'admision-unam', 'UNAM',    1299, true),
  ('Cálculo I',     'Límites, derivadas e integrales desde cero.', 'calculo-i',      'Cálculo',  999, true),
  ('Álgebra',       'Ecuaciones, sistemas y polinomios a fondo.', 'algebra',         'Matemáticas', 799, true),
  ('Física I',      'Mecánica, cinemática y dinámica.', 'fisica-i',      'Física',   999, true),
  ('Química',       'Química inorgánica y orgánica básica.', 'quimica',       'Química',  799, true)
on conflict do nothing;
