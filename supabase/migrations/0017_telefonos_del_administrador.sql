-- 0017: el administrador tiene teléfono móvil y de oficina (Luis, 2026-11-06).
--
-- Hasta ahora el único contacto de un usuario de Admin era su correo. El perfil lleva ahora
-- `telefono_movil` y `telefono_oficina`, los dos opcionales y en texto libre, como el teléfono de la
-- organización y el del educador. Cada quien edita los suyos en /perfil (grant por columna, como
-- nombre, apellido, avatar e idioma).
--
-- De paso, lo que la pantalla «Editar Administrador» daba por hecho y la base no permitía: la única
-- política de edición de `perfiles` (0005) era la del propio perfil, así que el titular que corregía
-- el nombre de otro administrador no cambiaba nada y la app decía «Cambios guardados». Ahora el
-- titular edita los perfiles de los administradores de sus organizaciones, y el superadmin los de
-- cualquier organización (el mismo gate que ya tenía la UI). El correo, `superadmin` y `usuario_id`
-- siguen sin poder escribirse desde la API. Platform también ve los teléfonos
-- (`platform_administradores`).

alter table perfiles
  add column telefono_movil   text,
  add column telefono_oficina text;

grant update (telefono_movil, telefono_oficina) on perfiles to authenticated;

-- Los perfiles que puedo editar además del mío: los administradores de las organizaciones de las que
-- soy titular y, para el superadmin, los administradores de cualquier organización.
create function perfiles_editables()
returns setof bigint
language sql stable security definer set search_path = public
as $$
  select oa.perfil_id
    from organizacion_administradores oa
   where oa.organizacion_id in (select organizaciones_titular())
      or es_superadmin()
$$;

revoke all on function perfiles_editables() from public, anon;
grant execute on function perfiles_editables() to authenticated;

create policy perfiles_edicion_administradores on perfiles for update to authenticated
  using (id in (select perfiles_editables()))
  with check (id in (select perfiles_editables()));

-- Platform ve a los administradores con sus teléfonos. Cambia la forma de la fila, así que la función
-- se vuelve a crear (y a dar permiso).
drop function platform_administradores(bigint);

create function platform_administradores(p_organizacion_id bigint)
returns table (id bigint, perfil_id bigint, nombre text, apellido text, email text,
               telefono_movil text, telefono_oficina text, titular boolean,
               created_at timestamptz, ultimo_acceso timestamptz)
language plpgsql stable security definer set search_path = public
as $$
#variable_conflict use_column
begin
  if not es_superadmin() then
    raise exception 'Solo el superadmin' using errcode = '42501';
  end if;
  return query
  select oa.id, p.id, p.nombre, p.apellido, p.email, p.telefono_movil, p.telefono_oficina, oa.titular,
         oa.created_at, u.last_sign_in_at
    from organizacion_administradores oa
    join perfiles p on p.id = oa.perfil_id
    left join auth.users u on u.id = p.usuario_id
   where oa.organizacion_id = p_organizacion_id
   order by oa.titular desc, oa.created_at;
end;
$$;

revoke all on function platform_administradores(bigint) from public, anon;
grant execute on function platform_administradores(bigint) to authenticated;
