-- 0002 — RLS real en `comunidades`
-- ─────────────────────────────────────────────────────────────────────────────
-- Primera tabla que sale del RLS "todo autenticado" de 0001. Es la que sostiene el contexto
-- de la app (el switcher org › comunidad se alimenta de aquí), así que si no filtra, cualquier
-- usuario logueado ve las comunidades de todas las organizaciones.
--
-- Reemplaza `comunidades_authenticated` (era `for all using (true)`). OBLIGATORIO reemplazarla:
-- Postgres combina las políticas permisivas del mismo comando con OR, así que dejarla haría
-- `true OR (filtro)` = true y el filtro no serviría de nada.
--
-- Dos políticas, porque la vieja cubría ALL: si solo dejáramos la de SELECT, nadie podría
-- crear/editar comunidades.
--
-- Sin funciones `rls_*()`: subconsultas inline, legibles. No recursan porque las tablas que
-- consultan (`perfiles`, `organizacion_administradores`, `colaboradores`) siguen en
-- `authenticated using (true)` y no referencian de vuelta a `comunidades`.
--
-- Patrón a repetir: ir apretando de a UNA tabla, donde importe.

drop policy if exists comunidades_authenticated on comunidades;

-- ── Lectura: superadmin ve todo · admin ve las de sus orgs · colaborador ve las suyas ──
drop policy if exists comunidades_select on comunidades;
create policy comunidades_select on comunidades for select to authenticated
using (
  -- superadmin: la consola /platform lista las comunidades de cualquier organización
  exists (
    select 1 from perfiles p
     where p.usuario_id = auth.uid() and p.superadmin
  )
  -- admin: todas las comunidades de las organizaciones que administra
  or organizacion_id in (
    select oa.organizacion_id
      from organizacion_administradores oa
      join perfiles p on p.id = oa.perfil_id
     where p.usuario_id = auth.uid()
  )
  -- colaborador: solo las comunidades donde está asignado y activo
  or id in (
    select co.comunidad_id
      from colaboradores co
      join perfiles p on p.id = co.perfil_id
     where p.usuario_id = auth.uid() and co.activo
  )
);

-- ── Escritura (insert/update/delete): superadmin, o admin de la organización dueña ──
--    El colaborador NO gestiona comunidades: solo opera dentro de la suya.
drop policy if exists comunidades_gestion on comunidades;
create policy comunidades_gestion on comunidades for all to authenticated
using (
  exists (
    select 1 from perfiles p
     where p.usuario_id = auth.uid() and p.superadmin
  )
  or organizacion_id in (
    select oa.organizacion_id
      from organizacion_administradores oa
      join perfiles p on p.id = oa.perfil_id
     where p.usuario_id = auth.uid()
  )
)
with check (
  -- el `with check` impide crear/mover una comunidad hacia una org que no administras
  exists (
    select 1 from perfiles p
     where p.usuario_id = auth.uid() and p.superadmin
  )
  or organizacion_id in (
    select oa.organizacion_id
      from organizacion_administradores oa
      join perfiles p on p.id = oa.perfil_id
     where p.usuario_id = auth.uid()
  )
);
