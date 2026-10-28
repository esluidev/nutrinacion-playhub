-- 0009: lo que se ofrece en casa y la app del hogar (tarea 006, Luis 2026-10-16).
--
--   · temarios: un tema que agrupa storyboards en orden. De Nutrinación (públicos al publicarse),
--     de una organización o de una de sus comunidades (los arma un colaborador).
--   · organizacion_publicaciones: lo que una organización ofrece a sus participantes, un storyboard
--     o un temario, para todas sus comunidades o para una. Solo para miembros: lo público es lo de
--     Nutrinación.
--   · hogares: la cuenta del adulto (nombre, país, correo y un PIN que elige), sin Supabase Auth.
--     Sin cuenta, la app del hogar funciona pero no guarda nada.
--   · hogar_perfiles: los niños de la cuenta (nombre cualquiera, género, año de nacimiento e
--     intereses). La edad sale del año; la edición, de la edad.
--   · comunidad_participantes: los perfiles que se unieron a una comunidad con su código
--     (comunidades.codigo_acceso). Unirse es opcional y se sale cuando se quiere.
--   · hogar_perfil_avance: qué storyboards terminó cada perfil. Solo «terminado»: nunca respuestas
--     ni puntos. En la primera versión no lo ve nadie fuera de la familia.
--
-- Reglas de lo que ve un perfil: lo de Nutrinación según el país de la cuenta; lo de una
-- organización según el país de la comunidad (y con su licencia vigente); siempre en el idioma de
-- la cuenta y la edición del perfil. La app del hogar solo usa las funciones `hogar_*` con su token.

-- ═════════════════════════════════════════════════════════════════════════════
-- TEMARIOS Y PUBLICACIONES
-- ═════════════════════════════════════════════════════════════════════════════
create table temarios (
  id                 bigint generated always as identity primary key,
  titulo             jsonb not null,                                -- «Reduciendo la grasa visceral»
  descripcion        jsonb,
  estado_publicacion estado_publicacion not null default 'REGISTRADO',
  organizacion_id    bigint references organizaciones (id) on delete cascade,  -- null = de Nutrinación
  comunidad_id       bigint references comunidades (id) on delete cascade,     -- el de una comunidad (lo arma un colaborador)
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (comunidad_id is null or organizacion_id is not null)
);

create table temario_storyboards (
  id            bigint generated always as identity primary key,
  orden         int not null check (orden > 0),
  temario_id    bigint not null references temarios (id) on delete cascade,
  storyboard_id bigint not null references storyboards (id) on delete restrict,
  unique (temario_id, orden),
  unique (temario_id, storyboard_id)
);

create table organizacion_publicaciones (
  id               bigint generated always as identity primary key,
  disponible_desde timestamptz not null default now(),   -- para programar lo que se ve en casa
  organizacion_id  bigint not null references organizaciones (id) on delete cascade,
  comunidad_id     bigint references comunidades (id) on delete cascade,     -- null = todas sus comunidades
  storyboard_id    bigint references storyboards (id) on delete restrict,
  temario_id       bigint references temarios (id) on delete cascade,
  created_at       timestamptz not null default now(),
  check ((storyboard_id is null) <> (temario_id is null))
);

create index on temarios (organizacion_id);
create index on temarios (comunidad_id);
create index on temario_storyboards (storyboard_id);
create index on organizacion_publicaciones (organizacion_id);
create index on organizacion_publicaciones (comunidad_id);

create trigger temarios_updated_at before update on temarios for each row execute function toca_updated_at();

-- Una organización solo agrupa o publica storyboards publicados que puede usar (estándar o suyos);
-- Nutrinación, solo estándar.
create function valida_storyboard_de_organizacion(p_storyboard_id bigint, p_organizacion_id bigint)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_sb storyboards;
begin
  select * into v_sb from storyboards where id = p_storyboard_id;
  if v_sb.estado_publicacion <> 'PUBLICADO' then
    raise exception 'El storyboard % no está publicado', p_storyboard_id;
  end if;
  if v_sb.organizacion_id is not null and v_sb.organizacion_id is distinct from p_organizacion_id then
    raise exception 'El storyboard % es personalizado de otra organización', p_storyboard_id;
  end if;
end;
$$;

create function temarios_valida()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.comunidad_id is not null
     and (select organizacion_id from comunidades where id = new.comunidad_id) is distinct from new.organizacion_id then
    raise exception 'La comunidad % es de otra organización', new.comunidad_id;
  end if;
  return new;
