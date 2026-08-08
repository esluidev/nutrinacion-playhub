-- 0008 — La comunidad invitada debe pertenecer a la organización de la invitación
-- ─────────────────────────────────────────────────────────────────────────────
-- Hueco detectado el 2026-07-28: la política `invitaciones_gestion` valida que
-- `organizacion_id` sea una de mis organizaciones, pero NADA ata `comunidad_id` a esa
-- organización (no hay CHECK cruzado y `handle_new_user()` tampoco valida). Un admin de la
-- org A podía emitir por API una invitación COLABORADOR con `organizacion_id = A` y una
-- `comunidad_id` de la org B; al registrarse, esa persona quedaba dentro de B.
--
-- Un CHECK no sirve: necesita consultar otra tabla. Va como trigger, mismo criterio que la
-- 0007 — corre para TODOS los roles (también service_role): no hay puerta trasera.
-- Cubre INSERT y UPDATE, porque mover la comunidad después del alta era el mismo agujero.

create or replace function invitaciones_valida_ambito()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_org_de_la_comunidad bigint;
begin
  -- Las invitaciones ADMIN no llevan comunidad: nada que validar.
  if new.comunidad_id is null then
    return new;
  end if;

  select c.organizacion_id into v_org_de_la_comunidad
    from comunidades c
   where c.id = new.comunidad_id;

  if v_org_de_la_comunidad is distinct from new.organizacion_id then
    raise exception
      'La comunidad % no pertenece a la organización % de la invitación',
      new.comunidad_id, new.organizacion_id;
  end if;

  return new;
end;
$$;

drop trigger if exists invitaciones_ambito on invitaciones;
create trigger invitaciones_ambito
  before insert or update on invitaciones
  for each row execute function invitaciones_valida_ambito();
