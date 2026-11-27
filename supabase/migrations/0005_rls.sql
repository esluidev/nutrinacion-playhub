-- 0005: RLS de las sesiones de Admin (Supabase Auth). RLS es la barrera; filtrar en un
-- composable no es aislamiento.
--
-- Quién ve qué (decisiones 008 y 011):
--   · superadmin: administra organizaciones (altas, licencias, administradores, invitaciones de
--     administrador) y el contenido (catálogo y guías), y es el único que los escribe. De la
--     operación de cada organización solo ve cifras (funciones `platform_*`, al final); el detalle,
--     solo si la administra o colabora en ella, como cualquiera;
--   · admin de una organización (el titular y los demás): todo lo suyo: licencia, administradores,
--     colaboradores, invitaciones y la operación;
--   · colaborador (activo): la operación de la organización: educadores, grupos, programas,
--     lugares, grupos de audiencia, jornadas, workshops y planificador. Lee la licencia, los administradores y los colaboradores; no los toca;
--   · nadie más, y `anon` nada: no hay ninguna política para `anon`.
-- Los educadores no tienen sesión de Auth: usan las funciones de 0006.
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

-- Las organizaciones donde colaboro (activo).
create function organizaciones_colaboro()
returns setof bigint
language sql stable security definer set search_path = public
as $$
  select oc.organizacion_id
    from organizacion_colaboradores oc
    join perfiles p on p.id = oc.perfil_id
   where p.usuario_id = auth.uid() and oc.activo
$$;

-- Las organizaciones que opero: las que administro y aquellas donde colaboro.
create function organizaciones_opero()
returns setof bigint
language sql stable security definer set search_path = public
as $$
  select * from mis_organizaciones()
  union
  select * from organizaciones_colaboro()
$$;

-- Las organizaciones que veo: las mismas que opero.
create function organizaciones_visibles()
returns setof bigint
language sql stable security definer set search_path = public
as $$
  select * from organizaciones_opero()
$$;

-- Los países de las organizaciones que opero: deciden qué estándar del catálogo veo.
create function paises_opero()
returns text[]
language sql stable security definer set search_path = public
as $$
  select coalesce(array_agg(distinct p), '{}')
    from organizaciones o, unnest(o.paises) p
   where o.id in (select organizaciones_opero())
$$;

-- Los perfiles que veo: los administradores y los colaboradores de las organizaciones que opero.
create function perfiles_visibles()
returns setof bigint
language sql stable security definer set search_path = public
as $$
  select oa.perfil_id from organizacion_administradores oa where oa.organizacion_id in (select organizaciones_opero())
  union
  select oc.perfil_id from organizacion_colaboradores oc where oc.organizacion_id in (select organizaciones_opero())
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'es_superadmin()', 'mi_perfil_id()', 'mis_organizaciones()', 'organizaciones_titular()',
    'organizaciones_colaboro()', 'organizaciones_opero()', 'organizaciones_visibles()', 'paises_opero()',
    'perfiles_visibles()'
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
    'configuraciones', 'paises', 'tipos_organizacion', 'plantillas_correo',
    'organizaciones', 'organizacion_licencias', 'perfiles', 'organizacion_administradores',
    'organizacion_colaboradores', 'invitaciones',
    'storyboards', 'guias', 'guia_escenas', 'unidades_estudio', 'unidad_estudio_storyboards',
    'educadores', 'educador_grupos', 'educador_grupo_miembros',
    'programas', 'comunidades', 'lugares', 'grupos_audiencia', 'jornadas', 'workshops',
    'workshop_educadores', 'workshop_feedback', 'workshop_historial',
    'workshop_conexiones', 'workshop_conexion_participantes'
  ] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- ═════════════════════════════════════════════════════════════════════════════
