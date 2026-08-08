-- 0011 — La operación se aísla por comunidad en la BASE, no solo en la app
-- ─────────────────────────────────────────────────────────────────────────────
-- Problema que cierra: `talleres`, `educadores`, `grupos`, `colaboradores`,
-- `grupos_educadores`, `taller_asignaciones_educadores` y los `feedback_*` estaban en
-- `authenticated using(true)`. Los filtros por `comunidad_id` viven en los composables, y
-- esos NO son una barrera: la anon key viaja en el bundle, así que cualquier usuario
-- legítimo (p. ej. un colaborador de un cliente) podía pedirle a PostgREST la operación de
-- TODAS las organizaciones sin pasar por la app. Además Realtime no tiene dónde aplicar un
-- filtro de app: sin RLS, publicar `talleres` sería transmitir la operación de todos a todos.
--
-- ── Por qué UNA función SECURITY DEFINER y no subconsultas inline ─────────────
-- El patrón inline de 0002/0005/0006 no sirve acá: `comunidades_select` ya consulta
-- `colaboradores`, así que darle a `colaboradores` una política que consulte `comunidades`
-- forma un ciclo (Postgres aplica RLS también dentro de las subconsultas de una política):
--     talleres → colaboradores → comunidades → colaboradores → …
-- Una función SECURITY DEFINER no aplica RLS por dentro, y ahí se corta el ciclo. Es la
-- razón por la que existían los `rls_*()` que la 026 borró — pero acá es **una** función con
-- un parámetro, no once, así que sigue siendo depurable de un vistazo.
--
-- ── Qué NO toca esta migración ────────────────────────────────────────────────
-- `perfiles` y `organizaciones` siguen abiertas a cualquier autenticado. Se leen por embed
-- en muchas consultas de Platform y del nivel organización (`administradores:...(perfil:perfiles(...))`),
-- así que apretarlas necesita su propia pasada, revisando cada embed. Queda anotado.
--
-- Quien bypasea esto a propósito: `service_role` (Edge Functions) y `handle_new_user()`,
-- que es SECURITY DEFINER — por eso aceptar una invitación sigue creando la fila de
-- `colaboradores` sin problema.

-- ── El alcance de la persona autenticada ─────────────────────────────────────
-- Devuelve los ids de comunidad que alcanzo:
--   · superadmin  → todas
--   · admin de la organización dueña → las de sus orgs
--   · colaborador activo → la suya (SOLO para lectura; ver `solo_administradas`)
--
-- `solo_administradas = true` deja fuera la rama de colaborador: se usa donde mandar sobre
-- la membresía es del admin, no del colaborador (si no, un colaborador podría desactivar a
-- otro de su misma comunidad).
create or replace function mis_comunidades(solo_administradas boolean default false)
returns setof bigint
language sql
stable
security definer
set search_path = public
as $$
  select c.id
    from comunidades c
   where exists (select 1 from perfiles p where p.usuario_id = auth.uid() and p.superadmin)
  union
  select c.id
    from comunidades c
   where c.organizacion_id in (
           select oa.organizacion_id
             from organizacion_administradores oa
             join perfiles p on p.id = oa.perfil_id
            where p.usuario_id = auth.uid())
  union
  select co.comunidad_id
    from colaboradores co
    join perfiles p on p.id = co.perfil_id
   where p.usuario_id = auth.uid()
     and co.activo
     and not solo_administradas
$$;

-- Solo la usan las políticas, que se evalúan como el rol que consulta. `anon` no la necesita
-- (y con `auth.uid()` nulo no devolvería nada de todos modos).
revoke all on function mis_comunidades(boolean) from public;
grant execute on function mis_comunidades(boolean) to authenticated;

-- ── Tablas con `comunidad_id` propio ─────────────────────────────────────────
drop policy if exists talleres_authenticated on talleres;
create policy talleres_acceso on talleres for all to authenticated
  using (comunidad_id in (select mis_comunidades()))
  with check (comunidad_id in (select mis_comunidades()));

drop policy if exists educadores_authenticated on educadores;
create policy educadores_acceso on educadores for all to authenticated
  using (comunidad_id in (select mis_comunidades()))
  with check (comunidad_id in (select mis_comunidades()));

drop policy if exists grupos_authenticated on grupos;
create policy grupos_acceso on grupos for all to authenticated
  using (comunidad_id in (select mis_comunidades()))
  with check (comunidad_id in (select mis_comunidades()));

drop policy if exists feedback_storyboard_authenticated on feedback_storyboard;
create policy feedback_storyboard_acceso on feedback_storyboard for all to authenticated
  using (comunidad_id in (select mis_comunidades()))
  with check (comunidad_id in (select mis_comunidades()));

-- ── Membresía: leer el equipo sí, administrarlo no ───────────────────────────
-- Un colaborador ve a su equipo (la página de Colaboradores lo lista), pero activar,
-- desactivar o quitar a alguien es del admin de la organización.
drop policy if exists colaboradores_authenticated on colaboradores;
create policy colaboradores_lectura on colaboradores for select to authenticated
  using (comunidad_id in (select mis_comunidades()));
create policy colaboradores_gestion on colaboradores for all to authenticated
  using (comunidad_id in (select mis_comunidades(true)))
  with check (comunidad_id in (select mis_comunidades(true)));

-- ── Tablas puente: cuelgan de otra fila, no tienen `comunidad_id` ────────────
-- Estas subconsultas leen `grupos`/`talleres`, cuyas políticas ya resuelven por
-- `mis_comunidades()` (SECURITY DEFINER) — no hay ciclo posible.
drop policy if exists grupos_educadores_authenticated on grupos_educadores;
create policy grupos_educadores_acceso on grupos_educadores for all to authenticated
  using (grupo_id in (select g.id from grupos g where g.comunidad_id in (select mis_comunidades())))
  with check (grupo_id in (select g.id from grupos g where g.comunidad_id in (select mis_comunidades())));

drop policy if exists taller_asignaciones_educadores_authenticated on taller_asignaciones_educadores;
create policy taller_asignaciones_educadores_acceso on taller_asignaciones_educadores for all to authenticated
  using (taller_id in (select t.id from talleres t where t.comunidad_id in (select mis_comunidades())))
  with check (taller_id in (select t.id from talleres t where t.comunidad_id in (select mis_comunidades())));

-- `feedback_taller` cuelga de la asignación, que cuelga del taller.
drop policy if exists feedback_taller_authenticated on feedback_taller;
create policy feedback_taller_acceso on feedback_taller for all to authenticated
  using (
    asignacion_id in (
      select a.id
        from taller_asignaciones_educadores a
        join talleres t on t.id = a.taller_id
       where t.comunidad_id in (select mis_comunidades()))
  )
  with check (
    asignacion_id in (
      select a.id
        from taller_asignaciones_educadores a
        join talleres t on t.id = a.taller_id
       where t.comunidad_id in (select mis_comunidades()))
  );
