-- 0006: acceso de los educadores, sin Supabase Auth (decisión 005).
--
-- El educador es de la organización y se liga a comunidades (0004). Admin le genera un código de
-- activación; la primera vez, el educador entra con su correo y ese código y elige su PIN de 6
-- dígitos (el que quiera). Desde entonces entra con correo y PIN y ve lo asignado en todas sus
-- comunidades. Si la misma persona trabaja en dos organizaciones y eligió el mismo PIN en ambas,
-- una sola sesión le muestra las dos. Todo lo demás lo pide a estas funciones con su token: no hay
-- roles ni políticas por tabla para educadores, y Educators nunca lee tablas.
--
--   educador_entrar(correo, pin)                 → { ok, token, expira_en, educador }
--                                                  | { ok: false, error: credenciales | bloqueado | definir_pin }
--   educador_activar(correo, codigo, pin)        → la primera vez (o tras un código nuevo): elige su PIN y entra
--   educador_cambiar_pin(token, pin)
--   educador_sesion(token)                       → el educador (o error si la sesión no vale)
--   educador_salir(token)
--   educador_workshops(token, desde?, hasta?)    → sus workshops publicados, finalizados o cancelados
--   educador_guia(token, workshop)               → la guía del storyboard, con las claves del runner
--   educador_iniciar / educador_terminar(token, workshop)
--   educador_guardar_feedback(token, workshop, feedback)
--   educador_generar_codigo(educador)            → solo Admin: el código de activación
--
-- Código, PIN y token se guardan con hash. Tras 5 fallos con un mismo correo, 15 minutos sin poder
-- entrar. Una sesión dura 30 días; un código nuevo cierra las sesiones y obliga a elegir PIN otra vez.

-- Las sesiones abiertas en Educators: una fila por educador (organización) que cubre el token.
create table educador_sesiones (
  id          bigint generated always as identity primary key,
  token_hash  text not null,                       -- sha256 del token
  expira_en   timestamptz not null,
  ultimo_uso  timestamptz not null default now(),
  educador_id bigint not null references educadores (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (token_hash, educador_id)
);

create index on educador_sesiones (educador_id);
create index on educador_sesiones (expira_en);

-- Sin políticas: ni Admin ni Educators la leen; solo estas funciones.
alter table educador_sesiones enable row level security;
revoke all on educador_sesiones from anon, authenticated;

-- ═════════════════════════════════════════════════════════════════════════════
-- AUXILIARES (internas: sin permiso de ejecución para nadie)
-- ═════════════════════════════════════════════════════════════════════════════
-- El texto de un campo localizado en un idioma; si no está traducido, el del idioma de respaldo
-- (el principal del storyboard), luego el español y luego el que haya. Un texto plano vale tal cual.
create function localizado(p_texto jsonb, p_idioma idioma, p_respaldo idioma default 'es')
returns text
language sql immutable
as $$
  select case jsonb_typeof(p_texto)
           when 'object' then coalesce(p_texto->>p_idioma::text, p_texto->>p_respaldo::text, p_texto->>'es',
                                       (select value from jsonb_each_text(p_texto) limit 1))
           when 'string' then p_texto #>> '{}'
         end
$$;

-- Los educadores (uno por organización) de un token vigente; si no vale, error 28000
-- (Educators vuelve a «Entrar»).
create function educadores_de_sesion(p_token text)
returns bigint[]
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_ids bigint[];
begin
  with vigentes as (
    update educador_sesiones s
       set ultimo_uso = now()
      from educadores e
     where s.token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex')
       and s.expira_en > now()
       and e.id = s.educador_id and e.activo and e.deleted_at is null
    returning s.educador_id
  )
  select array_agg(educador_id) into v_ids from vigentes;

  if v_ids is null then
    raise exception 'La sesión no es válida o caducó' using errcode = '28000';
  end if;
  return v_ids;
end;
$$;

-- Quién es y dónde trabaja: sus organizaciones y, en cada una, sus comunidades activas.
create function educador_ficha(p_ids bigint[])
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
           'nombre', e.nombre,
           'apellido', e.apellido,
           'correo', lower(e.correo),
           'idioma', e.idioma,
           'organizaciones', (
             select jsonb_agg(jsonb_build_object(
                      'id', o.id,
                      'nombre', o.nombre,
                      'comunidades', (
                        select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'nombre', c.nombre) order by c.nombre), '[]'::jsonb)
                          from comunidad_educadores ce join comunidades c on c.id = ce.comunidad_id
                         where ce.educador_id = x.id and ce.activo))
                    order by o.nombre)
               from educadores x join organizaciones o on o.id = x.organizacion_id
              where x.id = any (p_ids)))
    from educadores e
   where e.id = any (p_ids)
   order by e.created_at
   limit 1