-- CATÁLOGOS Y CONFIGURACIÓN: los leen las sesiones de Admin; los escribe el superadmin
-- ═════════════════════════════════════════════════════════════════════════════
-- Las configuraciones las lee cualquiera, también sin cuenta: ahí están las direcciones de las apps, que necesitan
-- Educators (sin sesión de Auth), el runner de Player y la app del hogar. No guardan secretos (0001).
create policy configuraciones_lectura on configuraciones for select to anon, authenticated using (true);
create policy configuraciones_superadmin on configuraciones for all to authenticated
  using ((select es_superadmin())) with check ((select es_superadmin()));

do $$
declare t text;
begin
  foreach t in array array['paises', 'tipos_organizacion'] loop
    execute format('create policy %I on %I for select to authenticated using (true)', t || '_lectura', t);
    execute format(
      'create policy %I on %I for all to authenticated using ((select es_superadmin())) with check ((select es_superadmin()))',
      t || '_superadmin', t);
  end loop;
end $$;

-- Los países los lee también quien no tiene cuenta: la app del hogar pregunta el país la primera vez (tarea 025).
create policy paises_anon on paises for select to anon using (true);

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
  using (organizacion_id in (select organizaciones_visibles()));
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

-- Colaboradores: los ven quienes ven la organización; los gestionan sus administradores.
create policy organizacion_colaboradores_lectura on organizacion_colaboradores for select to authenticated
  using (organizacion_id in (select organizaciones_visibles()) or perfil_id = (select mi_perfil_id()));
