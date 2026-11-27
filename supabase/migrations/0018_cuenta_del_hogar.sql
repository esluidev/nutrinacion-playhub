-- 0018: la cuenta del adulto en la app del hogar (tarea 025; Luis, 2026-11-27).
--
-- Sin cuenta, todo queda en el dispositivo. Quien quiere guardar los perfiles de sus niños (y lo que cada uno terminó
-- y dónde iba) y tenerlos en otro dispositivo crea una cuenta: su correo y un PIN de 6 dígitos, como Educators y sin
-- Supabase Auth (decisión 005). La app usa la anon key y estas funciones con un token; nunca lee tablas. El correo se
-- confirma con un código de 6 dígitos que manda la Edge Function `enviar-codigo-hogar` (Resend), no con un enlace: un
-- enlace abriría el navegador y no la app instalada, donde están los perfiles. El mismo código sirve para elegir un
-- PIN nuevo cuando lo olvidó.
--
--   hogar_codigo_nuevo(correo)              → solo `enviar-codigo-hogar` (service_role): { ok, codigo, tiene_pin }
--                                             | { ok: false, error: correo | espera }
--   hogar_confirmar(correo, codigo, pin)    → con el código elige su PIN y entra: la respuesta de hogar_entrar
--                                             | { ok: false, error: credenciales | bloqueado | pin_invalido }
--   hogar_entrar(correo, pin)               → { ok, token, cuenta: { correo } } | { ok: false, error: credenciales | bloqueado }
--   hogar_cuenta(token)                     → { correo } (error 28000 si la sesión no vale: la app la olvida)
--   hogar_salir(token)
--   hogar_eliminar_cuenta(token)            → borra la cuenta, sus perfiles y sus sesiones
--   hogar_perfiles(token)                   → sus perfiles, también los eliminados (para quitarlos de cada dispositivo)
--   hogar_guardar_perfiles(token, perfiles) → guarda los que traen un cambio más nuevo y devuelve hogar_perfiles
--
-- Cada perfil, la forma que manda la app y que devuelven las funciones:
--   { id, nombre, avatar, mes, anio, genero, terminados: [clave], avance: { clave, indice, escenas } | null,
--     actualizado, eliminado }
-- De cada perfil gana el cambio más nuevo. Uno eliminado queda marcado, sin sus datos, para que los demás
-- dispositivos lo quiten.
--
-- PIN, código y token se guardan con hash. El código vence a los 15 minutos; entre dos envíos a un correo pasa un
-- minuto, y no salen más de 5 por hora. Tras 5 fallos con un correo (PIN o código), 15 minutos sin poder entrar. Una
-- sesión dura un año; un PIN nuevo cierra las demás. El correo que pidió un código y no lo confirmó en un día se borra.