end;
$$;

create trigger temarios_valida before insert or update on temarios for each row execute function temarios_valida();

create function temario_storyboards_valida()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform valida_storyboard_de_organizacion(new.storyboard_id, (select organizacion_id from temarios where id = new.temario_id));
  return new;
end;
$$;

create trigger temario_storyboards_valida before insert or update on temario_storyboards
  for each row execute function temario_storyboards_valida();

create function organizacion_publicaciones_valida()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_temario temarios;
begin
  if new.comunidad_id is not null
     and (select organizacion_id from comunidades where id = new.comunidad_id) <> new.organizacion_id then
    raise exception 'La comunidad % es de otra organización', new.comunidad_id;
  end if;
  if new.storyboard_id is not null then
    perform valida_storyboard_de_organizacion(new.storyboard_id, new.organizacion_id);
  end if;
  if new.temario_id is not null then
    select * into v_temario from temarios where id = new.temario_id;
    if v_temario.organizacion_id is distinct from new.organizacion_id then
      raise exception 'El temario % es de otra organización', new.temario_id;
    end if;
    if v_temario.estado_publicacion <> 'PUBLICADO' then
      raise exception 'El temario % no está publicado', new.temario_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger organizacion_publicaciones_valida before insert or update on organizacion_publicaciones
  for each row execute function organizacion_publicaciones_valida();

