-- 0005 — RLS real en `invitaciones`
-- ─────────────────────────────────────────────────────────────────────────────
-- Segunda tabla que sale del "todo autenticado" de 0001. Urge porque la tabla guarda los
-- TOKENS: con la política permisiva, cualquier usuario logueado podía leer todas las
-- invitaciones de todas las organizaciones (quién fue invitado a dónde, y su token).
--
-- Además la bandeja de invitaciones de la app lee esta tabla filtrando por correo. Ese filtro
-- tiene que vivir en la BD, no solo en el cliente.
--
-- Mismo patrón que 0002: subconsultas inline, sin funciones. No recursa (las tablas que
-- consulta no referencian de vuelta a `invitaciones`).
--
-- El canje/aceptación NO pasa por aquí: lo hace la Edge Function con service_role, que bypasea
-- RLS y valida por su cuenta que el correo coincida con el del usuario autenticado.

drop policy if exists invitaciones_authenticated on invitaciones;

-- ── Lectura: superadmin · las dirigidas a MI correo · las de las orgs que administro ──
drop policy if exists invitaciones_select on invitaciones;
create policy invitaciones_select on invitaciones for select to authenticated
using (
  exists (
    select 1 from perfiles p
     where p.usuario_id = auth.uid() and p.superadmin
  )
  -- las mías: alimentan la bandeja. Las de link abierto (email null) no son de nadie.
  or lower(email) = (
    select lower(p.email) from perfiles p where p.usuario_id = auth.uid()
  )
  -- las que emitió mi organización: el admin necesita ver a quién invitó
  or organizacion_id in (
    select oa.organizacion_id
      from organizacion_administradores oa
      join perfiles p on p.id = oa.perfil_id
     where p.usuario_id = auth.uid()
  )
);

-- ── Escritura: superadmin cualquiera · el admin de una org solo tokens de COLABORADOR suyos ──
--    (los tokens de ADMIN los emite únicamente Nutrinación)
drop policy if exists invitaciones_gestion on invitaciones;
create policy invitaciones_gestion on invitaciones for all to authenticated
using (
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
);