create table hogar_cuentas (
  id                    bigint generated always as identity primary key,
  correo                text not null unique check (correo = lower(trim(correo)) and correo ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  pin_hash              text,                       -- null hasta que confirma el correo
  pin_intentos_fallidos int not null default 0,
  pin_bloqueado_hasta   timestamptz,
  codigo_hash           text,                       -- el código pendiente; null si no hay
  codigo_expira_en      timestamptz,
  codigo_enviado_en     timestamptz,                -- el último envío (un minuto hasta el siguiente)
  codigos_desde         timestamptz,                -- desde cuándo se cuentan los envíos de esta hora
  codigos_enviados      int not null default 0,
  created_at            timestamptz not null default now()
);

create table hogar_sesiones (
  token_hash text primary key,                      -- sha256 del token
  cuenta_id  bigint not null references hogar_cuentas (id) on delete cascade,
  expira_en  timestamptz not null,
  created_at timestamptz not null default now()
);

create index on hogar_sesiones (cuenta_id);

-- Los perfiles de los niños: lo mismo que guarda el dispositivo (apodo, avatar, mes y año, género) y lo que terminó y
-- dónde iba cada uno. `id` es el del dispositivo, al azar.
create table hogar_perfiles (
  cuenta_id   bigint not null references hogar_cuentas (id) on delete cascade,
  id          text not null check (id ~ '^[A-Za-z0-9_-]{1,40}$'),
  nombre      text check (char_length(nombre) between 1 and 20),
  avatar      text check (avatar ~ '^[a-z]{1,20}$'),
  mes         smallint check (mes between 1 and 12),
  anio        smallint check (anio between 1990 and 2100),
  genero      text check (genero in ('nina', 'nino')),
  terminados  text[] not null default '{}' check (cardinality(terminados) <= 500),
  avance      jsonb check (avance is null or jsonb_typeof(avance) = 'object'),
  actualizado timestamptz not null,
  eliminado   boolean not null default false,
  creado      timestamptz not null default now(),
  primary key (cuenta_id, id),
  check (eliminado or (nombre is not null and avatar is not null and mes is not null and anio is not null and genero is not null))
);

-- Sin políticas: nadie las lee por la API; solo estas funciones.
alter table hogar_cuentas enable row level security;
alter table hogar_sesiones enable row level security;
alter table hogar_perfiles enable row level security;
revoke all on hogar_cuentas, hogar_sesiones, hogar_perfiles from anon, authenticated;

-- ═════════════════════════════════════════════════════════════════════════════
-- AUXILIARES (internas: sin permiso de ejecución para nadie)
-- ═════════════════════════════════════════════════════════════════════════════
-- La cuenta de un token vigente; si no vale, error 28000 (la app olvida la sesión).
create function hogar_cuenta_de_sesion(p_token text)
returns bigint
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_id bigint;
begin
  select cuenta_id into v_id
    from hogar_sesiones
   where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex') and expira_en > now();
  if v_id is null then
    raise exception 'La sesión no es válida o caducó' using errcode = '28000';
  end if;
  return v_id;
end;
$$;

-- Abre una sesión y devuelve la respuesta de entrar.
create function hogar_abrir_sesion(p_cuenta bigint)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_token text := encode(gen_random_bytes(32), 'hex');
begin
  update hogar_cuentas set pin_intentos_fallidos = 0, pin_bloqueado_hasta = null where id = p_cuenta;
  delete from hogar_sesiones where expira_en < now();
  insert into hogar_sesiones (token_hash, cuenta_id, expira_en)
  values (encode(digest(v_token, 'sha256'), 'hex'), p_cuenta, now() + interval '1 year');
  return jsonb_build_object('ok', true, 'token', v_token,
    'cuenta', (select jsonb_build_object('correo', correo) from hogar_cuentas where id = p_cuenta));
end;
$$;

-- Un fallo más para el correo; al quinto, 15 minutos de bloqueo.
create function hogar_falla(p_correo text)
returns jsonb
language sql security definer set search_path = public
as $$
  update hogar_cuentas
     set pin_intentos_fallidos = pin_intentos_fallidos + 1,
         pin_bloqueado_hasta = case when pin_intentos_fallidos + 1 >= 5 then now() + interval '15 minutes' end
   where correo = p_correo;
  select jsonb_build_object('ok', false, 'error', 'credenciales');
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- EL CÓDIGO POR CORREO (solo la Edge Function)
-- ═════════════════════════════════════════════════════════════════════════════
-- Crea la cuenta si el correo no la tiene, guarda el hash de un código nuevo y lo devuelve una vez para mandarlo.
create function hogar_codigo_nuevo(p_correo text)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_correo text := lower(trim(coalesce(p_correo, '')));
  v_bytes  bytea := gen_random_bytes(4);
  v_codigo text;
  v_cuenta hogar_cuentas;
begin
  if char_length(v_correo) > 254 or v_correo !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return jsonb_build_object('ok', false, 'error', 'correo');
  end if;

  delete from hogar_cuentas where pin_hash is null and created_at < now() - interval '1 day';
  insert into hogar_cuentas (correo) values (v_correo) on conflict (correo) do nothing;
  select * into v_cuenta from hogar_cuentas where correo = v_correo for update;

  if v_cuenta.codigo_enviado_en > now() - interval '1 minute'
     or (v_cuenta.codigos_desde > now() - interval '1 hour' and v_cuenta.codigos_enviados >= 5) then
    return jsonb_build_object('ok', false, 'error', 'espera');
  end if;

  v_codigo := lpad((((get_byte(v_bytes, 0)::bigint << 24) | (get_byte(v_bytes, 1) << 16)
                     | (get_byte(v_bytes, 2) << 8) | get_byte(v_bytes, 3)) % 1000000)::text, 6, '0');

  update hogar_cuentas
     set codigo_hash = crypt(v_codigo, gen_salt('bf', 8)),
         codigo_expira_en = now() + interval '15 minutes',
         codigo_enviado_en = now(),
         codigos_desde = case when codigos_desde > now() - interval '1 hour' then codigos_desde else now() end,
         codigos_enviados = case when codigos_desde > now() - interval '1 hour' then codigos_enviados + 1 else 1 end
   where id = v_cuenta.id;

  return jsonb_build_object('ok', true, 'codigo', v_codigo, 'tiene_pin', v_cuenta.pin_hash is not null);
end;
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- LA APP DEL HOGAR: CONFIRMAR, ENTRAR Y SALIR
-- ═════════════════════════════════════════════════════════════════════════════
-- Devuelven { ok: false, error } en vez de lanzar un error: un error desharía el conteo de intentos fallidos.
create function hogar_confirmar(p_correo text, p_codigo text, p_pin text)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_correo text := lower(trim(coalesce(p_correo, '')));
  v_codigo text := regexp_replace(coalesce(p_codigo, ''), '[\s-]', '', 'g');
  v_pin    text := regexp_replace(coalesce(p_pin, ''), '[\s-]', '', 'g');
  v_id     bigint;
begin
  if v_correo = '' or v_codigo !~ '^\d{6}$' then
    return jsonb_build_object('ok', false, 'error', 'credenciales');
  end if;
  if v_pin !~ '^\d{6}$' then
    return jsonb_build_object('ok', false, 'error', 'pin_invalido');
  end if;
  if exists (select 1 from hogar_cuentas where correo = v_correo and pin_bloqueado_hasta > now()) then
    return jsonb_build_object('ok', false, 'error', 'bloqueado');
  end if;

  select id into v_id
    from hogar_cuentas
   where correo = v_correo and codigo_expira_en > now() and codigo_hash = crypt(v_codigo, codigo_hash);
  if v_id is null then
    return hogar_falla(v_correo);
  end if;

  update hogar_cuentas
     set pin_hash = crypt(v_pin, gen_salt('bf', 8)), codigo_hash = null, codigo_expira_en = null
   where id = v_id;
  delete from hogar_sesiones where cuenta_id = v_id;
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
  v_id     bigint;
begin
  if v_correo = '' or v_pin !~ '^\d{6}$' then
    return jsonb_build_object('ok', false, 'error', 'credenciales');
  end if;
  if exists (select 1 from hogar_cuentas where correo = v_correo and pin_bloqueado_hasta > now()) then
    return jsonb_build_object('ok', false, 'error', 'bloqueado');
  end if;

  select id into v_id from hogar_cuentas where correo = v_correo and pin_hash = crypt(v_pin, pin_hash);
  if v_id is null then
    return hogar_falla(v_correo);
  end if;
  return hogar_abrir_sesion(v_id);
end;
$$;

create function hogar_cuenta(p_token text)
returns jsonb
language sql security definer set search_path = public, extensions
as $$
  select jsonb_build_object('correo', correo) from hogar_cuentas where id = hogar_cuenta_de_sesion(p_token)
$$;

create function hogar_salir(p_token text)
returns void
language sql security definer set search_path = public, extensions
as $$
  delete from hogar_sesiones where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex')
$$;

create function hogar_eliminar_cuenta(p_token text)
returns void
language sql security definer set search_path = public, extensions
as $$
  delete from hogar_cuentas where id = hogar_cuenta_de_sesion(p_token)
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- LA APP DEL HOGAR: LOS PERFILES
-- ═════════════════════════════════════════════════════════════════════════════
create function hogar_perfiles(p_token text)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_id bigint := hogar_cuenta_de_sesion(p_token);
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', id, 'nombre', nombre, 'avatar', avatar, 'mes', mes, 'anio', anio, 'genero', genero,
             'terminados', to_jsonb(terminados), 'avance', avance, 'actualizado', actualizado, 'eliminado', eliminado)
           order by creado, id)
      from hogar_perfiles where cuenta_id = v_id), '[]'::jsonb);
