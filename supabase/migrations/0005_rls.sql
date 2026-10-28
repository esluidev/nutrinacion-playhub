-- 0005: RLS de las sesiones de Admin (Supabase Auth). RLS es la barrera; filtrar en un
-- composable no es aislamiento.
--
-- Quién ve qué:
--   · superadmin: administra organizaciones (altas, licencias, administradores, invitaciones de
--     administrador) y el contenido (catálogo y guías), y es el único que los escribe. De la
--     operación de cada organización solo ve cifras y el nombre y país de sus comunidades (funciones
--     `platform_*`, al final); el detalle, solo si la administra o colabora en ella, como cualquiera;
--   · admin de una organización (el titular y los demás): su organización, su licencia, sus
--     educadores, sus jornadas y todas sus comunidades, en todos los niveles;
--   · colaborador: la operación de las comunidades donde colabora (activo);
--   · nadie más, y `anon` nada: no hay ninguna política para `anon`.
-- Los educadores no tienen sesión de Auth: usan las funciones de 0006. El hogar, las de 0009.
--
-- Las funciones auxiliares son SECURITY DEFINER para que la RLS no se llame a sí misma.

-- ═════════════════════════════════════════════════════════════════════════════
-- FUNCIONES AUXILIARES
-- ═════════════════════════════════════════════════════════════════════════════
create function es_superadmin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from perfiles where usuario_id = auth.uid() and superadmin)
$$;

create function mi_perfil_id()
returns bigint
language sql stable security definer set search_path = public
as $$
  select id from perfiles where usuario_id = auth.uid()
$$;

-- Las organizaciones que administro. Ser superadmin no cuenta: de ahí cuelga toda la operación.
create function mis_organizaciones()
returns setof bigint
language sql stable security definer set search_path = public
as $$
  select oa.organizacion_id
    from organizacion_administradores oa
    join perfiles p on p.id = oa.perfil_id
   where p.usuario_id = auth.uid()
$$;

-- Las organizaciones de las que soy titular (pueden invitar administradores).
create function organizaciones_titular()
returns setof bigint
language sql stable security definer set search_path = public
as $$
  select oa.organizacion_id
    from organizacion_administradores oa
    join perfiles p on p.id = oa.perfil_id
   where p.usuario_id = auth.uid() and oa.titular
$$;

-- Las comunidades que opero: las de mis organizaciones y, salvo solo_administradas, aquellas
-- donde colaboro.
create function mis_comunidades(solo_administradas boolean default false)
returns setof bigint
language sql stable security definer set search_path = public
as $$
  select c.id from comunidades c where c.organizacion_id in (select mis_organizaciones())
  union
  select co.comunidad_id
    from comunidad_colaboradores co
    join perfiles p on p.id = co.perfil_id
   where p.usuario_id = auth.uid() and co.activo and not solo_administradas
$$;

-- Las organizaciones que veo: las que administro y las de las comunidades donde colaboro.
create function organizaciones_visibles()
returns setof bigint
language sql stable security definer set search_path = public
as $$
  select * from mis_organizaciones()
  union
  select c.organizacion_id from comunidades c where c.id in (select mis_comunidades())
$$;

-- Los perfiles que veo: los admins de las organizaciones que veo y los colaboradores de mis
-- comunidades.
create function perfiles_visibles()
returns setof bigint
language sql stable security definer set search_path = public
as $$
  select oa.perfil_id from organizacion_administradores oa where oa.organizacion_id in (select organizaciones_visibles())
  union
  select co.perfil_id from comunidad_colaboradores co where co.comunidad_id in (select mis_comunidades())
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'es_superadmin()', 'mi_perfil_id()', 'mis_organizaciones()', 'organizaciones_titular()',
    'mis_comunidades(boolean)', 'organizaciones_visibles()', 'perfiles_visibles()'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

-- ═════════════════════════════════════════════════════════════════════════════
-- RLS EN TODAS LAS TABLAS
-- ═════════════════════════════════════════════════════════════════════════════
do $$
declare t text;
begin
  foreach t in array array[
    'configuracion', 'paises', 'tipos_organizacion', 'plantillas_correo',
    'organizaciones', 'organizacion_licencias', 'perfiles', 'organizacion_administradores', 'comunidades',
    'comunidad_colaboradores', 'invitaciones',
    'storyboards', 'guias', 'guia_escenas',
    'educadores', 'comunidad_educadores', 'educador_grupos', 'educador_grupo_miembros', 'jornadas', 'workshops',
    'workshop_educadores', 'workshop_feedback'
  ] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- ═════════════════════════════════════════════════════════════════════════════
