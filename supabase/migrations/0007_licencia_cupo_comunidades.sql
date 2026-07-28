-- 0007 — La licencia manda: no se crean comunidades por encima del cupo
-- ─────────────────────────────────────────────────────────────────────────────
-- Primer pedazo del enforcement de licencias (tarea 016) que se vuelve real: el alta de
-- comunidades valida contra la licencia VIGENTE de la organización. La UI además gatea
-- el botón con el mismo criterio, pero la regla vive AQUÍ — un insert directo por API
-- también la respeta.
--
-- Licencia VIGENTE = estado ACTIVA o TRIAL, ya iniciada, y sin fecha de fin o con
-- fecha de fin todavía no pasada. `fecha_fin` null = licencia indefinida: no vence sola
-- (no hay job de vencimiento; el estado lo administra el superadmin desde Platform).
--
-- El trigger corre para TODOS los roles (también service_role): no hay puerta trasera.
-- Las comunidades ya existentes por encima del cupo no se tocan — solo se frena el alta.

create or replace function comunidades_valida_cupo()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_max    int;
  v_usadas int;
begin
  select l.max_comunidades into v_max
    from licencias l
   where l.organizacion_id = new.organizacion_id
     and l.estado in ('ACTIVA', 'TRIAL')
     and l.fecha_inicio <= current_date
     and (l.fecha_fin is null or l.fecha_fin >= current_date)
   order by l.created_at desc
   limit 1;

  if v_max is null then
    raise exception 'La organización no tiene una licencia vigente';
  end if;

  select count(*) into v_usadas
    from comunidades
   where organizacion_id = new.organizacion_id;

  if v_usadas >= v_max then
    raise exception 'La licencia permite % comunidad(es) y el cupo ya está en uso', v_max;
  end if;

  return new;
end;
$$;

drop trigger if exists comunidades_cupo on comunidades;
create trigger comunidades_cupo
  before insert on comunidades
  for each row execute function comunidades_valida_cupo();
