-- Esquema de la base de datos del Cuestionario Clase 7 (Supabase / Postgres).
-- Ejecutar una vez en: Supabase → SQL Editor → New query → pegar todo → Run.
-- Es idempotente: se puede volver a ejecutar sin perder datos.

-- ---------------------------------------------------------------------------
-- Progreso: una fila por usuario con el estado del repaso espaciado.
-- state = { round: int, q: [ { b, n, w, d, t } × 108 ] }
--   b: caja (-1 sin ver, 0 fallada … 5)   n: veces respondida   w: fallos
--   d: tanda en la que toca repasar       t: última respuesta (ms epoch)
-- ---------------------------------------------------------------------------
create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb not null,
  updated_at timestamptz not null default now(),
  constraint progress_state_shape check (jsonb_typeof(state -> 'q') = 'array' and jsonb_array_length(state -> 'q') <= 200),
  constraint progress_state_size  check (pg_column_size(state) < 65536)
);

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists progress_touch on public.progress;
create trigger progress_touch before insert or update on public.progress
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Resultados de los simulacros de examen (historial).
-- ---------------------------------------------------------------------------
create table if not exists public.exam_results (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  score      smallint not null check (score >= 0),
  total      smallint not null check (total between 1 and 200),
  created_at timestamptz not null default now(),
  constraint exam_score_le_total check (score <= total)
);
create index if not exists exam_results_user_created on public.exam_results (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Seguridad (Row Level Security): cada usuario solo ve y modifica lo suyo.
-- La clave pública (anon/publishable) del frontend no puede saltarse esto.
-- ---------------------------------------------------------------------------
alter table public.progress     enable row level security;
alter table public.exam_results enable row level security;

drop policy if exists "progress: leer lo propio"       on public.progress;
drop policy if exists "progress: crear lo propio"      on public.progress;
drop policy if exists "progress: actualizar lo propio" on public.progress;
drop policy if exists "progress: borrar lo propio"     on public.progress;
create policy "progress: leer lo propio"       on public.progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "progress: crear lo propio"      on public.progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "progress: actualizar lo propio" on public.progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "progress: borrar lo propio"     on public.progress for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "exams: leer lo propio"  on public.exam_results;
drop policy if exists "exams: crear lo propio" on public.exam_results;
create policy "exams: leer lo propio"  on public.exam_results for select to authenticated using ((select auth.uid()) = user_id);
create policy "exams: crear lo propio" on public.exam_results for insert to authenticated with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- ping(): consulta mínima que usa el workflow de GitHub Actions para que el
-- proyecto gratuito de Supabase no se pause por inactividad. No expone datos.
-- ---------------------------------------------------------------------------
create or replace function public.ping() returns timestamptz
language sql stable set search_path = '' as $$ select now() $$;
revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;

-- Los usuarios anónimos (sin sesión) no tienen ningún permiso sobre estas tablas.
revoke all on public.progress, public.exam_results from anon;
grant select, insert, update, delete on public.progress to authenticated;
grant select, insert on public.exam_results to authenticated;
