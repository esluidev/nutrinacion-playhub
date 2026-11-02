-- 0013: el acceso del educador es un enlace, como las invitaciones (Luis, 2026-11-02).
--
-- Antes (0006), Admin generaba un código de 6 dígitos que el educador escribía en el campo del PIN.
-- Se guardaba con hash y no se podía volver a ver; no vencía, no salía por correo y, al generarlo,
-- borraba el PIN. Ahora Admin crea un enlace de acceso a Educators (`/acceso/<token>`), que se envía
-- por correo y se puede copiar mientras siga pendiente. Con él, el educador ve su correo y solo
-- elige su PIN: la primera vez o cuando lo olvidó. Su PIN anterior sigue valiendo hasta que use el
-- enlace; al usarlo se cierran las sesiones de ese acceso.
--
--   educador_crear_acceso(educador)    → quien opera su organización: { token, expira_en }
--   educador_acceso(token)             → { ok, correo, nombre, organizacion, primera_vez, expira_en } | { ok: false, error: no_vale }
--   educador_usar_acceso(token, pin)   → elige su PIN y entra (la respuesta de educador_entrar)
--   educador_revocar_acceso(educador)  → quien opera su organización: el enlace pendiente deja de valer
--   educador_verificar_pin(token, pin) → desde su cuenta, confirma que es él: { ok } | { ok: false, error }
--   educador_cambiar_pin(token, actual, pin) → y elige el nuevo: { ok } | { ok: false, error }
--
-- El correo lo manda la Edge Function `enviar-acceso-educador` con las plantillas `acceso_educador`
-- (primera vez) y `acceso_educador_pin` (PIN nuevo), en el idioma del educador.

drop function educador_generar_codigo(bigint);
drop function educador_activar(text, text, text);

alter table educadores drop column activacion_pendiente;
alter table educadores drop column codigo_activacion_hash;
alter table educadores
  add column acceso_token              text unique,   -- el enlace pendiente; null si no hay
  add column acceso_creado_en          timestamptz,   -- cuándo se creó el pendiente
  add column acceso_expira_en          timestamptz,   -- 7 días desde que se creó
  add column acceso_correo_enviado_en  timestamptz,   -- el último envío que Resend aceptó (como 0011)
  add column acceso_correo_error       text;          -- por qué falló el último intento; null si salió

-- Quien opera la organización ve el enlace para copiarlo. Limpiar el error es la forma en que la
-- Edge Function comprueba, con la sesión de quien la llama, que puede enviarlo (como 0011).
grant select (acceso_token, acceso_creado_en, acceso_expira_en, acceso_correo_enviado_en, acceso_correo_error) on educadores to authenticated;
grant update (acceso_correo_error) on educadores to authenticated;

-- Entrar: solo correo y PIN (el código ya no existe).
create or replace function educador_entrar(p_correo text, p_pin text)
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
    return educador_falla(v_correo);
  end if;

  return educador_abrir_sesion(v_ids);
end;
$$;

-- Admin: crea (o renueva) el enlace. No toca el PIN ni las sesiones: un enlace de más no deja a
-- nadie fuera.
create function educador_crear_acceso(p_educador_id bigint)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_org    bigint;
  v_token  text := encode(gen_random_bytes(24), 'hex');
  v_expira timestamptz := now() + interval '7 days';
begin
  select organizacion_id into v_org from educadores where id = p_educador_id and deleted_at is null;
  if v_org is null or v_org not in (select organizaciones_opero()) then
    raise exception 'Sin permiso sobre el educador %', p_educador_id using errcode = '42501';
  end if;

  update educadores
     set acceso_token = v_token,
         acceso_creado_en = now(),
         acceso_expira_en = v_expira,
         acceso_correo_enviado_en = null,
         acceso_correo_error = null
   where id = p_educador_id;

  return jsonb_build_object('token', v_token, 'expira_en', v_expira);
end;
$$;

-- Educators: lo que muestra la página del enlace antes de elegir el PIN.
create function educador_acceso(p_token text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select jsonb_build_object(
              'ok', true, 'correo', e.correo, 'nombre', e.nombre, 'organizacion', o.nombre,
              'primera_vez', e.pin_hash is null, 'expira_en', e.acceso_expira_en)
       from educadores e
       join organizaciones o on o.id = e.organizacion_id
      where e.acceso_token = p_token and e.acceso_expira_en > now() and e.activo and e.deleted_at is null),
    jsonb_build_object('ok', false, 'error', 'no_vale'));
$$;

-- Educators: elige su PIN con el enlace y entra. El enlace vale una vez.
create function educador_usar_acceso(p_token text, p_pin text)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_pin    text := regexp_replace(coalesce(p_pin, ''), '[\s-]', '', 'g');
  v_id     bigint;
  v_correo text;
  v_ids    bigint[];
begin
  if v_pin !~ '^\d{6}$' then
    return jsonb_build_object('ok', false, 'error', 'pin_invalido');
  end if;

  select id, lower(correo) into v_id, v_correo
    from educadores
   where acceso_token = p_token and acceso_expira_en > now() and activo and deleted_at is null
   for update;
  if v_id is null then
    return jsonb_build_object('ok', false, 'error', 'no_vale');
  end if;

  update educadores
     set pin_hash = crypt(v_pin, gen_salt('bf', 8)),
         acceso_token = null,
         acceso_creado_en = null,
         acceso_expira_en = null,
         acceso_correo_enviado_en = null,
         acceso_correo_error = null,
         pin_intentos_fallidos = 0,
         pin_bloqueado_hasta = null
   where id = v_id;

  -- Si olvidó el PIN, una sesión abierta en otro dispositivo deja de valer.
  delete from educador_sesiones where educador_id = v_id;

  -- Como al entrar: una sesión con todos sus accesos que tienen este PIN.
  select array_agg(id) into v_ids
    from educadores
   where lower(correo) = v_correo and activo and deleted_at is null
     and pin_hash = crypt(v_pin, pin_hash);

  return educador_abrir_sesion(v_ids);