-- CATÁLOGOS Y CONFIGURACIÓN: los leen las sesiones de Admin; los escribe el superadmin
-- ═════════════════════════════════════════════════════════════════════════════
do $$
declare t text;
begin
  foreach t in array array['configuracion', 'paises', 'tipos_organizacion'] loop
    execute format('create policy %I on %I for select to authenticated using (true)', t || '_lectura', t);
    execute format(
      'create policy %I on %I for all to authenticated using ((select es_superadmin())) with check ((select es_superadmin()))',
      t || '_superadmin', t);
  end loop;
end $$;

-- Las plantillas las lee la Edge Function (service role); en Admin, solo el superadmin.
create policy plantillas_correo_superadmin on plantillas_correo for all to authenticated
  using ((select es_superadmin())) with check ((select es_superadmin()));

-- ═════════════════════════════════════════════════════════════════════════════
-- ORGANIZACIÓN, LICENCIA E IDENTIDAD
-- ═════════════════════════════════════════════════════════════════════════════
create policy organizaciones_lectura on organizaciones for select to authenticated
  using (id in (select organizaciones_visibles()));
create policy organizaciones_superadmin on organizaciones for all to authenticated
  using ((select es_superadmin())) with check ((select es_superadmin()));

create policy organizacion_licencias_lectura on organizacion_licencias for select to authenticated
  using (organizacion_id in (select mis_organizaciones()));
create policy organizacion_licencias_superadmin on organizacion_licencias for all to authenticated
  using ((select es_superadmin())) with check ((select es_superadmin()));

-- Perfiles: cada quien edita sus datos; nadie (ni el propio superadmin desde la API) puede
-- escribir `superadmin`, `email` ni `usuario_id`. Las altas las hace el trigger de Auth.
-- El superadmin ve a los administradores de cualquier organización, no a sus colaboradores.
create policy perfiles_lectura on perfiles for select to authenticated
  using (usuario_id = (select auth.uid()) or id in (select perfiles_visibles())
         or ((select es_superadmin()) and id in (select perfil_id from organizacion_administradores)));
create policy perfiles_edicion on perfiles for update to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));
revoke insert, update, delete on perfiles from anon, authenticated;
grant update (nombre, apellido, avatar, idioma) on perfiles to authenticated;

-- Administradores: los ven quienes ven la organización (y cada quien su propia fila). Los da el
-- canje de la invitación (service role) o el superadmin; el titular puede quitar a los demás.
create policy organizacion_administradores_lectura on organizacion_administradores for select to authenticated
  using (organizacion_id in (select organizaciones_visibles()) or perfil_id = (select mi_perfil_id()));
create policy organizacion_administradores_superadmin on organizacion_administradores for all to authenticated
  using ((select es_superadmin())) with check ((select es_superadmin()));
create policy organizacion_administradores_baja on organizacion_administradores for delete to authenticated
  using (organizacion_id in (select organizaciones_titular()) and not titular);

create policy comunidades_lectura on comunidades for select to authenticated
  using (id in (select mis_comunidades()));
create policy comunidades_gestion on comunidades for all to authenticated
  using (organizacion_id in (select mis_organizaciones()))
  with check (organizacion_id in (select mis_organizaciones()));

create policy comunidad_colaboradores_lectura on comunidad_colaboradores for select to authenticated
  using (comunidad_id in (select mis_comunidades()));
create policy comunidad_colaboradores_gestion on comunidad_colaboradores for all to authenticated
  using (comunidad_id in (select mis_comunidades(true)))
  with check (comunidad_id in (select mis_comunidades(true)));

-- Invitaciones: las ve quien la recibe (por su correo) y quien administra la organización. Un
-- admin invita colaboradores; solo el titular invita administradores. El superadmin, solo las de
-- administrador (las de colaborador son de la operación de cada organización), y es el único que
-- invita a un titular.
create policy invitaciones_lectura on invitaciones for select to authenticated
  using (
    ((select es_superadmin()) and role = 'ADMIN')
    or lower(email) = (select lower(p.email) from perfiles p where p.usuario_id = (select auth.uid()))
    or organizacion_id in (select mis_organizaciones())
  );
create policy invitaciones_gestion on invitaciones for all to authenticated
  using (
    ((select es_superadmin()) and role = 'ADMIN')
    or (role = 'COLABORADOR' and organizacion_id in (select mis_organizaciones()))
    or (role = 'ADMIN' and organizacion_id in (select organizaciones_titular()))
  )
  with check (
    ((select es_superadmin()) and role = 'ADMIN')
    or (not titular and role = 'COLABORADOR' and organizacion_id in (select mis_organizaciones()))
    or (not titular and role = 'ADMIN' and organizacion_id in (select organizaciones_titular()))
  );