end;
$$;

-- Hasta 20 perfiles por cuenta. La fecha de cada cambio la pone el dispositivo; si viene del futuro (un reloj mal
-- puesto), cuenta como ahora.
create function hogar_guardar_perfiles(p_token text, p_perfiles jsonb)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_id          bigint := hogar_cuenta_de_sesion(p_token);
  v_p           jsonb;
  v_actualizado timestamptz;
begin
  if jsonb_typeof(p_perfiles) is distinct from 'array' or jsonb_array_length(p_perfiles) > 50 then
    raise exception 'Los perfiles no son válidos' using errcode = '22023';
  end if;

  for v_p in select value from jsonb_array_elements(p_perfiles) loop
    v_actualizado := least(coalesce((v_p->>'actualizado')::timestamptz, now()), now());

    if coalesce((v_p->>'eliminado')::boolean, false) then
      insert into hogar_perfiles (cuenta_id, id, actualizado, eliminado)
      values (v_id, v_p->>'id', v_actualizado, true)
      on conflict (cuenta_id, id) do update
         set nombre = null, avatar = null, mes = null, anio = null, genero = null, terminados = '{}', avance = null,
             actualizado = excluded.actualizado, eliminado = true
       where hogar_perfiles.actualizado < excluded.actualizado;
    else
      insert into hogar_perfiles (cuenta_id, id, nombre, avatar, mes, anio, genero, terminados, avance, actualizado)
      values (v_id, v_p->>'id', v_p->>'nombre', v_p->>'avatar', (v_p->>'mes')::smallint, (v_p->>'anio')::smallint,
              v_p->>'genero', array(select jsonb_array_elements_text(coalesce(v_p->'terminados', '[]'::jsonb))),
              nullif(v_p->'avance', 'null'::jsonb), v_actualizado)
      on conflict (cuenta_id, id) do update
         set nombre = excluded.nombre, avatar = excluded.avatar, mes = excluded.mes, anio = excluded.anio,
             genero = excluded.genero, terminados = excluded.terminados, avance = excluded.avance,
             actualizado = excluded.actualizado, eliminado = false
       where hogar_perfiles.actualizado < excluded.actualizado;
    end if;
  end loop;

  if (select count(*) from hogar_perfiles where cuenta_id = v_id and not eliminado) > 20 then
    raise exception 'Una cuenta tiene hasta 20 perfiles' using errcode = '22023';
  end if;
  return hogar_perfiles(p_token);
