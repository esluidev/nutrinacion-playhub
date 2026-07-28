-- 0006 — El titular de una organización puede emitir invitaciones ADMIN de SU org
-- ─────────────────────────────────────────────────────────────────────────────
-- Revierte a propósito parte de la regla de 0005 ("los tokens de ADMIN los emite
-- únicamente Nutrinación"). Decisión 2026-07-19 (tarea 029): administrar una organización
-- incluye poder sumar co-administradores, y eso es del TITULAR — designar quién es titular
-- sigue siendo del superadmin en /platform. El correo sale por el mismo Database Webhook
-- del INSERT (enviar-invitacion), sin cambios en las Edge Functions.
--
-- Solo cambia la política de ESCRITURA; la lectura de 0005 ya cubría al admin de la org.
-- Mismo patrón que 0002/0005: subconsultas inline, sin funciones. No recursa (las tablas
-- consultadas no referencian de vuelta a `invitaciones`).

drop policy if exists invitaciones_gestion on invitaciones;
create policy invitaciones_gestion on invitaciones for all to authenticated
using (
  exists (
    select 1 from perfiles p
     where p.usuario_id = auth.uid() and p.superadmin
  )
  -- el admin de una org gestiona los tokens de COLABORADOR de sus comunidades
  or (
    role = 'COLABORADOR'
    and organizacion_id in (
      select oa.organizacion_id
        from organizacion_administradores oa
        join perfiles p on p.id = oa.perfil_id
       where p.usuario_id = auth.uid()
    )
  )
  -- el TITULAR además emite tokens de ADMIN (co-administradores) de su org
  or (
    role = 'ADMIN'
    and organizacion_id in (
      select oa.organizacion_id
        from organizacion_administradores oa
        join perfiles p on p.id = oa.perfil_id
       where p.usuario_id = auth.uid() and oa.titular
    )
  )
)
with check (
  exists (
    select 1 from perfiles p
     where p.usuario_id = auth.uid() and p.superadmin
  )
  or (
    role = 'COLABORADOR'
    and organizacion_id in (
      select oa.organizacion_id
        from organizacion_administradores oa
        join perfiles p on p.id = oa.perfil_id
       where p.usuario_id = auth.uid()
    )
  )
  or (
    role = 'ADMIN'
    and organizacion_id in (
      select oa.organizacion_id
        from organizacion_administradores oa
        join perfiles p on p.id = oa.perfil_id
       where p.usuario_id = auth.uid() and oa.titular
    )
  )
);