-- ═════════════════════════════════════════════════════════════════════════════
-- CONTENIDO: lo escribe el superadmin; las organizaciones ven lo publicado que les toca
-- ═════════════════════════════════════════════════════════════════════════════
-- Un estándar publicado lo ve cualquier sesión de Admin; un personalizado, solo su
-- organización. Lo archivado se sigue viendo, porque puede haber workshops que lo usan.
create policy storyboards_lectura on storyboards for select to authenticated
  using (
    (select es_superadmin())
    or (estado_publicacion in ('PUBLICADO', 'ARCHIVADO')
        and (organizacion_id is null or organizacion_id in (select organizaciones_visibles())))
  );
create policy storyboards_superadmin on storyboards for all to authenticated
  using ((select es_superadmin())) with check ((select es_superadmin()));

-- La guía sigue a su storyboard (la subconsulta aplica la RLS de storyboards).
create policy guias_lectura on guias for select to authenticated
  using (storyboard_id in (select id from storyboards));
create policy guias_superadmin on guias for all to authenticated
  using ((select es_superadmin())) with check ((select es_superadmin()));

create policy guia_escenas_lectura on guia_escenas for select to authenticated
  using (guia_id in (select id from guias));
create policy guia_escenas_superadmin on guia_escenas for all to authenticated
  using ((select es_superadmin())) with check ((select es_superadmin()));

-- ═════════════════════════════════════════════════════════════════════════════
-- OPERACIÓN: por comunidad
-- ═════════════════════════════════════════════════════════════════════════════
do $$
declare t text;
begin
  foreach t in array array['comunidad_educadores', 'educador_grupos', 'educador_grupo_miembros', 'workshops', 'workshop_educadores'] loop
    execute format(
      'create policy %I on %I for all to authenticated using (comunidad_id in (select mis_comunidades())) with check (comunidad_id in (select mis_comunidades()))',
      t || '_acceso', t);
  end loop;
end $$;

-- Educadores: son de la organización. Los ven y dan de alta quienes ven la organización (un
-- colaborador da de alta a quien va a ligar a su comunidad); los editan sus admins y quienes operan
-- una comunidad donde está ligado.
create policy educadores_lectura on educadores for select to authenticated
  using (organizacion_id in (select organizaciones_visibles()));
create policy educadores_alta on educadores for insert to authenticated
  with check (organizacion_id in (select organizaciones_visibles()));
create policy educadores_edicion on educadores for update to authenticated
  using (organizacion_id in (select mis_organizaciones())
         or id in (select educador_id from comunidad_educadores where comunidad_id in (select mis_comunidades())))
  with check (organizacion_id in (select organizaciones_visibles()));
create policy educadores_baja on educadores for delete to authenticated
  using (organizacion_id in (select mis_organizaciones()));

-- El código de activación y el PIN no se leen ni se escriben por la API: solo los tocan las
-- funciones de 0006. Admin ve si ya eligió PIN o si tiene la activación pendiente.
-- (Una política no oculta columnas; los permisos por columna, sí.)
revoke select, insert, update on educadores from anon, authenticated;
grant select (id, nombre, apellido, correo, telefono, profesion, biografia, avatar, idioma, activo, deleted_at, pais,
              tiene_pin, activacion_pendiente, organizacion_id, created_at)
  on educadores to authenticated;
grant insert (nombre, apellido, correo, telefono, profesion, biografia, avatar, idioma, activo, pais, organizacion_id)
  on educadores to authenticated;
grant update (nombre, apellido, correo, telefono, profesion, biografia, avatar, idioma, activo, deleted_at, pais)
  on educadores to authenticated;

-- Las jornadas son de la organización: las ven quienes la ven; las gestionan sus administradores.
create policy jornadas_lectura on jornadas for select to authenticated
  using (organizacion_id in (select organizaciones_visibles()));
create policy jornadas_gestion on jornadas for all to authenticated
  using (organizacion_id in (select mis_organizaciones()))
  with check (organizacion_id in (select mis_organizaciones()));

-- El feedback lo escribe el educador (0006); Admin solo lo lee.
create policy workshop_feedback_lectura on workshop_feedback for select to authenticated
  using (workshop_educador_id in (select id from workshop_educadores));

-- ═════════════════════════════════════════════════════════════════════════════
-- PLATFORM: lo que ve el superadmin de la operación de cada organización
-- ═════════════════════════════════════════════════════════════════════════════
-- Cifras (el uso de la licencia, lo que se perdería al darla de baja y lo que sirve para dar
-- soporte), el nombre y país de sus comunidades y sus administradores con su último acceso; nunca
-- el detalle (educadores, talleres, feedback, participantes). plpgsql: las tablas de 0009 se
-- resuelven al llamarlas.
create function platform_uso(p_organizacion_id bigint default null)
returns table (organizacion_id bigint, comunidades int, educadores int, personalizados int,
               talleres int, participantes int, jornadas int, temarios int,
               educadores_sin_acceso int, talleres_proximos int, ultima_actividad timestamptz)