end;
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- LOS CORREOS DEL CÓDIGO
-- ═════════════════════════════════════════════════════════════════════════════
-- `enviar-codigo-hogar` conoce {codigo}. Sin botón: el código se escribe en la app.
insert into plantillas_correo (clave, nombre, asunto, cuerpo, cta_label) values
  ('codigo_hogar', 'Código para crear la cuenta del hogar',
   '{"es":"Tu código de Nutrinación Play: {codigo}","en":"Your Nutrinación Play code: {codigo}"}',
   '{"es":"Hola:\n\nEscribe este código en la app para crear tu cuenta y elegir tu PIN:\n\n{codigo}\n\nVence en 15 minutos. Si no lo pediste, ignora este correo.","en":"Hello:\n\nEnter this code in the app to create your account and choose your PIN:\n\n{codigo}\n\nIt expires in 15 minutes. If you did not ask for it, ignore this email."}',
   null),
  ('codigo_hogar_pin', 'Código para un PIN nuevo de la cuenta del hogar',
   '{"es":"Tu código de Nutrinación Play: {codigo}","en":"Your Nutrinación Play code: {codigo}"}',
   '{"es":"Hola:\n\nEscribe este código en la app para elegir un PIN nuevo:\n\n{codigo}\n\nVence en 15 minutos. Tu PIN actual sigue valiendo hasta que elijas otro. Si no lo pediste, ignora este correo.","en":"Hello:\n\nEnter this code in the app to choose a new PIN:\n\n{codigo}\n\nIt expires in 15 minutes. Your current PIN keeps working until you choose another. If you did not ask for it, ignore this email."}',
   null);

-- ═════════════════════════════════════════════════════════════════════════════
-- PERMISOS DE EJECUCIÓN
-- ═════════════════════════════════════════════════════════════════════════════
do $$
declare f text;
begin
  -- Internas.
  foreach f in array array['hogar_cuenta_de_sesion(text)', 'hogar_abrir_sesion(bigint)', 'hogar_falla(text)'] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
  end loop;

  -- Solo la Edge Function, con la service role.
  execute 'revoke all on function hogar_codigo_nuevo(text) from public, anon, authenticated';
  execute 'grant execute on function hogar_codigo_nuevo(text) to service_role';

  -- La app del hogar (sin sesión de Auth): la anon key más el token.
  foreach f in array array[
    'hogar_confirmar(text, text, text)', 'hogar_entrar(text, text)', 'hogar_cuenta(text)', 'hogar_salir(text)',
    'hogar_eliminar_cuenta(text)', 'hogar_perfiles(text)', 'hogar_guardar_perfiles(text, jsonb)'
  ] loop
    execute format('revoke all on function %s from public', f);
    execute format('grant execute on function %s to anon, authenticated', f);
  end loop;
end $$;