create policy organizacion_colaboradores_gestion on organizacion_colaboradores for all to authenticated
  using (organizacion_id in (select mis_organizaciones()))
  with check (organizacion_id in (select mis_organizaciones()));

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
-- CONTENIDO: lo escribe el superadmin; las organizaciones ven lo que les toca
-- ═════════════════════════════════════════════════════════════════════════════
-- Un estándar publicado lo ve quien opera una organización de alguno de sus países; un
-- personalizado, solo quien opera su organización. Lo archivado se sigue viendo con la misma
-- regla, porque puede haber workshops que lo usan.
create policy storyboards_lectura on storyboards for select to authenticated
  using (
    (select es_superadmin())
    or (estado_publicacion in ('PUBLICADO', 'ARCHIVADO')
        and ((organizacion_id is null and paises_disponibles && (select paises_opero()))
             or organizacion_id in (select organizaciones_opero())))
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

-- Las unidades de estudio de la app del hogar (tarea 022): solo el superadmin, desde Player. La app
-- las lee sin cuenta con `hogar_catalogo` (0007).
create policy unidades_estudio_superadmin on unidades_estudio for all to authenticated
  using ((select es_superadmin())) with check ((select es_superadmin()));
create policy unidad_estudio_storyboards_superadmin on unidad_estudio_storyboards for all to authenticated
  using ((select es_superadmin())) with check ((select es_superadmin()));

-- ═════════════════════════════════════════════════════════════════════════════
-- OPERACIÓN: de quienes operan la organización (administradores y colaboradores)
-- ═════════════════════════════════════════════════════════════════════════════
do $$
declare t text;
begin
  foreach t in array array['educador_grupos', 'educador_grupo_miembros', 'programas', 'comunidades', 'lugares',
                           'grupos_audiencia', 'jornadas', 'workshops', 'workshop_educadores'] loop
    execute format(
      'create policy %I on %I for all to authenticated using (organizacion_id in (select organizaciones_opero())) with check (organizacion_id in (select organizaciones_opero()))',
      t || '_acceso', t);
  end loop;
end $$;

-- Educadores: los ven, dan de alta y editan quienes operan la organización; la baja (delete) es de
-- sus administradores.
create policy educadores_lectura on educadores for select to authenticated
  using (organizacion_id in (select organizaciones_visibles()));
create policy educadores_alta on educadores for insert to authenticated
  with check (organizacion_id in (select organizaciones_opero()));
create policy educadores_edicion on educadores for update to authenticated
  using (organizacion_id in (select organizaciones_opero()))
  with check (organizacion_id in (select organizaciones_opero()));
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

-- El feedback lo escribe el educador (0006); Admin solo lo lee (la subconsulta aplica la RLS de
-- las asignaciones: lo de las organizaciones que opero).
create policy workshop_feedback_lectura on workshop_feedback for select to authenticated
  using (workshop_educador_id in (select id from workshop_educadores));

-- El historial lo escribe el trigger de workshops (0004); quien opera la organización lo lee.
create policy workshop_historial_lectura on workshop_historial for select to authenticated
  using (workshop_id in (select id from workshops));

-- La conexión del taller y sus participantes (tarea 013): solo se leen, para el reporte. Las escriben
-- las funciones de 0006 (Educators, la pantalla del educador y el dispositivo).
create policy workshop_conexiones_lectura on workshop_conexiones for select to authenticated
  using (workshop_id in (select id from workshops));
create policy workshop_conexion_participantes_lectura on workshop_conexion_participantes for select to authenticated
  using (workshop_conexion_id in (select id from workshop_conexiones));

-- ═════════════════════════════════════════════════════════════════════════════
-- REPORTE (tarea 021)
-- ═════════════════════════════════════════════════════════════════════════════
-- El reporte de los workshops de una organización en un periodo, filtrado por programa, comunidad,
-- lugar o grupo. Con los permisos de quien lo pide (SECURITY INVOKER): la RLS deja solo lo de las
-- organizaciones que opera. Cuenta lo publicado alguna vez (no los borradores ni lo archivado).
-- Reglas:
--   · realizado = tiene al menos un cierre; con dos cierres (dos educadores) cuenta el de más
--     asistentes;
--   · alcance: por cada par grupo-lugar, el máximo de niñas y el de niños de sus workshops
--     realizados; se suman los pares. Los grupos abiertos cuentan asistencias, no alcance;
--   · dosis: por par, los workshops previstos y los realizados.
-- Devuelve el resumen, el alcance, los pares, una fila por workshop (con ids: la app pone los
-- nombres) y el historial. Nunca datos de una persona.
create function reporte_talleres(p_organizacion_id bigint, p_desde date, p_hasta date,
                                 p_programa_id bigint default null, p_comunidad_id bigint default null,
                                 p_lugar_id bigint default null, p_grupo_audiencia_id bigint default null)
returns jsonb
language sql stable security invoker set search_path = public
as $$
  with t as (
    select w.id, w.fecha, w.hora_inicio, w.estado, w.storyboard_id, w.lugar_id, w.grupo_audiencia_id, w.programa_id,
           w.jornada_id, w.asistentes_estimados, w.motivo_cancelacion, l.comunidad_id, coalesce(g.abierto, false) as abierto
      from workshops w
      left join lugares l on l.id = w.lugar_id
      left join grupos_audiencia g on g.id = w.grupo_audiencia_id
     where w.organizacion_id = p_organizacion_id
       and w.publicado_en is not null and w.estado <> 'ARCHIVADO'
       and w.fecha between p_desde and p_hasta
       and (p_programa_id is null or w.programa_id = p_programa_id)
       and (p_comunidad_id is null or l.comunidad_id = p_comunidad_id)
       and (p_lugar_id is null or w.lugar_id = p_lugar_id)
       and (p_grupo_audiencia_id is null or w.grupo_audiencia_id = p_grupo_audiencia_id)
  ), cierre as (
    select distinct on (we.workshop_id) we.workshop_id, f.asistentes_reales, f.asistentes_ninas, f.asistentes_ninos,
           f.calificacion, f.participacion_grupo, f.claridad_contenido
      from workshop_feedback f
      join workshop_educadores we on we.id = f.workshop_educador_id
     where we.workshop_id in (select id from t)
     order by we.workshop_id, f.asistentes_reales desc, f.id
  ), ejecucion as (
    select we.workshop_id, min(we.iniciado_en) as iniciado, max(we.terminado_en) as terminado,
           max(we.dispositivos_unidos) as dispositivos,
           coalesce(jsonb_agg(f.dificultades_grupo) filter (where nullif(btrim(f.dificultades_grupo), '') is not null), '[]') as dificultades,
           coalesce(jsonb_agg(f.material_faltante) filter (where nullif(btrim(f.material_faltante), '') is not null), '[]') as material
      from workshop_educadores we
      left join workshop_feedback f on f.workshop_educador_id = we.id
     where we.workshop_id in (select id from t)
     group by we.workshop_id
  ), conectados as (
    -- El tiempo que estuvieron conectados los dispositivos aprobados (tarea 013), sumado por taller.
    select c.workshop_id, sum(p.segundos_conectado) filter (where p.aprobado_en is not null) as segundos
      from workshop_conexiones c
      join workshop_conexion_participantes p on p.workshop_conexion_id = c.id
     where c.workshop_id in (select id from t)
     group by c.workshop_id
  ), filas as (
    select t.*, c.workshop_id is not null as realizado, c.asistentes_reales, c.asistentes_ninas, c.asistentes_ninos,
           c.calificacion, c.participacion_grupo, c.claridad_contenido, e.dispositivos,
           coalesce(k.segundos, 0)::int as segundos_dispositivos,
           coalesce(e.dificultades, '[]') as dificultades, coalesce(e.material, '[]') as material,
           case when c.workshop_id is not null and e.iniciado is not null and e.terminado is not null
                then round(extract(epoch from e.terminado - e.iniciado) / 60)::int end as minutos
      from t
      left join cierre c on c.workshop_id = t.id
      left join ejecucion e on e.workshop_id = t.id
      left join conectados k on k.workshop_id = t.id
  ), pares as (
    select grupo_audiencia_id, lugar_id, count(*)::int as previstas, (count(*) filter (where realizado))::int as recibidas,
           max(asistentes_ninas) filter (where realizado) as ninas, max(asistentes_ninos) filter (where realizado) as ninos
      from filas
     where not abierto and grupo_audiencia_id is not null and lugar_id is not null
     group by grupo_audiencia_id, lugar_id
  )
  select jsonb_build_object(
    'resumen', (
      select jsonb_build_object(
               'previstos', count(*),
               'realizados', count(*) filter (where realizado),
               'cancelados', count(*) filter (where estado = 'CANCELADO'),
               'sin_realizar', count(*) filter (where estado = 'FINALIZADO' and not realizado),
               'asistencias', coalesce(sum(asistentes_reales), 0),
               'asistencias_abiertos', coalesce(sum(asistentes_reales) filter (where abierto), 0),
               'minutos', coalesce(sum(minutos), 0),
               'talleres_con_dispositivos', count(*) filter (where dispositivos > 0),
               'dispositivos', coalesce(sum(dispositivos) filter (where dispositivos > 0), 0),
               'segundos_dispositivos', coalesce(sum(segundos_dispositivos), 0))
        from filas),
    'alcance', (
      select jsonb_build_object('total', coalesce(sum(ninas + ninos), 0), 'ninas', coalesce(sum(ninas), 0),
                                'ninos', coalesce(sum(ninos), 0))
        from pares),
    'pares', coalesce((
      select jsonb_agg(jsonb_build_object('grupo_audiencia_id', grupo_audiencia_id, 'lugar_id', lugar_id,
                                          'previstas', previstas, 'recibidas', recibidas, 'ninas', ninas, 'ninos', ninos)
                       order by grupo_audiencia_id, lugar_id)
        from pares), '[]'),
    'talleres', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', id, 'fecha', fecha, 'estado', estado, 'storyboard_id', storyboard_id, 'lugar_id', lugar_id,
               'comunidad_id', comunidad_id, 'grupo_audiencia_id', grupo_audiencia_id, 'abierto', abierto,
               'programa_id', programa_id, 'jornada_id', jornada_id, 'asistentes_estimados', asistentes_estimados,
               'realizado', realizado, 'asistentes', asistentes_reales, 'ninas', asistentes_ninas, 'ninos', asistentes_ninos,
               'calificacion', calificacion, 'participacion', participacion_grupo, 'claridad', claridad_contenido,
               'minutos', minutos, 'dispositivos', dispositivos, 'segundos_dispositivos', segundos_dispositivos,
               'dificultades', dificultades, 'material', material,
               'motivo_cancelacion', motivo_cancelacion)
               order by fecha, hora_inicio, id)
        from filas), '[]'),
    'historial', coalesce((
      select jsonb_agg(jsonb_build_object('workshop_id', h.workshop_id, 'tipo', h.tipo, 'fecha_anterior', h.fecha_anterior,
                                          'fecha_nueva', h.fecha_nueva, 'motivo', h.motivo, 'cuando', h.created_at)
                       order by h.created_at, h.id)
        from workshop_historial h
       where h.workshop_id in (select id from t)), '[]'))