-- ═════════════════════════════════════════════════════════════════════════════
-- LA CUENTA DEL HOGAR
-- ═════════════════════════════════════════════════════════════════════════════
create table hogares (
  id                       bigint generated always as identity primary key,
  nombre                   text not null,                      -- el adulto: «Juan Pérez»
  correo                   text not null check (correo ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  pais                     text not null references paises (codigo),
  idioma                   idioma not null default 'es',
  pin_hash                 text not null,                      -- bcrypt del PIN de 6 dígitos que eligió
  pin_intentos_fallidos    int not null default 0,
  pin_bloqueado_hasta      timestamptz,                        -- tras 5 fallos, 15 minutos
  codigo_intentos_fallidos int not null default 0,
  codigo_bloqueado_hasta   timestamptz,                        -- tras 5 códigos de comunidad equivocados, 15 minutos
  created_at               timestamptz not null default now()
);

create unique index hogares_correo on hogares (lower(correo));

create table hogar_sesiones (
  id         bigint generated always as identity primary key,
  token_hash text not null unique,                 -- sha256 del token
  expira_en  timestamptz not null,
  ultimo_uso timestamptz not null default now(),
  hogar_id   bigint not null references hogares (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table hogar_perfiles (
  id              bigint generated always as identity primary key,
  nombre          text not null,                               -- un nombre cualquiera
  genero          genero_perfil not null,
  anio_nacimiento int not null check (anio_nacimiento between 2000 and 2100),
  intereses       enfoque_salud[] not null default '{}',       -- para su ruta (diabetes, obesidad…)
  avatar          text,
  hogar_id        bigint not null references hogares (id) on delete cascade,
  created_at      timestamptz not null default now()
);

-- Los participantes de cada comunidad: perfiles que se unieron con su código.
create table comunidad_participantes (
  id              bigint generated always as identity primary key,
  unido_en        timestamptz not null default now(),
  comunidad_id    bigint not null references comunidades (id) on delete cascade,
  hogar_perfil_id bigint not null references hogar_perfiles (id) on delete cascade,
  unique (comunidad_id, hogar_perfil_id)
);

create table hogar_perfil_avance (
  id              bigint generated always as identity primary key,
  completado_en   timestamptz not null default now(),
  hogar_perfil_id bigint not null references hogar_perfiles (id) on delete cascade,
  storyboard_id   bigint not null references storyboards (id) on delete cascade,
  unique (hogar_perfil_id, storyboard_id)
);

create index on hogar_sesiones (hogar_id);
create index on hogar_perfiles (hogar_id);
create index on comunidad_participantes (hogar_perfil_id);
create index on hogar_perfil_avance (storyboard_id);

-- ═════════════════════════════════════════════════════════════════════════════
-- RLS: Admin gestiona temarios y publicaciones y ve a sus participantes; nada más del hogar
-- ═════════════════════════════════════════════════════════════════════════════
do $$
declare t text;
begin
  foreach t in array array['temarios', 'temario_storyboards', 'organizacion_publicaciones', 'hogares',
                           'hogar_sesiones', 'hogar_perfiles', 'comunidad_participantes', 'hogar_perfil_avance'] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- Quién edita un temario: el superadmin (los de Nutrinación), los admins de su organización y, si
-- es de una comunidad, quien la opera.
create function puedo_editar_temario(p_organizacion_id bigint, p_comunidad_id bigint)
returns boolean
language sql stable security definer set search_path = public
as $$
  select case when p_organizacion_id is null then es_superadmin()
              else p_organizacion_id in (select mis_organizaciones())
                   or (p_comunidad_id is not null and p_comunidad_id in (select mis_comunidades())) end
$$;

revoke all on function puedo_editar_temario(bigint, bigint) from public, anon;
grant execute on function puedo_editar_temario(bigint, bigint) to authenticated;

create policy temarios_lectura on temarios for select to authenticated
  using (organizacion_id is null or organizacion_id in (select organizaciones_visibles()));
create policy temarios_gestion on temarios for all to authenticated
  using (puedo_editar_temario(organizacion_id, comunidad_id))
  with check (puedo_editar_temario(organizacion_id, comunidad_id));

create policy temario_storyboards_lectura on temario_storyboards for select to authenticated
  using (temario_id in (select id from temarios));
create policy temario_storyboards_gestion on temario_storyboards for all to authenticated
  using (temario_id in (select t.id from temarios t where puedo_editar_temario(t.organizacion_id, t.comunidad_id)))
  with check (temario_id in (select t.id from temarios t where puedo_editar_temario(t.organizacion_id, t.comunidad_id)));

-- Publican los admins de la organización (para toda o para una comunidad) y quien opera una
-- comunidad (solo para ella).
create policy organizacion_publicaciones_lectura on organizacion_publicaciones for select to authenticated
  using (organizacion_id in (select organizaciones_visibles()));
create policy organizacion_publicaciones_gestion on organizacion_publicaciones for all to authenticated
  using (organizacion_id in (select mis_organizaciones()) or comunidad_id in (select mis_comunidades()))
  with check (organizacion_id in (select mis_organizaciones()) or comunidad_id in (select mis_comunidades()));

-- Quien opera una comunidad ve a sus participantes (nombre, género y edad) y puede quitar a uno.
-- Nunca la cuenta (correo), los intereses ni el avance.
create policy comunidad_participantes_lectura on comunidad_participantes for select to authenticated
  using (comunidad_id in (select mis_comunidades()));
create policy comunidad_participantes_baja on comunidad_participantes for delete to authenticated
  using (comunidad_id in (select mis_comunidades()));
revoke insert, update on comunidad_participantes from anon, authenticated;

create policy hogar_perfiles_participantes on hogar_perfiles for select to authenticated
  using (id in (select hogar_perfil_id from comunidad_participantes where comunidad_id in (select mis_comunidades())));
revoke all on hogar_perfiles from anon, authenticated;
grant select (id, nombre, genero, anio_nacimiento) on hogar_perfiles to authenticated;

revoke all on hogares, hogar_sesiones, hogar_perfil_avance from anon, authenticated;

-- ═════════════════════════════════════════════════════════════════════════════
-- ADMIN: EL CÓDIGO DE ACCESO DE UNA COMUNIDAD
-- ═════════════════════════════════════════════════════════════════════════════
-- Quien opera la comunidad genera (o cambia) su código: 6 dígitos, único en la plataforma. El
-- anterior deja de admitir altas; los participantes siguen.
create function comunidad_generar_codigo_acceso(p_comunidad_id bigint)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_bytes   bytea;
  v_codigo  text;
  v_vueltas int := 0;
begin
  if p_comunidad_id is null or p_comunidad_id not in (select mis_comunidades()) then
    raise exception 'Sin permiso sobre la comunidad %', p_comunidad_id using errcode = '42501';
  end if;
  loop
    v_bytes := gen_random_bytes(4);
    v_codigo := lpad((((get_byte(v_bytes, 0)::bigint << 24) | (get_byte(v_bytes, 1) << 16)
                       | (get_byte(v_bytes, 2) << 8) | get_byte(v_bytes, 3)) % 1000000)::text, 6, '0');
    exit when not exists (select 1 from comunidades where codigo_acceso = v_codigo);
    v_vueltas := v_vueltas + 1;
    if v_vueltas > 20 then
      raise exception 'No se pudo generar un código único';
    end if;
  end loop;
  update comunidades set codigo_acceso = v_codigo, codigo_acceso_desde = now() where id = p_comunidad_id;
  return v_codigo;
end;
$$;

revoke all on function comunidad_generar_codigo_acceso(bigint) from public, anon;
grant execute on function comunidad_generar_codigo_acceso(bigint) to authenticated;

-- El perfil público de la organización (lo que ven las familias en «Unirme»). Lo editan sus
-- administradores; el resto de la fila (nombre, contacto, tipo) sigue siendo del superadmin.
create function organizacion_actualizar_perfil_publico(p_organizacion_id bigint, p_publico boolean, p_descripcion jsonb, p_logo text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_organizacion_id is null or p_organizacion_id not in (select mis_organizaciones()) then
    raise exception 'Sin permiso sobre la organización %', p_organizacion_id using errcode = '42501';
  end if;
  update organizaciones
     set perfil_publico = coalesce(p_publico, false),
         descripcion_publica = p_descripcion,
         logo = nullif(trim(p_logo), '')
   where id = p_organizacion_id;
end;
$$;

revoke all on function organizacion_actualizar_perfil_publico(bigint, boolean, jsonb, text) from public, anon;
grant execute on function organizacion_actualizar_perfil_publico(bigint, boolean, jsonb, text) to authenticated;

-- ═════════════════════════════════════════════════════════════════════════════
-- AUXILIARES (internas)
-- ═════════════════════════════════════════════════════════════════════════════
-- La edición según la edad (los rangos del runner y de Admin).
create function edicion_de_edad(p_edad int)
returns edicion_storyboard
language sql immutable
as $$
  select (case when p_edad between 4 and 8 then 'KIDS'
               when p_edad between 9 and 12 then 'PREADOLESCENTES'
               when p_edad between 13 and 17 then 'ADOLESCENTES' end)::edicion_storyboard
$$;

-- Licencia vigente: la misma regla que el cupo de comunidades.
create function licencia_vigente(p_organizacion_id bigint)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from organizacion_licencias l
                  where l.organizacion_id = p_organizacion_id and l.estado in ('ACTIVA', 'TRIAL')
                    and l.fecha_inicio <= current_date and (l.fecha_fin is null or l.fecha_fin >= current_date))
$$;

-- La cuenta de un token vigente; si no vale, error 28000.
create function hogar_de_sesion(p_token text)
returns bigint
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_id bigint;
begin
  update hogar_sesiones
     set ultimo_uso = now()
   where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex') and expira_en > now()
  returning hogar_id into v_id;
  if v_id is null then
    raise exception 'La sesión no es válida o caducó' using errcode = '28000';
  end if;
  return v_id;
end;
$$;

-- Un perfil de la cuenta; si no es suyo, error 42501.
create function hogar_perfil_propio(p_hogar_id bigint, p_perfil_id bigint)
returns hogar_perfiles
language plpgsql stable security definer set search_path = public
as $$
declare
  v_perfil hogar_perfiles;
begin
  select * into v_perfil from hogar_perfiles where id = p_perfil_id and hogar_id = p_hogar_id;
  if v_perfil.id is null then
    raise exception 'El perfil % no es de esta cuenta', p_perfil_id using errcode = '42501';
  end if;
  return v_perfil;
end;
$$;

-- La cuenta con sus perfiles y las comunidades de cada uno.
create function hogar_ficha(p_hogar_id bigint)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
           'nombre', h.nombre,
           'correo', lower(h.correo),
           'pais', h.pais,
           'idioma', h.idioma,
           'perfiles', coalesce((
             select jsonb_agg(jsonb_build_object(
                      'id', p.id,
                      'nombre', p.nombre,
                      'genero', p.genero,
                      'edad', extract(year from current_date)::int - p.anio_nacimiento,
                      'edicion', edicion_de_edad(extract(year from current_date)::int - p.anio_nacimiento),
                      'intereses', to_jsonb(p.intereses),
                      'comunidades', coalesce((
                        select jsonb_agg(jsonb_build_object('id', c.id, 'nombre', c.nombre,
                                                            'organizacion', jsonb_build_object('id', o.id, 'nombre', o.nombre))
                                         order by cp.unido_en)
                          from comunidad_participantes cp
                          join comunidades c on c.id = cp.comunidad_id
                          join organizaciones o on o.id = c.organizacion_id
                         where cp.hogar_perfil_id = p.id), '[]'::jsonb))
                    order by p.created_at)
               from hogar_perfiles p where p.hogar_id = h.id), '[]'::jsonb))
    from hogares h
   where h.id = p_hogar_id
$$;

create function hogar_abrir_sesion(p_hogar_id bigint)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_token  text := encode(gen_random_bytes(32), 'hex');
  v_expira timestamptz := now() + interval '180 days';
begin
  update hogares set pin_intentos_fallidos = 0, pin_bloqueado_hasta = null where id = p_hogar_id;
  delete from hogar_sesiones where expira_en < now();
  insert into hogar_sesiones (hogar_id, token_hash, expira_en)
  values (p_hogar_id, encode(digest(v_token, 'sha256'), 'hex'), v_expira);
  return jsonb_build_object('ok', true, 'token', v_token, 'expira_en', v_expira, 'cuenta', hogar_ficha(p_hogar_id));
end;
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- APP DEL HOGAR: CUENTA
-- ═════════════════════════════════════════════════════════════════════════════
-- Devuelven { ok: false, error } en vez de lanzar un error cuando el error es del usuario.
create function hogar_crear_cuenta(p_nombre text, p_correo text, p_pais text, p_idioma text, p_pin text)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_correo text := lower(trim(coalesce(p_correo, '')));
  v_pin    text := regexp_replace(coalesce(p_pin, ''), '[\s-]', '', 'g');
  v_id     bigint;
begin
  if trim(coalesce(p_nombre, '')) = '' or v_correo !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or v_pin !~ '^\d{6}$'
     or coalesce(p_idioma, 'es') not in ('es', 'en') then
    return jsonb_build_object('ok', false, 'error', 'datos');
  end if;
  if not exists (select 1 from paises where codigo = upper(p_pais) and activo) then
    return jsonb_build_object('ok', false, 'error', 'pais');
  end if;
  if exists (select 1 from hogares where lower(correo) = v_correo) then
    return jsonb_build_object('ok', false, 'error', 'correo_en_uso');
  end if;

  insert into hogares (nombre, correo, pais, idioma, pin_hash)
  values (trim(p_nombre), v_correo, upper(p_pais), coalesce(p_idioma, 'es')::idioma, crypt(v_pin, gen_salt('bf', 8)))
  returning id into v_id;
  return hogar_abrir_sesion(v_id);
end;
$$;

create function hogar_entrar(p_correo text, p_pin text)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_correo text := lower(trim(coalesce(p_correo, '')));
  v_pin    text := regexp_replace(coalesce(p_pin, ''), '[\s-]', '', 'g');
  v_hogar  hogares;
begin
  select * into v_hogar from hogares where lower(correo) = v_correo;
  if v_hogar.id is null or v_pin !~ '^\d{6}$' then
    return jsonb_build_object('ok', false, 'error', 'credenciales');
  end if;
  if v_hogar.pin_bloqueado_hasta > now() then
    return jsonb_build_object('ok', false, 'error', 'bloqueado');
  end if;
  if v_hogar.pin_hash <> crypt(v_pin, v_hogar.pin_hash) then
    update hogares
       set pin_intentos_fallidos = pin_intentos_fallidos + 1,
           pin_bloqueado_hasta = case when pin_intentos_fallidos + 1 >= 5 then now() + interval '15 minutes' end
     where id = v_hogar.id;
    return jsonb_build_object('ok', false, 'error', 'credenciales');
  end if;
  return hogar_abrir_sesion(v_hogar.id);
end;
$$;

create function hogar_sesion(p_token text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  return hogar_ficha(hogar_de_sesion(p_token));
end;
$$;

create function hogar_salir(p_token text)
returns void
language sql security definer set search_path = public, extensions
as $$
  delete from hogar_sesiones where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex')
$$;

-- Cambia nombre, país o idioma de la cuenta (solo las claves que trae).
create function hogar_actualizar_cuenta(p_token text, p_datos jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_id bigint := hogar_de_sesion(p_token);
begin
  if p_datos ? 'pais' and not exists (select 1 from paises where codigo = upper(p_datos->>'pais') and activo) then
    raise exception 'El país % no está en el catálogo', p_datos->>'pais' using errcode = '22023';
  end if;
  update hogares
     set nombre = coalesce(nullif(trim(p_datos->>'nombre'), ''), nombre),
         pais = coalesce(upper(p_datos->>'pais'), pais),
         idioma = coalesce((p_datos->>'idioma')::idioma, idioma)
   where id = v_id;
  return hogar_ficha(v_id);
end;
$$;

create function hogar_cambiar_pin(p_token text, p_pin text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_id  bigint := hogar_de_sesion(p_token);
  v_pin text := regexp_replace(coalesce(p_pin, ''), '[\s-]', '', 'g');
begin
  if v_pin !~ '^\d{6}$' then
    raise exception 'El PIN son 6 dígitos' using errcode = '22023';
  end if;
  update hogares set pin_hash = crypt(v_pin, gen_salt('bf', 8)) where id = v_id;
end;
$$;

-- Borra la cuenta con sus perfiles, sus comunidades y su avance.
create function hogar_borrar_cuenta(p_token text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  delete from hogares where id = hogar_de_sesion(p_token);
end;
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- APP DEL HOGAR: PERFILES Y COMUNIDADES
-- ═════════════════════════════════════════════════════════════════════════════
-- Crea (sin `id`) o edita (con `id`) un perfil: { id?, nombre, genero, edad, intereses }.
-- La edad se guarda como año de nacimiento, para que no caduque.
create function hogar_guardar_perfil(p_token text, p_perfil jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_hogar     bigint := hogar_de_sesion(p_token);
  v_anio      int := extract(year from current_date)::int - (p_perfil->>'edad')::int;
  v_intereses enfoque_salud[] := array(select jsonb_array_elements_text(coalesce(p_perfil->'intereses', '[]'::jsonb)))::enfoque_salud[];
begin
  if p_perfil ? 'id' then
    perform hogar_perfil_propio(v_hogar, (p_perfil->>'id')::bigint);
    update hogar_perfiles
       set nombre = coalesce(nullif(trim(p_perfil->>'nombre'), ''), nombre),
           genero = coalesce((p_perfil->>'genero')::genero_perfil, genero),
           anio_nacimiento = coalesce(v_anio, anio_nacimiento),
           intereses = case when p_perfil ? 'intereses' then v_intereses else intereses end
     where id = (p_perfil->>'id')::bigint;
  else
    insert into hogar_perfiles (nombre, genero, anio_nacimiento, intereses, hogar_id)
    values (trim(p_perfil->>'nombre'), (p_perfil->>'genero')::genero_perfil, v_anio, v_intereses, v_hogar);
  end if;
  return hogar_ficha(v_hogar);
end;
$$;

create function hogar_borrar_perfil(p_token text, p_perfil_id bigint)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_hogar bigint := hogar_de_sesion(p_token);
begin
  perform hogar_perfil_propio(v_hogar, p_perfil_id);
  delete from hogar_perfiles where id = p_perfil_id;
  return hogar_ficha(v_hogar);
end;
$$;

-- Las organizaciones con perfil público, para «Unirme». No pide sesión.
create function hogar_organizaciones()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'nombre', o.nombre, 'descripcion', o.descripcion_publica,
                                               'logo', o.logo, 'website', o.website) order by o.nombre), '[]'::jsonb)
    from organizaciones o
   where o.perfil_publico and licencia_vigente(o.id)
$$;

-- Un perfil se une a una comunidad con su código (y, si viene de «Unirme» en una organización, el
-- código debe ser de esa organización). Tras 5 códigos equivocados, 15 minutos sin poder unirse.
create function hogar_unirse(p_token text, p_perfil_id bigint, p_codigo text, p_organizacion_id bigint default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_hogar     hogares;
  v_comunidad comunidades;
  v_codigo    text := regexp_replace(coalesce(p_codigo, ''), '[\s-]', '', 'g');
begin
  select * into v_hogar from hogares where id = hogar_de_sesion(p_token);
  perform hogar_perfil_propio(v_hogar.id, p_perfil_id);

  if v_hogar.codigo_bloqueado_hasta > now() then
    return jsonb_build_object('ok', false, 'error', 'bloqueado');
  end if;

  select c.* into v_comunidad
    from comunidades c
   where c.codigo_acceso = v_codigo and v_codigo ~ '^\d{6}$'
     and (p_organizacion_id is null or c.organizacion_id = p_organizacion_id)
     and licencia_vigente(c.organizacion_id);

  if v_comunidad.id is null then
    update hogares
       set codigo_intentos_fallidos = codigo_intentos_fallidos + 1,
           codigo_bloqueado_hasta = case when codigo_intentos_fallidos + 1 >= 5 then now() + interval '15 minutes' end
     where id = v_hogar.id;
    return jsonb_build_object('ok', false, 'error', 'codigo');
  end if;

  update hogares set codigo_intentos_fallidos = 0, codigo_bloqueado_hasta = null where id = v_hogar.id;
  insert into comunidad_participantes (comunidad_id, hogar_perfil_id)
  values (v_comunidad.id, p_perfil_id)
  on conflict (comunidad_id, hogar_perfil_id) do nothing;

  return jsonb_build_object('ok', true, 'cuenta', hogar_ficha(v_hogar.id));
end;
$$;

create function hogar_salir_de_comunidad(p_token text, p_perfil_id bigint, p_comunidad_id bigint)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_hogar bigint := hogar_de_sesion(p_token);
begin
  perform hogar_perfil_propio(v_hogar, p_perfil_id);
  delete from comunidad_participantes where hogar_perfil_id = p_perfil_id and comunidad_id = p_comunidad_id;
  return hogar_ficha(v_hogar);
end;
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- APP DEL HOGAR: CATÁLOGO Y AVANCE
-- ═════════════════════════════════════════════════════════════════════════════
-- Un storyboard como lo pinta la app del hogar (el runner se abre en /play/<eje>/<slug>).
create function hogar_storyboard(p_sb storyboards, p_idioma idioma)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
           'id', p_sb.id, 'slug', p_sb.slug, 'eje', replace(lower(p_sb.categoria::text), '_', '-'),
           'titulo', localizado(p_sb.titulo, p_idioma, p_sb.idioma_principal), 'edicion', p_sb.edicion,
           'duracion', p_sb.duracion_min, 'enfoques', to_jsonb(p_sb.enfoques_salud))
$$;

-- Sin cuenta: los temarios públicos de Nutrinación, en un país e idioma (y una edición, si se da).
create function hogar_catalogo_publico(p_pais text, p_idioma text, p_edicion text default null)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', t.id, 'origen', 'nutrinacion', 'titulo', localizado(t.titulo, p_idioma::idioma),
           'storyboards', (
             select jsonb_agg(hogar_storyboard(s, p_idioma::idioma) order by ts.orden)
               from temario_storyboards ts join storyboards s on s.id = ts.storyboard_id
              where ts.temario_id = t.id and s.estado_publicacion = 'PUBLICADO'
                and p_idioma::idioma = any (s.idiomas) and disponible_en_pais(s.paises_disponibles, upper(p_pais))
                and (p_edicion is null or s.edicion = p_edicion::edicion_storyboard)))
         order by t.created_at), '[]'::jsonb)
    from temarios t
   where t.organizacion_id is null and t.estado_publicacion = 'PUBLICADO'
$$;

-- Lo que ve un perfil: lo de Nutrinación (por el país de la cuenta) y lo que publican las
-- comunidades donde participa (por el país de la comunidad, con licencia vigente), en el idioma de
-- la cuenta y la edición del perfil. Cada storyboard dice si ya lo terminó y si toca sus intereses.
create function hogar_catalogo(p_token text, p_perfil_id bigint)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_hogar   hogares;
  v_perfil  hogar_perfiles;
  v_edicion edicion_storyboard;
begin
  select * into v_hogar from hogares where id = hogar_de_sesion(p_token);
  v_perfil := hogar_perfil_propio(v_hogar.id, p_perfil_id);
  v_edicion := edicion_de_edad(extract(year from current_date)::int - v_perfil.anio_nacimiento);

  return coalesce((
    with colecciones as (
      -- de Nutrinación
      select t.id as temario_id, null::bigint as storyboard_id, 'nutrinacion' as origen,
             null::bigint as organizacion_id, null::text as organizacion, t.titulo, v_hogar.pais as pais_regla
        from temarios t
       where t.organizacion_id is null and t.estado_publicacion = 'PUBLICADO'
      union
      -- de las comunidades donde participa (union: una misma publicación para toda la organización
      -- y para su comunidad sale una vez)
      select pu.temario_id, pu.storyboard_id, 'organizacion', o.id, o.nombre, t.titulo, c.pais
        from comunidad_participantes cp
        join comunidades c on c.id = cp.comunidad_id
        join organizaciones o on o.id = c.organizacion_id
        join organizacion_publicaciones pu on pu.organizacion_id = o.id and (pu.comunidad_id is null or pu.comunidad_id = c.id)
        left join temarios t on t.id = pu.temario_id
       where cp.hogar_perfil_id = v_perfil.id and pu.disponible_desde <= now() and licencia_vigente(o.id)
         and (t.id is null or t.estado_publicacion = 'PUBLICADO')
    ),
    items as (
      select col.origen, col.organizacion_id, col.organizacion, col.temario_id,
             coalesce('t' || col.temario_id, 's' || col.storyboard_id) as coleccion,
             coalesce(localizado(col.titulo, v_hogar.idioma), localizado(s.titulo, v_hogar.idioma, s.idioma_principal)) as titulo,
             hogar_storyboard(s, v_hogar.idioma) || jsonb_build_object(
               'terminado', exists (select 1 from hogar_perfil_avance a where a.hogar_perfil_id = v_perfil.id and a.storyboard_id = s.id),
               'porInteres', s.enfoques_salud && v_perfil.intereses) as item,
             coalesce(ts.orden, 1) as posicion
        from colecciones col
        left join temario_storyboards ts on ts.temario_id = col.temario_id
        join storyboards s on s.id = coalesce(ts.storyboard_id, col.storyboard_id)
       where s.estado_publicacion = 'PUBLICADO' and s.edicion = v_edicion
         and v_hogar.idioma = any (s.idiomas) and disponible_en_pais(s.paises_disponibles, col.pais_regla)
    )
    select jsonb_agg(c order by c->>'origen' desc, c->>'titulo')
      from (
        select jsonb_build_object(
                 'origen', origen,
                 'organizacion', case when organizacion_id is null then null
                                      else jsonb_build_object('id', organizacion_id, 'nombre', organizacion) end,
                 'temario', temario_id,
                 'titulo', titulo,
                 'storyboards', jsonb_agg(item order by posicion)) as c
          from items
         group by origen, organizacion_id, organizacion, temario_id, coleccion, titulo
      ) agrupado
  ), '[]'::jsonb);
end;
$$;

-- El runner dijo «terminado» en la app del hogar: el perfil lo terminó (una vez basta).
create function hogar_completar(p_token text, p_perfil_id bigint, p_storyboard_id bigint)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_hogar bigint := hogar_de_sesion(p_token);
begin
  perform hogar_perfil_propio(v_hogar, p_perfil_id);
  if not exists (select 1 from storyboards where id = p_storyboard_id and estado_publicacion in ('PUBLICADO', 'ARCHIVADO')) then
    raise exception 'El storyboard % no está disponible', p_storyboard_id using errcode = '42501';
  end if;
  insert into hogar_perfil_avance (hogar_perfil_id, storyboard_id)
  values (p_perfil_id, p_storyboard_id)
  on conflict (hogar_perfil_id, storyboard_id) do nothing;
end;
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- PERMISOS DE EJECUCIÓN
-- ═════════════════════════════════════════════════════════════════════════════
do $$
declare f text;
begin
  foreach f in array array[
    'valida_storyboard_de_organizacion(bigint, bigint)', 'edicion_de_edad(integer)', 'licencia_vigente(bigint)',
    'hogar_de_sesion(text)', 'hogar_perfil_propio(bigint, bigint)', 'hogar_ficha(bigint)', 'hogar_abrir_sesion(bigint)',
    'hogar_storyboard(storyboards, idioma)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
  end loop;

  foreach f in array array[
    'hogar_crear_cuenta(text, text, text, text, text)', 'hogar_entrar(text, text)', 'hogar_sesion(text)',
    'hogar_salir(text)', 'hogar_actualizar_cuenta(text, jsonb)', 'hogar_cambiar_pin(text, text)',
    'hogar_borrar_cuenta(text)', 'hogar_guardar_perfil(text, jsonb)', 'hogar_borrar_perfil(text, bigint)',
    'hogar_organizaciones()', 'hogar_unirse(text, bigint, text, bigint)', 'hogar_salir_de_comunidad(text, bigint, bigint)',
    'hogar_catalogo_publico(text, text, text)', 'hogar_catalogo(text, bigint)', 'hogar_completar(text, bigint, bigint)'
  ] loop
    execute format('revoke all on function %s from public', f);
    execute format('grant execute on function %s to anon, authenticated', f);
  end loop;
end $$;