$$;

-- La asignación del educador en un workshop, según para qué la pide:
--   ver      → publicado, finalizado o cancelado (lo que alguna vez se le publicó);
--   iniciar  → publicado;
--   feedback → publicado o finalizado (puede dejarlo tarde).
-- Si no es suya o el estado no lo permite, error 42501.
create function educador_asignacion(p_ids bigint[], p_workshop_id bigint, p_para text)
returns workshop_educadores
language plpgsql stable security definer set search_path = public
as $$
declare
  v_asignacion workshop_educadores;
  v_estados    estado_workshop[] := case p_para
                                      when 'iniciar' then '{PUBLICADO}'
                                      when 'feedback' then '{PUBLICADO,FINALIZADO}'
                                      else '{PUBLICADO,FINALIZADO,CANCELADO}'
                                    end::estado_workshop[];
begin
  select we.* into v_asignacion
    from workshop_educadores we
    join workshops w on w.id = we.workshop_id
   where we.workshop_id = p_workshop_id
     and we.educador_id = any (p_ids)
     and we.estado <> 'CANCELADO'
     and w.publicado_en is not null
     and w.estado = any (v_estados);

  if v_asignacion.id is null then
    raise exception 'El workshop % no está disponible para este educador', p_workshop_id using errcode = '42501';
  end if;
  return v_asignacion;
end;
$$;

-- Abre una sesión para los educadores dados y devuelve la respuesta de entrar.
create function educador_abrir_sesion(p_ids bigint[])
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_token  text := encode(gen_random_bytes(32), 'hex');
  v_expira timestamptz := now() + interval '30 days';
begin
  update educadores set pin_intentos_fallidos = 0, pin_bloqueado_hasta = null where id = any (p_ids);
  delete from educador_sesiones where expira_en < now();
  insert into educador_sesiones (educador_id, token_hash, expira_en)
  select unnest(p_ids), encode(digest(v_token, 'sha256'), 'hex'), v_expira;
  return jsonb_build_object('ok', true, 'token', v_token, 'expira_en', v_expira, 'educador', educador_ficha(p_ids));
end;
$$;

-- Un fallo más para el correo; al quinto, 15 minutos de bloqueo.
create function educador_falla(p_correo text)
returns jsonb
language sql security definer set search_path = public
as $$
  update educadores e
     set pin_intentos_fallidos = e.pin_intentos_fallidos + 1,
         pin_bloqueado_hasta = case when e.pin_intentos_fallidos + 1 >= 5 then now() + interval '15 minutes' end
   where lower(e.correo) = p_correo and e.deleted_at is null;
  select jsonb_build_object('ok', false, 'error', 'credenciales');
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- ADMIN: EL CÓDIGO DE ACTIVACIÓN
-- ═════════════════════════════════════════════════════════════════════════════
-- Lo genera un admin de su organización o quien opera una comunidad donde está ligado. Devuelve el
-- código una sola vez para compartirlo; después solo queda su hash. Borra el PIN y cierra las
-- sesiones: sirve para dar el primer acceso y para restablecerlo si olvidó su PIN.
create function educador_generar_codigo(p_educador_id bigint)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_org    bigint;
  v_bytes  bytea := gen_random_bytes(4);
  v_codigo text;
begin
  select organizacion_id into v_org from educadores where id = p_educador_id and deleted_at is null;

  if v_org is null or not (
       v_org in (select mis_organizaciones())
       or exists (select 1 from comunidad_educadores
                   where educador_id = p_educador_id and comunidad_id in (select mis_comunidades()))) then
    raise exception 'Sin permiso sobre el educador %', p_educador_id using errcode = '42501';
  end if;

  v_codigo := lpad((((get_byte(v_bytes, 0)::bigint << 24) | (get_byte(v_bytes, 1) << 16)
                     | (get_byte(v_bytes, 2) << 8) | get_byte(v_bytes, 3)) % 1000000)::text, 6, '0');

  update educadores
     set codigo_activacion_hash = crypt(v_codigo, gen_salt('bf', 8)),
         pin_hash = null,
         pin_intentos_fallidos = 0,
         pin_bloqueado_hasta = null
   where id = p_educador_id;

  delete from educador_sesiones where educador_id = p_educador_id;
  return v_codigo;