end;
$$;

-- Admin: revoca el enlace pendiente, como una invitación. Su PIN, si lo tiene, sigue valiendo.
create function educador_revocar_acceso(p_educador_id bigint)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_org bigint;
begin
  select organizacion_id into v_org from educadores where id = p_educador_id and deleted_at is null;
  if v_org is null or v_org not in (select organizaciones_opero()) then
    raise exception 'Sin permiso sobre el educador %', p_educador_id using errcode = '42501';
  end if;

  update educadores
     set acceso_token = null,
         acceso_creado_en = null,
         acceso_expira_en = null,
         acceso_correo_enviado_en = null,
         acceso_correo_error = null
   where id = p_educador_id;
end;
$$;

revoke all on function educador_crear_acceso(bigint) from public, anon;
grant execute on function educador_crear_acceso(bigint) to authenticated;
revoke all on function educador_revocar_acceso(bigint) from public, anon;
grant execute on function educador_revocar_acceso(bigint) to authenticated;
revoke all on function educador_acceso(text) from public;
grant execute on function educador_acceso(text) to anon, authenticated;
revoke all on function educador_usar_acceso(text, text) from public;
grant execute on function educador_usar_acceso(text, text) to anon, authenticated;

-- La URL de Educators, como la de Admin (0001): la usan el enlace que copia Admin y el correo.
insert into configuracion (clave, descripcion) values
  ('educators_url', 'URL de Educators; la usan el enlace de acceso del educador y su correo');

-- Los correos del enlace, en español e inglés (el idioma del educador), en `plantillas_correo`.
insert into plantillas_correo (clave, nombre, asunto, cuerpo, cta_label) values
  ('acceso_educador', 'Acceso de educador',
   '{"es":"{org} te agregó como educador","en":"{org} added you as an educator"}',
   '{"es":"Hola, {nombre}:\n\n{org} te agregó como educador.\n\nElige tu PIN de 6 dígitos para empezar: con tu correo y ese PIN entrarás a Educators. El enlace vence el {expira}.","en":"Hello, {nombre}:\n\n{org} added you as an educator.\n\nChoose your 6-digit PIN to get started: you will sign in to Educators with your email and that PIN. The link expires on {expira}."}',
   '{"es":"Elegir mi PIN","en":"Choose my PIN"}'),
  ('acceso_educador_pin', 'Nuevo PIN de educador',
   '{"es":"Cambia tu PIN de Educators","en":"Change your Educators PIN"}',
   '{"es":"Hola, {nombre}:\n\n{org} te envió un enlace para elegir un PIN nuevo.\n\nTu PIN actual sigue valiendo hasta que lo cambies. El enlace vence el {expira}.","en":"Hello, {nombre}:\n\n{org} sent you a link to choose a new PIN.\n\nYour current PIN keeps working until you change it. The link expires on {expira}."}',
   '{"es":"Elegir un PIN nuevo","en":"Choose a new PIN"}');

-- Cambiar el PIN desde la cuenta pide el actual: la sesión dura 30 días y puede quedar abierta en
-- una tableta compartida. Educators lo hace en dos pasos: primero confirma que es él
-- (`educador_verificar_pin`) y después elige el nuevo (`educador_cambiar_pin`, que lo vuelve a
-- comprobar). Un PIN actual equivocado cuenta como un fallo al entrar (cinco bloquean 15 minutos)
-- y, con el bloqueo puesto, no vale. Quien no recuerda el actual usa el enlace.
create function educador_verificar_pin(p_token text, p_pin text)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_ids    bigint[] := educadores_de_sesion(p_token);
  v_pin    text := regexp_replace(coalesce(p_pin, ''), '[\s-]', '', 'g');
  v_correo text;
begin
  select lower(correo) into v_correo from educadores where id = v_ids[1];
  if exists (select 1 from educadores where lower(correo) = v_correo and deleted_at is null and pin_bloqueado_hasta > now()) then
    return jsonb_build_object('ok', false, 'error', 'bloqueado');
  end if;
  if not exists (select 1 from educadores where id = any (v_ids) and pin_hash = crypt(v_pin, pin_hash)) then
    perform educador_falla(v_correo);
    return jsonb_build_object('ok', false, 'error', 'pin_actual');
  end if;

  update educadores set pin_intentos_fallidos = 0, pin_bloqueado_hasta = null where id = any (v_ids);
  return jsonb_build_object('ok', true);
end;
$$;

drop function educador_cambiar_pin(text, text);
create function educador_cambiar_pin(p_token text, p_pin_actual text, p_pin text)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_ids bigint[] := educadores_de_sesion(p_token);
  v_pin text := regexp_replace(coalesce(p_pin, ''), '[\s-]', '', 'g');
  v_r   jsonb;
begin
  if v_pin !~ '^\d{6}$' then
    return jsonb_build_object('ok', false, 'error', 'pin_invalido');
  end if;
  v_r := educador_verificar_pin(p_token, p_pin_actual);
  if not (v_r->>'ok')::boolean then
    return v_r;
  end if;

  update educadores set pin_hash = crypt(v_pin, gen_salt('bf', 8)) where id = any (v_ids);
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function educador_verificar_pin(text, text) from public;
grant execute on function educador_verificar_pin(text, text) to anon, authenticated;
revoke all on function educador_cambiar_pin(text, text, text) from public;
grant execute on function educador_cambiar_pin(text, text, text) to anon, authenticated;
