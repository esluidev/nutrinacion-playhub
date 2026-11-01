-- 0004: la operación de la organización: educadores, jornadas y workshops (decisión 011).
--
-- La constitución distingue el workshop programado (workshops) de su ejecución real
-- (workshop_educadores.iniciado_en / terminado_en). La evidencia es de grupo: nunca puntos,
-- respuestas ni escenas completadas, y nada de un participante.
-- Todo cuelga de la organización: `organizacion_id` en cada tabla y FK compuestas
-- `(id, organizacion_id)` para que un grupo, un workshop o una asignación solo junten piezas de
-- la misma organización sin un trigger que lo compruebe.

-- ═════════════════════════════════════════════════════════════════════════════
-- EDUCADORES
-- ═════════════════════════════════════════════════════════════════════════════
-- El educador pertenece a la organización. No es usuario de Supabase Auth (decisión 005): entra a
-- Educators con su correo y un PIN de 6 dígitos que elige él la primera vez, con el código de
-- activación que le da Admin (0006). El código y el PIN se guardan cifrados y nadie los lee por la
-- API (0005). `activo = false` lo aparta sin perder su historial; `deleted_at` es la baja lógica.
create table educadores (
  id                      bigint generated always as identity primary key,
  nombre                  text not null,
  apellido                text,
  correo                  text not null,                 -- con el que entra en Educators
  telefono                text,
  profesion               text,
  biografia               text,
  avatar                  text,
  idioma                  idioma not null default 'es',  -- el de su app; el del contenido es del workshop
  activo                  boolean not null default true, -- interruptor rápido de Admin
  deleted_at              timestamptz,                   -- baja lógica
  pais                    text references paises (codigo),
  codigo_activacion_hash  text,                          -- bcrypt del código de Admin; null = ya eligió PIN o no tiene
  pin_hash                text,                          -- bcrypt del PIN que eligió
  pin_intentos_fallidos   int not null default 0,
  pin_bloqueado_hasta     timestamptz,                   -- tras 5 fallos seguidos, 15 minutos
  -- Lo que Admin puede saber del acceso sin leer los hashes:
  tiene_pin               boolean generated always as (pin_hash is not null) stored,
  activacion_pendiente    boolean generated always as (codigo_activacion_hash is not null) stored,
  organizacion_id         bigint not null references organizaciones (id) on delete cascade,
  created_at              timestamptz not null default now(),
  unique (id, organizacion_id),                          -- para las FK compuestas de grupos y asignaciones
  check (correo ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$')
);

-- Un correo, una vez por organización (entre los no borrados).
create unique index educadores_correo_por_organizacion on educadores (organizacion_id, lower(correo)) where deleted_at is null;
create index on educadores (lower(correo));

-- Grupos de educadores: para asignar un workshop a varios educadores a la vez.
create table educador_grupos (
  id              bigint generated always as identity primary key,
  nombre          text not null,
  descripcion     text,
  activo          boolean not null default true,
  organizacion_id bigint not null references organizaciones (id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (id, organizacion_id)
);

-- Quién está en cada grupo: solo educadores de la misma organización (la FK compuesta lo garantiza).
create table educador_grupo_miembros (
  id                bigint generated always as identity primary key,
  educador_grupo_id bigint not null,
  educador_id       bigint not null references educadores (id) on delete cascade,  -- directa: la API la usa para embeber
  organizacion_id   bigint not null,     -- la fija el trigger desde el grupo
  unique (educador_grupo_id, educador_id),
  foreign key (educador_grupo_id, organizacion_id) references educador_grupos (id, organizacion_id) on delete cascade,
  foreign key (educador_id, organizacion_id) references educadores (id, organizacion_id) on delete cascade
);

-- ═════════════════════════════════════════════════════════════════════════════
-- JORNADAS Y WORKSHOPS
-- ═════════════════════════════════════════════════════════════════════════════
-- Una jornada es dónde y cuándo se va: un lugar y uno o varios días (decisión 011). Se crea o se
-- elige al programar un workshop, no aparte; sus workshops caen en sus días y heredan su lugar
-- (el del workshop pasa a ser el detalle: «Aula 3A»). Existe mientras tiene workshops: al quedarse
-- sin ninguno se borra sola (triggers abajo).
create table jornadas (
  id              bigint generated always as identity primary key,
  nombre          text not null,
  descripcion     text,
  ubicacion       text not null,         -- el lugar; sus workshops lo heredan
  fecha_inicio    date not null,
  fecha_fin       date not null,         -- el mismo día que el inicio si dura uno
  organizacion_id bigint not null references organizaciones (id) on delete cascade,
  created_at      timestamptz not null default now(),
  check (fecha_fin >= fecha_inicio)
);

-- El workshop programado. Quién lo imparte va en workshop_educadores. Ciclo (estado_workshop):
--   BORRADOR ⇄ EN_REVISION → PUBLICADO → FINALIZADO → (reprogramar) PUBLICADO
--                                      ↘ CANCELADO  → (reprogramar) PUBLICADO
--   ARCHIVADO (descartado) desde borrador, revisión, finalizado o cancelado.
create table workshops (
  id                   bigint generated always as identity primary key,
  titulo               text,
  fecha                date,
  hora_inicio          time,
  hora_fin             time,
  ubicacion            text,               -- suelto, el lugar; dentro de una jornada, el detalle («Aula 3A»)
  grupo_asistente      text,               -- el grupo que asiste («2.º B»); sin registrar participantes
  asistentes_estimados int check (asistentes_estimados >= 0),
  idioma_contenido     idioma not null default 'es',   -- uno de los idiomas del storyboard
  modalidad            modalidad_workshop not null default 'PRESENCIAL',
  estado               estado_workshop not null default 'BORRADOR',
  publicado_en         timestamptz,        -- la primera vez que lo vieron sus educadores
  finalizado_en        timestamptz,
  cancelado_en         timestamptz,
  motivo_cancelacion   text,
  reprogramaciones     int not null default 0,
  notas                text,
  storyboard_id        bigint not null references storyboards (id) on delete restrict,
  jornada_id           bigint references jornadas (id) on delete set null,
  organizacion_id      bigint not null references organizaciones (id) on delete cascade,
  created_at           timestamptz not null default now(),
  unique (id, organizacion_id),
  check (hora_fin is null or hora_inicio is null or hora_fin > hora_inicio)
);

-- Qué educador imparte el workshop y su ejecución real. Asignar un grupo de educadores = una
-- fila por educador, recordando de qué grupo vino. Las FK compuestas garantizan que el educador y
-- el workshop son de la misma organización; el trigger, que el educador está activo.
create table workshop_educadores (
  id                bigint generated always as identity primary key,
  estado            estado_asignacion not null default 'PENDIENTE',
  iniciado_en       timestamptz,          -- el runner dijo «listo» en Educators
  terminado_en      timestamptz,          -- el runner dijo «terminado»
  workshop_id       bigint not null,
  educador_id       bigint not null references educadores (id) on delete cascade,  -- directa: la API la usa para embeber
  educador_grupo_id bigint references educador_grupos (id) on delete set null,
  organizacion_id   bigint not null,      -- la fija el trigger desde el workshop
  created_at        timestamptz not null default now(),
  unique (workshop_id, educador_id),
  foreign key (workshop_id, organizacion_id) references workshops (id, organizacion_id) on delete cascade,
  foreign key (educador_id, organizacion_id) references educadores (id, organizacion_id) on delete cascade,
  check (terminado_en is null or iniciado_en is null or terminado_en >= iniciado_en)
);

-- El feedback del workshop: lo que el educador cuenta al terminar. Calidad operativa del grupo,
-- uno por educador asignado. Nunca respuestas, puntos ni datos de una persona.
create table workshop_feedback (
  id                    bigint generated always as identity primary key,
  calificacion          int not null check (calificacion between 1 and 5),  -- cómo salió, según el educador
  asistentes_reales     int not null check (asistentes_reales >= 0),
  participacion_grupo   participacion_grupo not null,
  claridad_contenido    claridad_contenido not null,
  dificultades_grupo    text,             -- qué le costó más al grupo
  material_faltante     text,             -- qué material faltó
  workshop_educador_id  bigint not null unique references workshop_educadores (id) on delete cascade,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index on educadores (organizacion_id);
create index on educador_grupos (organizacion_id);
create index on educador_grupo_miembros (educador_id);
create index on jornadas (organizacion_id, fecha_inicio, fecha_fin);
create index on workshops (organizacion_id, fecha);
create index on workshops (storyboard_id);
create index on workshops (jornada_id);
create index on workshops (estado, fecha);
create index on workshop_educadores (educador_id);
create index on workshop_educadores (organizacion_id);

-- ═════════════════════════════════════════════════════════════════════════════
-- TRIGGERS: grupos
-- ═════════════════════════════════════════════════════════════════════════════
-- La organización de las tablas de unión sale de su padre; las FK compuestas comprueban el resto.
create function fija_organizacion_del_grupo()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.organizacion_id := (select organizacion_id from educador_grupos where id = new.educador_grupo_id);
  return new;
end;
$$;

create trigger educador_grupo_miembros_organizacion
  before insert or update on educador_grupo_miembros
  for each row execute function fija_organizacion_del_grupo();

-- ═════════════════════════════════════════════════════════════════════════════
-- TRIGGERS: jornadas y workshops
-- ═════════════════════════════════════════════════════════════════════════════
-- Qué se programa: un storyboard disponible para la organización (publicado y, si es estándar, en
-- alguno de sus países; si es personalizado, suyo), en uno de sus idiomas, y solo una jornada de
-- la organización; con jornada y fecha, la fecha cae en los días de la jornada. Se comprueba al
-- crearlo, al cambiar storyboard, idioma, jornada o fecha y al publicarlo (entre medias el
-- storyboard pudo cambiar).
create function workshops_valida()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_sb storyboards;
  v_j  jornadas;
begin
  if tg_op = 'UPDATE' and new.storyboard_id = old.storyboard_id and new.idioma_contenido = old.idioma_contenido
     and new.organizacion_id = old.organizacion_id and new.jornada_id is not distinct from old.jornada_id
     and new.fecha is not distinct from old.fecha
     and not (new.estado = 'PUBLICADO' and old.estado is distinct from 'PUBLICADO') then
    return new;
  end if;

  select * into v_sb from storyboards where id = new.storyboard_id;

  if not disponible_para_organizacion(new.storyboard_id, new.organizacion_id) then
    if v_sb.estado_publicacion <> 'PUBLICADO' then
      raise exception 'El storyboard % no está publicado', new.storyboard_id;
    elsif v_sb.organizacion_id is not null then
      raise exception 'El storyboard % es personalizado de otra organización', new.storyboard_id;
    end if;
    raise exception 'El storyboard % no está disponible en los países de la organización', new.storyboard_id;
  end if;
  if not new.idioma_contenido = any (v_sb.idiomas) then
    raise exception 'El storyboard % no está en el idioma %', new.storyboard_id, new.idioma_contenido;
  end if;

  if new.jornada_id is not null then
    select * into v_j from jornadas where id = new.jornada_id;
    if v_j.organizacion_id is distinct from new.organizacion_id then
      raise exception 'La jornada % es de otra organización', new.jornada_id;
    end if;
    if new.fecha is not null and new.fecha not between v_j.fecha_inicio and v_j.fecha_fin then
      raise exception 'La fecha % está fuera de la jornada «%» (% a %)', new.fecha, v_j.nombre, v_j.fecha_inicio, v_j.fecha_fin;
    end if;
  end if;
  return new;
end;
$$;

create trigger workshops_validacion
  before insert or update on workshops
  for each row execute function workshops_valida();

-- Una jornada no cambia de días si deja fuera a alguno de sus workshops con fecha. Los archivados
-- no cuentan: están descartados y no se pueden tocar, así que bloquearían la jornada para siempre.
create function jornadas_valida_fechas()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_fecha date;
  v_n     int;
begin
  select w.fecha, count(*) over () into v_fecha, v_n
    from workshops w
   where w.jornada_id = new.id and w.fecha is not null and w.estado <> 'ARCHIVADO'
     and w.fecha not between new.fecha_inicio and new.fecha_fin
   order by w.fecha
   limit 1;
  if v_fecha is not null then
    raise exception 'La jornada «%» tiene % workshop(s) fuera de esas fechas (el primero, el %): muévelos o sácalos antes',
      new.nombre, v_n, v_fecha;
  end if;
  return new;
end;
$$;

create trigger jornadas_fechas
  before update of fecha_inicio, fecha_fin on jornadas
  for each row execute function jornadas_valida_fechas();

-- Una jornada existe mientras tiene workshops: cuando el último se borra o sale de ella, se borra
-- sola. Así no quedan jornadas vacías que limpiar desde ninguna pantalla.
create function jornadas_borra_vacia()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if old.jornada_id is not null and (tg_op = 'DELETE' or new.jornada_id is distinct from old.jornada_id) then
    delete from jornadas j
     where j.id = old.jornada_id
       and not exists (select 1 from workshops w where w.jornada_id = j.id);
  end if;
  return null;
end;
$$;

create trigger workshops_jornada_vacia
  after delete or update of jornada_id on workshops
  for each row execute function jornadas_borra_vacia();

-- Alguno de sus educadores ya lo empezó.
create function workshop_empezado(p_workshop_id bigint)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from workshop_educadores where workshop_id = p_workshop_id and iniciado_en is not null)
$$;

-- El ciclo del workshop, para cualquier camino (Admin, Educators o SQL):
--   · nace en borrador o en revisión; se publica con fecha, hora y al menos un educador;
--   · publicado no vuelve atrás: se finaliza o se cancela (si nadie lo empezó);
--   · reprogramar = de finalizado o cancelado a publicado, con fecha desde hoy, si nadie lo empezó
--     (lo que ya se dio se repite creando uno nuevo: su ejecución y su feedback son de este);
--   · archivado (descartado) no se modifica.
create function workshops_valida_estado()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_permitidas estado_workshop[];
begin
  if tg_op = 'INSERT' then
    if new.estado not in ('BORRADOR', 'EN_REVISION') then
      raise exception 'Un workshop nace en borrador o en revisión: se publica cuando tiene educador';
    end if;
    return new;
  end if;

  -- Un archivado no se toca, salvo para soltarlo de su jornada cuando se borra (`on delete set null`).
  if old.estado = 'ARCHIVADO'
     and not (new.jornada_id is null and old.jornada_id is not null
              and (to_jsonb(new) - 'jornada_id') = (to_jsonb(old) - 'jornada_id')) then
    raise exception 'Un workshop archivado (descartado) no se modifica';
  end if;
  if new.estado = old.estado then
    if new.estado = 'PUBLICADO' and (new.fecha is null or new.hora_inicio is null) then
      raise exception 'Un workshop publicado necesita fecha y hora';
    end if;
    return new;
  end if;

  v_permitidas := case old.estado
    when 'BORRADOR'    then '{EN_REVISION,PUBLICADO,ARCHIVADO}'
    when 'EN_REVISION' then '{BORRADOR,PUBLICADO,ARCHIVADO}'
    when 'PUBLICADO'   then '{FINALIZADO,CANCELADO}'
    when 'FINALIZADO'  then '{PUBLICADO,ARCHIVADO}'
    when 'CANCELADO'   then '{PUBLICADO,ARCHIVADO}'
  end::estado_workshop[];
  if not new.estado = any (v_permitidas) then
    raise exception 'Un workshop % no pasa a %', lower(old.estado::text), lower(new.estado::text);
  end if;

  if new.estado = 'PUBLICADO' then
    if new.fecha is null or new.hora_inicio is null then
      raise exception 'Para publicar, el workshop necesita fecha y hora';
    end if;
    if not exists (select 1 from workshop_educadores where workshop_id = new.id and estado <> 'CANCELADO') then
      raise exception 'Para publicar, asigna al menos un educador';
    end if;
    if old.estado in ('FINALIZADO', 'CANCELADO') then
      if workshop_empezado(new.id) then
        raise exception 'Ya se dio (o se empezó): para repetirlo, crea uno nuevo';
      end if;
      if new.fecha < current_date then
        raise exception 'Para reprogramar, elige una fecha desde hoy';
      end if;
      new.reprogramaciones := old.reprogramaciones + 1;
      new.finalizado_en := null;
      new.cancelado_en := null;
      new.motivo_cancelacion := null;
    end if;
    new.publicado_en := coalesce(old.publicado_en, now());
  elsif new.estado = 'FINALIZADO' then
    new.finalizado_en := now();
  elsif new.estado = 'CANCELADO' then
    if workshop_empezado(new.id) then
      raise exception 'El workshop ya se empezó: no se puede cancelar';
    end if;
    new.cancelado_en := now();
  end if;
  return new;
end;
$$;

create trigger workshops_estado
  before insert or update on workshops
  for each row execute function workshops_valida_estado();

-- Pasa a FINALIZADO lo publicado cuya fecha ya pasó. Lo llama una tarea cada hora (0009). Margen
-- de 12 h sobre UTC: un workshop del día D se finaliza a las 12:00 UTC de D+1 (06:00 en
-- Guatemala), cuando ese día ya terminó en todo el continente.
create function finalizar_workshops_vencidos()
returns int
language plpgsql
security definer set search_path = public
as $$
declare
  v_n int;
begin
  update workshops set estado = 'FINALIZADO'
   where estado = 'PUBLICADO' and fecha < (now() - interval '12 hours')::date;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- TRIGGERS: asignaciones y feedback
-- ═════════════════════════════════════════════════════════════════════════════
create function fija_organizacion_del_workshop()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.organizacion_id := (select organizacion_id from workshops where id = new.workshop_id);
  return new;
end;
$$;

create trigger workshop_educadores_organizacion
  before insert or update on workshop_educadores
  for each row execute function fija_organizacion_del_workshop();

-- Se asigna a un educador activo y no dado de baja; el grupo del que viene es de la organización;
-- solo se empieza un workshop publicado.
create function workshop_educadores_valida()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (tg_op = 'INSERT' or new.educador_id <> old.educador_id) and not exists (
       select 1 from educadores where id = new.educador_id and activo and deleted_at is null) then
    raise exception 'El educador % no está activo', new.educador_id;
  end if;
  if new.educador_grupo_id is not null
     and (select organizacion_id from educador_grupos where id = new.educador_grupo_id) is distinct from new.organizacion_id then
    raise exception 'El grupo % es de otra organización', new.educador_grupo_id;
  end if;
  if new.iniciado_en is not null and (tg_op = 'INSERT' or old.iniciado_en is null)
     and (select estado from workshops where id = new.workshop_id) <> 'PUBLICADO' then
    raise exception 'Solo se empieza un workshop publicado';
  end if;
  return new;
end;
$$;

-- Corre después de fijar la organización (orden alfabético de los triggers BEFORE).
create trigger workshop_educadores_valida
  before insert or update on workshop_educadores
  for each row execute function workshop_educadores_valida();

-- Un workshop publicado conserva al menos un educador: para cambiarlo, se asigna el nuevo antes de
-- quitar al anterior. Si lo que se borra es el workshop (cascada), ya no está y no aplica.
create function workshop_educadores_baja()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (select estado from workshops where id = old.workshop_id) = 'PUBLICADO'
     and not exists (select 1 from workshop_educadores
                      where workshop_id = old.workshop_id and id <> old.id and estado <> 'CANCELADO') then
    raise exception 'Un workshop publicado necesita al menos un educador: asigna otro antes de quitar este';
  end if;
  return old;
end;
$$;

create trigger workshop_educadores_baja
  before delete on workshop_educadores
  for each row execute function workshop_educadores_baja();

-- Al guardar el feedback, la asignación del educador queda completada.
create function workshop_feedback_completa()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update workshop_educadores
     set estado = 'COMPLETADO',
         terminado_en = coalesce(terminado_en, now())
   where id = new.workshop_educador_id;
  return new;
end;
$$;

create trigger workshop_feedback_completa
  after insert on workshop_feedback
  for each row execute function workshop_feedback_completa();

create trigger workshop_feedback_updated_at
  before update on workshop_feedback
  for each row execute function toca_updated_at();

-- Cuando todos sus educadores lo completan, el workshop pasa a FINALIZADO sin esperar a la tarea.
create function workshop_finaliza_si_completo()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.estado = 'COMPLETADO' and not exists (
       select 1 from workshop_educadores
        where workshop_id = new.workshop_id and estado not in ('COMPLETADO', 'CANCELADO')) then
    update workshops set estado = 'FINALIZADO' where id = new.workshop_id and estado = 'PUBLICADO';
  end if;
  return new;
end;
$$;

create trigger workshop_educadores_finaliza
  after update of estado on workshop_educadores
  for each row execute function workshop_finaliza_si_completo();