end;
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- EDUCATORS: ENTRAR, ACTIVAR Y SALIR
-- ═════════════════════════════════════════════════════════════════════════════
-- Devuelven { ok: false, error } en vez de lanzar un error: un error desharía el conteo de
-- intentos fallidos.
create function educador_entrar(p_correo text, p_pin text)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_correo text := lower(trim(coalesce(p_correo, '')));
  v_pin    text := regexp_replace(coalesce(p_pin, ''), '[\s-]', '', 'g');
  v_ids    bigint[];
begin
  if v_correo = '' or v_pin !~ '^\d{6}$' then
    return jsonb_build_object('ok', false, 'error', 'credenciales');
  end if;

  if exists (select 1 from educadores where lower(correo) = v_correo and deleted_at is null and pin_bloqueado_hasta > now()) then
    return jsonb_build_object('ok', false, 'error', 'bloqueado');
  end if;

  select array_agg(id) into v_ids
    from educadores
   where lower(correo) = v_correo and activo and deleted_at is null
     and pin_hash = crypt(v_pin, pin_hash);

  if v_ids is null then
    -- Los 6 dígitos son su código de activación: Educators le pide elegir su PIN.
    if exists (select 1 from educadores
                where lower(correo) = v_correo and activo and deleted_at is null
                  and codigo_activacion_hash = crypt(v_pin, codigo_activacion_hash)) then
      return jsonb_build_object('ok', false, 'error', 'definir_pin');
    end if;
    return educador_falla(v_correo);
  end if;

  return educador_abrir_sesion(v_ids);
end;
$$;

create function educador_activar(p_correo text, p_codigo text, p_pin text)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_correo text := lower(trim(coalesce(p_correo, '')));
  v_codigo text := regexp_replace(coalesce(p_codigo, ''), '[\s-]', '', 'g');
  v_pin    text := regexp_replace(coalesce(p_pin, ''), '[\s-]', '', 'g');
  v_ids    bigint[];
begin
  if v_correo = '' or v_codigo !~ '^\d{6}$' then
    return jsonb_build_object('ok', false, 'error', 'credenciales');
  end if;
  if v_pin !~ '^\d{6}$' then
    return jsonb_build_object('ok', false, 'error', 'pin_invalido');
  end if;

  if exists (select 1 from educadores where lower(correo) = v_correo and deleted_at is null and pin_bloqueado_hasta > now()) then
    return jsonb_build_object('ok', false, 'error', 'bloqueado');
  end if;

  select array_agg(id) into v_ids
    from educadores
   where lower(correo) = v_correo and activo and deleted_at is null
     and codigo_activacion_hash = crypt(v_codigo, codigo_activacion_hash);

  if v_ids is null then
    return educador_falla(v_correo);
  end if;

  update educadores
     set pin_hash = crypt(v_pin, gen_salt('bf', 8)),
         codigo_activacion_hash = null
   where id = any (v_ids);

  return educador_abrir_sesion(v_ids);
end;
$$;

