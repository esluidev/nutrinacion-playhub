-- 0012: la baja de un educador es lógica y de los administradores de su organización (Luis,
-- 2026-11-02).
--
-- Antes, la RLS dejaba a sus administradores borrar la fila por la API. Ninguna pantalla lo
-- hacía, pero el borrado arrastraba en cascada sus asignaciones de taller, la retroalimentación
-- de esas asignaciones y sus sesiones: se perdía el historial. La única baja es ahora
-- `deleted_at` (0004). El borrado físico queda para la base misma, como al eliminar una
-- organización (`platform_eliminar_organizacion`, 0005).
--
-- La baja lo saca de sus grupos: un grupo cuenta y muestra solo a quienes siguen en la
-- organización. Sus talleres se conservan, también el grupo del que vino cada asignación. Y no
-- se da de baja al único educador de un taller publicado: primero se asigna otro, la misma
-- regla que al quitarlo del taller.

drop policy educadores_baja on educadores;
revoke delete on educadores from anon, authenticated;

create function educadores_baja()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.deleted_at is not null and old.deleted_at is null then
    -- Con sesión de Auth, solo un administrador de la organización. Sin sesión (la base, soporte),
    -- sin esta comprobación.
    if auth.uid() is not null and new.organizacion_id not in (select mis_organizaciones()) then
      raise exception 'Solo un administrador de la organización da de baja a un educador'
        using errcode = '42501';
    end if;
    -- Como al quitarlo de un taller (0004): un taller publicado conserva al menos un educador.
    if exists (
      select 1
        from workshop_educadores we
        join workshops w on w.id = we.workshop_id
       where we.educador_id = new.id and we.estado <> 'CANCELADO' and w.estado = 'PUBLICADO'
         and not exists (select 1 from workshop_educadores o
                          where o.workshop_id = we.workshop_id and o.id <> we.id and o.estado <> 'CANCELADO')
    ) then
      raise exception 'Es el único educador de un taller publicado: asigna otro antes de darlo de baja';
    end if;
    delete from educador_grupo_miembros where educador_id = new.id;
  end if;
  return new;
end;
$$;

revoke all on function educadores_baja() from public, anon, authenticated;

create trigger educadores_baja
  before update of deleted_at on educadores
  for each row execute function educadores_baja();

-- Las bajas anteriores dejaban su fila de miembro en el grupo.
delete from educador_grupo_miembros m
 using educadores e
 where e.id = m.educador_id and e.deleted_at is not null;