$$;

revoke all on function reporte_talleres(bigint, date, date, bigint, bigint, bigint, bigint) from public, anon;
grant execute on function reporte_talleres(bigint, date, date, bigint, bigint, bigint, bigint) to authenticated;

-- ═════════════════════════════════════════════════════════════════════════════
-- PLATFORM: lo que ve el superadmin de la operación de cada organización
-- ═════════════════════════════════════════════════════════════════════════════
-- Cifras (lo que se perdería al darla de baja y lo que sirve para dar soporte) y sus
-- administradores con su último acceso; nunca el detalle (educadores, talleres, feedback).
create function platform_uso(p_organizacion_id bigint default null)
returns table (organizacion_id bigint, educadores int, personalizados int, talleres int, jornadas int,
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
         (select count(*)::int from educadores e where e.organizacion_id = o.id and e.deleted_at is null),
         (select count(*)::int from storyboards s where s.organizacion_id = o.id),
         (select count(*)::int from workshops w where w.organizacion_id = o.id),
         (select count(*)::int from jornadas j where j.organizacion_id = o.id),
         -- Soporte: educadores que aún no eligieron su PIN, lo programado y el último movimiento.
         (select count(*)::int from educadores e where e.organizacion_id = o.id and e.deleted_at is null and e.pin_hash is null),
         (select count(*)::int from workshops w where w.organizacion_id = o.id and w.estado = 'PUBLICADO' and w.fecha >= current_date),
         (select max(x) from (
            select max(w.created_at) as x from workshops w where w.organizacion_id = o.id
            union all
            select max(we.iniciado_en) from workshop_educadores we where we.organizacion_id = o.id
            union all
            select max(j.created_at) from jornadas j where j.organizacion_id = o.id
            union all
            select max(e.created_at) from educadores e where e.organizacion_id = o.id
          ) u)
    from organizaciones o
   where p_organizacion_id is null or o.id = p_organizacion_id;
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

-- Dar de baja una organización entera: la cascada se lleva sus educadores, licencias,
-- administradores, colaboradores, invitaciones, jornadas y talleres. Los talleres van primero:
-- así sus asignaciones caen con ellos y no con el educador (un publicado no se queda sin educador).
-- Sus storyboards personalizados lo impiden: el catálogo se resuelve antes desde Player. Los talleres ya dados, que no
-- se eliminan uno a uno (workshops_valida_borrado), se van con ella: lo avisa en la transacción.
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
  perform set_config('playhub.baja_de_organizacion', p_organizacion_id::text, true);
  delete from workshops where organizacion_id = p_organizacion_id;
  delete from organizaciones where id = p_organizacion_id;
end;
$$;

do $$
declare f text;
begin
  foreach f in array array['platform_uso(bigint)', 'platform_administradores(bigint)', 'platform_eliminar_organizacion(bigint)'] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
