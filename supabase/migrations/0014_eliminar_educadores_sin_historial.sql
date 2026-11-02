-- 0014: eliminar de verdad al educador que no ha dado ningún taller (Luis, 2026-11-02).
--
-- 0012 dejó la baja lógica como la única salida: borrar a un educador se lleva en cascada sus
-- asignaciones y, con ellas, el feedback de los talleres que dio. Pero a quien nunca dio uno, la
-- baja lo deja como una fila sin uso. Ahora un administrador lo elimina, y con él se van sus
-- asignaciones a talleres que no dio, sus grupos, sus sesiones y su enlace de acceso. Si tiene
-- historial, se sigue dando de baja.
--
--   educador_tiene_historial(educador) → quien opera su organización: si ya dio algún taller
--   educador_eliminar(educador)        → un administrador de su organización: lo borra si no tiene historial
--
-- Dio un taller si en alguna de sus asignaciones lo inició, lo terminó o dejó feedback, o si el
-- taller quedó finalizado sin que lo quitaran. Como en la baja, un taller publicado conserva al
-- menos un educador (`workshop_educadores_baja`, 0004): para eliminar al único, antes se asigna otro.

create function educador_tiene_historial(p_educador_id bigint)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
declare
  v_org bigint;
begin
  select organizacion_id into v_org from educadores where id = p_educador_id and deleted_at is null;
  if v_org is null or v_org not in (select organizaciones_opero()) then
    raise exception 'Sin permiso sobre el educador %', p_educador_id using errcode = '42501';
  end if;

  return exists (
    select 1
      from workshop_educadores we
      join workshops w on w.id = we.workshop_id
     where we.educador_id = p_educador_id
       and (we.iniciado_en is not null
            or we.terminado_en is not null
            or we.estado in ('EN_CURSO', 'COMPLETADO')
            or exists (select 1 from workshop_feedback f where f.workshop_educador_id = we.id)
            or (w.estado = 'FINALIZADO' and we.estado <> 'CANCELADO')));
end;
$$;

create function educador_eliminar(p_educador_id bigint)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_org bigint;
begin
  select organizacion_id into v_org from educadores where id = p_educador_id and deleted_at is null;
  if v_org is null or v_org not in (select mis_organizaciones()) then
    raise exception 'Solo un administrador de la organización elimina a un educador' using errcode = '42501';
  end if;
  if educador_tiene_historial(p_educador_id) then
    raise exception 'Ya dio talleres: dalo de baja para conservar su historial';
  end if;

  -- La cascada se lleva sus asignaciones (y el trigger impide dejar sin educador un taller
  -- publicado), sus grupos y sus sesiones.
  delete from educadores where id = p_educador_id;
end;
$$;

revoke all on function educador_tiene_historial(bigint) from public, anon;
grant execute on function educador_tiene_historial(bigint) to authenticated;
revoke all on function educador_eliminar(bigint) from public, anon;
grant execute on function educador_eliminar(bigint) to authenticated;