language plpgsql stable security definer set search_path = public
as $$
#variable_conflict use_column
begin
  if not es_superadmin() then
    raise exception 'Solo el superadmin' using errcode = '42501';
  end if;
  return query
  select o.id,
         (select count(*)::int from comunidades c where c.organizacion_id = o.id),
         (select count(*)::int from educadores e where e.organizacion_id = o.id and e.deleted_at is null),
         (select count(*)::int from storyboards s where s.organizacion_id = o.id),
         (select count(*)::int from workshops w join comunidades c on c.id = w.comunidad_id where c.organizacion_id = o.id),
         (select count(*)::int from comunidad_participantes cp join comunidades c on c.id = cp.comunidad_id
           where c.organizacion_id = o.id),
         (select count(*)::int from jornadas j where j.organizacion_id = o.id),
         (select count(*)::int from temarios t where t.organizacion_id = o.id),
         -- Soporte: educadores que aún no eligieron su PIN, lo programado y el último movimiento.
         (select count(*)::int from educadores e where e.organizacion_id = o.id and e.deleted_at is null and e.pin_hash is null),
         (select count(*)::int from workshops w join comunidades c on c.id = w.comunidad_id
           where c.organizacion_id = o.id and w.estado = 'PUBLICADO' and w.fecha >= current_date),
         (select max(x) from (
            select max(w.created_at) as x from workshops w join comunidades c on c.id = w.comunidad_id where c.organizacion_id = o.id
            union all
            select max(we.iniciado_en) from workshop_educadores we join comunidades c on c.id = we.comunidad_id where c.organizacion_id = o.id
            union all
            select max(c.created_at) from comunidades c where c.organizacion_id = o.id
          ) u)
    from organizaciones o
   where p_organizacion_id is null or o.id = p_organizacion_id;
end;
$$;

create function platform_comunidades(p_organizacion_id bigint)
returns table (id bigint, nombre text, pais text, created_at timestamptz,
               educadores int, colaboradores int, talleres_proximos int, participantes int)
language plpgsql stable security definer set search_path = public
as $$
#variable_conflict use_column
begin
  if not es_superadmin() then
    raise exception 'Solo el superadmin' using errcode = '42501';
  end if;
  return query
  select c.id, c.nombre, c.pais, c.created_at,
         (select count(*)::int from comunidad_educadores ce where ce.comunidad_id = c.id and ce.activo),
         (select count(*)::int from comunidad_colaboradores co where co.comunidad_id = c.id and co.activo),
         (select count(*)::int from workshops w where w.comunidad_id = c.id and w.estado = 'PUBLICADO' and w.fecha >= current_date),
         (select count(*)::int from comunidad_participantes cp where cp.comunidad_id = c.id)
    from comunidades c
   where c.organizacion_id = p_organizacion_id order by c.nombre;
end;
$$;

-- Sus administradores con su último acceso a Admin (de auth.users): para saber si alguien entra.
create function platform_administradores(p_organizacion_id bigint)
returns table (id bigint, perfil_id bigint, nombre text, apellido text, email text, titular boolean,
               created_at timestamptz, ultimo_acceso timestamptz)
language plpgsql stable security definer set search_path = public
as $$
#variable_conflict use_column
begin
  if not es_superadmin() then
    raise exception 'Solo el superadmin' using errcode = '42501';
  end if;
  return query
  select oa.id, p.id, p.nombre, p.apellido, p.email, oa.titular, oa.created_at, u.last_sign_in_at
    from organizacion_administradores oa
    join perfiles p on p.id = oa.perfil_id
    left join auth.users u on u.id = p.usuario_id
   where oa.organizacion_id = p_organizacion_id
   order by oa.titular desc, oa.created_at;
end;
$$;

-- Dar de baja una organización entera: sus comunidades con toda su operación y, en cascada, sus
-- licencias, administradores, educadores, jornadas y temarios. Sus storyboards personalizados lo
-- impiden: el catálogo se resuelve antes desde Player.
create function platform_eliminar_organizacion(p_organizacion_id bigint)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not es_superadmin() then
    raise exception 'Solo el superadmin' using errcode = '42501';
  end if;
  if exists (select 1 from storyboards where organizacion_id = p_organizacion_id) then
    raise exception 'La organización tiene storyboards personalizados: pásalos a otra organización o a estándar desde Player';
  end if;
  delete from comunidades where organizacion_id = p_organizacion_id;
  delete from organizaciones where id = p_organizacion_id;
end;
$$;

do $$
declare f text;
begin
  foreach f in array array['platform_uso(bigint)', 'platform_comunidades(bigint)', 'platform_administradores(bigint)',
                           'platform_eliminar_organizacion(bigint)'] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