-- Cambia el PIN de todos los accesos de la sesión.
create function educador_cambiar_pin(p_token text, p_pin text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_ids bigint[] := educadores_de_sesion(p_token);
  v_pin text := regexp_replace(coalesce(p_pin, ''), '[\s-]', '', 'g');
begin
  if v_pin !~ '^\d{6}$' then
    raise exception 'El PIN son 6 dígitos' using errcode = '22023';
  end if;
  update educadores set pin_hash = crypt(v_pin, gen_salt('bf', 8)) where id = any (v_ids);
end;
$$;

create function educador_sesion(p_token text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  return educador_ficha(educadores_de_sesion(p_token));
end;
$$;

create function educador_salir(p_token text)
returns void
language sql security definer set search_path = public, extensions
as $$
  delete from educador_sesiones where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex')
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- EDUCATORS: WORKSHOPS, GUÍA Y FEEDBACK
-- ═════════════════════════════════════════════════════════════════════════════
-- Sus workshops de todas sus comunidades: los publicados, los finalizados y los cancelados que ya
-- se le habían publicado (no los borradores, los que están en revisión ni los archivados). Con la
-- forma de `Taller` en Educators. El título va en el idioma del contenido; `eje` es la carpeta de
-- la categoría en el runner (/play/<eje>/<slug>).
create function educador_workshops(p_token text, p_desde date default null, p_hasta date default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_ids bigint[] := educadores_de_sesion(p_token);
begin
  return coalesce((
    select jsonb_agg(
             jsonb_build_object(
               'id', w.id::text,
               'storyboard', jsonb_build_object(
                 'titulo', localizado(s.titulo, w.idioma_contenido, s.idioma_principal),
                 'eje', replace(lower(s.categoria::text), '_', '-'),
                 'categoria', s.categoria,
                 'slug', s.slug,
                 'edicion', s.edicion,
                 'escenas', s.numero_escenas,
                 'duracion', s.duracion_min),
               'comunidad', jsonb_build_object('id', c.id, 'nombre', c.nombre),
               'fecha', w.fecha,
               'horaInicio', to_char(w.hora_inicio, 'HH24:MI'),
               'horaFin', to_char(w.hora_fin, 'HH24:MI'),
               'lugar', w.ubicacion,
               'grupo', w.grupo_asistente,
               'asistentesEstimados', w.asistentes_estimados,
               'idioma', w.idioma_contenido,
               'modalidad', lower(w.modalidad::text),
               'estadoWorkshop', lower(w.estado::text),
               'motivoCancelacion', w.motivo_cancelacion,
               'estado', lower(we.estado::text),
               'iniciadoEn', we.iniciado_en,
               'terminadoEn', we.terminado_en,
               'cierre', (
                 select jsonb_build_object(
                          'calificacion', f.calificacion,
                          'asistentes', f.asistentes_reales,
                          'participacion', lower(f.participacion_grupo::text),
                          'claridad', lower(f.claridad_contenido::text),
                          'costo', coalesce(f.dificultades_grupo, ''),
                          'faltoMaterial', coalesce(f.material_faltante, ''))
                   from workshop_feedback f
                  where f.workshop_educador_id = we.id))
             order by w.fecha, w.hora_inicio)
      from workshop_educadores we
      join workshops w on w.id = we.workshop_id
      join comunidades c on c.id = w.comunidad_id
      join storyboards s on s.id = w.storyboard_id
     where we.educador_id = any (v_ids)
       and we.estado <> 'CANCELADO'
       and w.publicado_en is not null
       and w.estado in ('PUBLICADO', 'FINALIZADO', 'CANCELADO')
       and (p_desde is null or w.fecha >= p_desde)
       and (p_hasta is null or w.fecha <= p_hasta)
  ), '[]'::jsonb);
end;
$$;

-- La guía del storyboard de uno de sus workshops, por carpeta de escena, en el idioma del
-- contenido (si falta la traducción, la del idioma principal) y con las claves del contrato del
-- runner (docs/runner.md): Educators se la pasa tal cual.
create function educador_guia(p_token text, p_workshop_id bigint)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_asignacion workshop_educadores := educador_asignacion(educadores_de_sesion(p_token), p_workshop_id, 'ver');
  v_workshop   workshops;
  v_respaldo   idioma;
begin
  select * into v_workshop from workshops where id = v_asignacion.workshop_id;
  select idioma_principal into v_respaldo from storyboards where id = v_workshop.storyboard_id;
  return coalesce((
    select jsonb_object_agg(ge.carpeta, jsonb_strip_nulls(jsonb_build_object(
             'verb',        localizado(ge.verbo, v_workshop.idioma_contenido, v_respaldo),
             'subtitle',    localizado(ge.subtitulo, v_workshop.idioma_contenido, v_respaldo),
             'description', localizado(ge.descripcion, v_workshop.idioma_contenido, v_respaldo),
             'objective',   localizado(ge.objetivo, v_workshop.idioma_contenido, v_respaldo),
             'pedagogy',    localizado(ge.pedagogia, v_workshop.idioma_contenido, v_respaldo),
             'questions',   localizado(ge.preguntas, v_workshop.idioma_contenido, v_respaldo),
             'psychology',  localizado(ge.psicologia, v_workshop.idioma_contenido, v_respaldo),
             'science',     localizado(ge.cientifico, v_workshop.idioma_contenido, v_respaldo),
             'notDoing',    localizado(ge.no_hace, v_workshop.idioma_contenido, v_respaldo),
             'tips',        localizado(ge.consejos, v_workshop.idioma_contenido, v_respaldo),
             'mechanic',    localizado(ge.mecanica, v_workshop.idioma_contenido, v_respaldo),
             'material',    localizado(ge.material, v_workshop.idioma_contenido, v_respaldo))))
      from guia_escenas ge
      join guias g on g.id = ge.guia_id
     where g.storyboard_id = v_workshop.storyboard_id
  ), '{}'::jsonb);
end;
$$;

-- El runner dijo «listo»: empieza la ejecución real (la primera vez cuenta). Solo si está publicado.
create function educador_iniciar(p_token text, p_workshop_id bigint)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_asignacion workshop_educadores := educador_asignacion(educadores_de_sesion(p_token), p_workshop_id, 'iniciar');
begin
  update workshop_educadores
     set iniciado_en = coalesce(iniciado_en, now()),
         estado = case when estado = 'PENDIENTE' then 'EN_CURSO'::estado_asignacion else estado end
   where id = v_asignacion.id;
end;
$$;

-- El runner dijo «terminado» (también si la tarea horaria ya lo finalizó mientras tanto).
create function educador_terminar(p_token text, p_workshop_id bigint)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_asignacion workshop_educadores := educador_asignacion(educadores_de_sesion(p_token), p_workshop_id, 'feedback');
begin
  update workshop_educadores
     set iniciado_en = coalesce(iniciado_en, now()),
         terminado_en = now()
   where id = v_asignacion.id;
end;
$$;

-- El feedback del workshop. Crea o corrige el de su asignación; al crearlo, la asignación queda
-- completada (y el workshop, finalizado si era el último). Acepta las claves y los valores en
-- minúscula de Educators.
create function educador_guardar_feedback(p_token text, p_workshop_id bigint, p_feedback jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_asignacion workshop_educadores := educador_asignacion(educadores_de_sesion(p_token), p_workshop_id, 'feedback');
  v_feedback   workshop_feedback;
begin
  insert into workshop_feedback (workshop_educador_id, calificacion, asistentes_reales, participacion_grupo,
                                 claridad_contenido, dificultades_grupo, material_faltante)
  values (
    v_asignacion.id,
    (p_feedback->>'calificacion')::int,
    (p_feedback->>'asistentes')::int,
    upper(p_feedback->>'participacion')::participacion_grupo,
    upper(p_feedback->>'claridad')::claridad_contenido,
    nullif(left(trim(p_feedback->>'costo'), 2000), ''),
    nullif(left(trim(p_feedback->>'faltoMaterial'), 2000), ''))
  on conflict (workshop_educador_id) do update
     set calificacion = excluded.calificacion,
         asistentes_reales = excluded.asistentes_reales,
         participacion_grupo = excluded.participacion_grupo,
         claridad_contenido = excluded.claridad_contenido,
         dificultades_grupo = excluded.dificultades_grupo,
         material_faltante = excluded.material_faltante
  returning * into v_feedback;

  return jsonb_build_object(
    'calificacion', v_feedback.calificacion,
    'asistentes', v_feedback.asistentes_reales,
    'participacion', lower(v_feedback.participacion_grupo::text),
    'claridad', lower(v_feedback.claridad_contenido::text),
    'costo', coalesce(v_feedback.dificultades_grupo, ''),
    'faltoMaterial', coalesce(v_feedback.material_faltante, ''));
end;
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- PERMISOS DE EJECUCIÓN
-- ═════════════════════════════════════════════════════════════════════════════
do $$
declare f text;
begin
  -- Internas: nadie las llama por la API.
  foreach f in array array[
    'localizado(jsonb, idioma, idioma)', 'educadores_de_sesion(text)', 'educador_ficha(bigint[])',
    'educador_asignacion(bigint[], bigint, text)', 'educador_abrir_sesion(bigint[])', 'educador_falla(text)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
  end loop;

  -- Educators (sin sesión de Auth): la anon key más el token.
  foreach f in array array[
    'educador_entrar(text, text)', 'educador_activar(text, text, text)', 'educador_cambiar_pin(text, text)',
    'educador_sesion(text)', 'educador_salir(text)',
    'educador_workshops(text, date, date)', 'educador_guia(text, bigint)',
    'educador_iniciar(text, bigint)', 'educador_terminar(text, bigint)',
    'educador_guardar_feedback(text, bigint, jsonb)'
  ] loop
    execute format('revoke all on function %s from public', f);
    execute format('grant execute on function %s to anon, authenticated', f);
  end loop;

  -- Admin.
  execute 'revoke all on function educador_generar_codigo(bigint) from public, anon';
  execute 'grant execute on function educador_generar_codigo(bigint) to authenticated';
end $$;
