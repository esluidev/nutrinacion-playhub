-- 0010: recuperar el acceso a Admin sin enviar correos (decisión 009, Luis 2026-10-28).
--
-- Admin no envía correos: las invitaciones se comparten con «Copiar enlace» y, si alguien olvida
-- su contraseña, quien le dio acceso le genera un enlace para elegir otra. La Edge Function
-- `enlace-recuperacion` lo crea con la API de Auth (service role), pero antes pregunta aquí, con
-- la sesión de quien lo pide, si puede.
--
-- Quién puede:
--   · el superadmin (soporte), para cualquier cuenta de Admin;
--   · el titular de una organización, para una cuenta que solo llega a organizaciones de las que
--     es titular: la administra o colabora en ella (activo o no) y no tiene invitaciones
--     pendientes de otra. Si llegara a otra, el enlace le daría también esa: lo genera soporte.
--     Tampoco para un superadmin.
--   · nadie, para su propia cuenta: la contraseña se cambia desde el perfil.
-- Devuelve el correo de la cuenta (el de Auth) o falla con el motivo.

create function recuperacion_autorizar(p_email text)
returns text
language plpgsql stable security definer set search_path = public
as $$
declare
  v_usuario    uuid;
  v_email      text;
  v_superadmin boolean;
begin
  select u.id, u.email, p.superadmin
    into v_usuario, v_email, v_superadmin
    from auth.users u
    join perfiles p on p.usuario_id = u.id
   where lower(u.email) = lower(trim(p_email));

  if v_usuario is not null and v_usuario = auth.uid() then
    raise exception 'Tu contraseña se cambia desde tu perfil';
  end if;

  if es_superadmin() then
    if v_usuario is null then
      raise exception 'No hay ninguna cuenta de Admin con ese correo';
    end if;
    return v_email;
  end if;

  if not exists (select 1 from organizaciones_titular()) then
    raise exception 'Este enlace lo genera el titular de la organización o soporte' using errcode = '42501';
  end if;

  -- Lo mismo si no existe que si es de otra organización: el titular no averigua cuentas ajenas.
  if v_usuario is null or not exists (
    select 1 from organizacion_administradores oa join perfiles p on p.id = oa.perfil_id
     where p.usuario_id = v_usuario and oa.organizacion_id in (select organizaciones_titular())
    union all
    select 1 from organizacion_colaboradores oc join perfiles p on p.id = oc.perfil_id
     where p.usuario_id = v_usuario and oc.organizacion_id in (select organizaciones_titular())
  ) then
    raise exception 'Esa cuenta no está en tu organización' using errcode = '42501';
  end if;

  if v_superadmin then
    raise exception 'Esa cuenta es de soporte: el enlace lo genera otro superadmin' using errcode = '42501';
  end if;

  if exists (
    select oa.organizacion_id from organizacion_administradores oa join perfiles p on p.id = oa.perfil_id
     where p.usuario_id = v_usuario
    union
    select oc.organizacion_id from organizacion_colaboradores oc join perfiles p on p.id = oc.perfil_id
     where p.usuario_id = v_usuario
    union
    select i.organizacion_id from invitaciones i
     where lower(i.email) = lower(v_email) and i.estado = 'PENDIENTE'
       and (i.expira_en is null or i.expira_en > now())
    except
    select * from organizaciones_titular()
  ) then
    raise exception 'Esa cuenta también tiene acceso a otra organización: el enlace lo genera soporte' using errcode = '42501';
  end if;

  return v_email;
end;
$$;

revoke all on function recuperacion_autorizar(text) from public, anon;
grant execute on function recuperacion_autorizar(text) to authenticated;
