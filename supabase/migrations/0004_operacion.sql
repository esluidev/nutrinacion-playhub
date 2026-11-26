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
-- PROGRAMAS, LUGARES Y GRUPOS DE AUDIENCIA (tarea 021)
-- ═════════════════════════════════════════════════════════════════════════════
-- Lo que la organización elige al programar un workshop. Ninguna guarda personas: el grupo es a
-- quién se atiende («Parvulario 6», «Público general») y el número de asistentes lo da el cierre de
-- cada workshop. Las FK compuestas `(id, organizacion_id)` impiden mezclar organizaciones.

-- Un programa: para qué y cuándo. Junta talleres sueltos y jornadas, que caen en sus fechas.
-- Opcional; con talleres no se borra.
create table programas (
  id              bigint generated always as identity primary key,
  nombre          text not null,
  descripcion     text,
  fecha_inicio    date not null,
  fecha_fin       date not null,
  organizacion_id bigint not null references organizaciones (id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (id, organizacion_id),
  check (fecha_fin >= fecha_inicio)
);

-- Agrupa varios lugares de un mismo territorio (un barrio, un municipio, una aldea) para el reporte por
-- territorio. Se crea en Lugares, en su pestaña, o desde un lugar, y existe aunque todavía no agrupe ninguno
-- (tarea 023). Al borrarla, sus lugares quedan sin comunidad (la clave de `lugares`). No reparte educadores,
-- permisos ni cupos.
create table comunidades (
  id              bigint generated always as identity primary key,
  nombre          text not null,
  organizacion_id bigint not null references organizaciones (id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (id, organizacion_id)
);

-- Un sitio concreto donde se dan talleres (escuela, centro, plaza); lo de dentro («Aula 3A») va en
-- `workshops.espacio`. Con talleres no se borra: `activo = false` lo retira de la lista.
create table lugares (
  id              bigint generated always as identity primary key,
  nombre          text not null,
  comunidad_id    bigint,
  activo          boolean not null default true,
  organizacion_id bigint not null references organizaciones (id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (id, organizacion_id),
  foreign key (comunidad_id, organizacion_id) references comunidades (id, organizacion_id) on delete set null (comunidad_id)
);

-- A quién se atiende. Independiente del lugar: el mismo grupo se usa en varios. Solo el nombre es
-- obligatorio; las edades y la descripción, opcionales (tarea 023: sin edición, que repetía las edades).
-- `abierto` es el público general (una feria, un evento abierto): cuenta asistencias y no alcance, y su
-- cierre no exige niñas y niños. Cada organización nace con una, «Público general» (`publico_general`,
-- trigger abajo): es fija, solo se le cambia el nombre; no se desactiva, no deja de ser abierta ni se
-- elimina. Las demás, con talleres, no se borran: `activo = false` las desactiva.
create table grupos_audiencia (
  id              bigint generated always as identity primary key,
  nombre          text not null,
  edad_desde      int check (edad_desde between 0 and 120),
  edad_hasta      int check (edad_hasta between 0 and 120),
  descripcion     text,
  abierto         boolean not null default false,
  publico_general boolean not null default false,   -- la que trae cada organización (tarea 023)
  activo          boolean not null default true,
  organizacion_id bigint not null references organizaciones (id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (id, organizacion_id),
  check (edad_hasta is null or edad_desde is null or edad_hasta >= edad_desde)
);

-- ═════════════════════════════════════════════════════════════════════════════
-- JORNADAS Y WORKSHOPS
-- ═════════════════════════════════════════════════════════════════════════════
-- Una jornada es dónde y cuándo se va: un lugar y uno o varios días (decisión 011). Se crea o se
-- elige al programar un workshop, no aparte; sus workshops caen en sus días y toman su lugar y su
-- programa. Si ya se dio alguno de sus workshops, no cambia de lugar ni de programa. Existe
-- mientras tiene workshops: al quedarse sin ninguno se borra sola (triggers abajo).
create table jornadas (
  id              bigint generated always as identity primary key,
  nombre          text not null,
  descripcion     text,
  lugar_id        bigint not null,       -- sus workshops lo toman
  fecha_inicio    date not null,
  fecha_fin       date not null,         -- el mismo día que el inicio si dura uno
  programa_id     bigint,                -- sus workshops lo toman
  organizacion_id bigint not null references organizaciones (id) on delete cascade,
  created_at      timestamptz not null default now(),
  check (fecha_fin >= fecha_inicio),
  foreign key (lugar_id, organizacion_id) references lugares (id, organizacion_id),
  foreign key (programa_id, organizacion_id) references programas (id, organizacion_id)
);

-- El workshop programado. Quién lo imparte va en workshop_educadores. Ciclo (estado_workshop):
--   BORRADOR ⇄ EN_REVISION → PUBLICADO → FINALIZADO → (reprogramar) PUBLICADO
--                                      ↘ CANCELADO  → (reprogramar) PUBLICADO
--   ARCHIVADO (descartado) desde borrador, revisión, finalizado o cancelado.
-- Une un lugar y un grupo (los dos hacen falta para publicar) y, si los tiene, un programa y una
-- jornada; dentro de una jornada, el lugar y el programa son los de ella.
create table workshops (
  id                   bigint generated always as identity primary key,
  titulo               text,
  fecha                date,
  hora_inicio          time,
  hora_fin             time,
  espacio              text,               -- dónde dentro del lugar («Aula 3A», «Patio»)
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
  lugar_id             bigint,             -- para publicar; dentro de una jornada, el de ella
  grupo_audiencia_id   bigint,             -- para publicar
  programa_id          bigint,             -- dentro de una jornada, el de ella
  organizacion_id      bigint not null references organizaciones (id) on delete cascade,
  created_at           timestamptz not null default now(),
  unique (id, organizacion_id),
  check (hora_fin is null or hora_inicio is null or hora_fin > hora_inicio),
  foreign key (lugar_id, organizacion_id) references lugares (id, organizacion_id),
  foreign key (grupo_audiencia_id, organizacion_id) references grupos_audiencia (id, organizacion_id),
  foreign key (programa_id, organizacion_id) references programas (id, organizacion_id)
);

-- Lo que le pasó a un workshop que se quiere contar después: cancelarlo (con su motivo),
-- reprogramarlo y mover la fecha de uno publicado. Lo escribe el trigger, nadie por la API; el
-- workshop solo guarda su estado actual.
create table workshop_historial (
  id             bigint generated always as identity primary key,
  tipo           tipo_cambio_workshop not null,
  fecha_anterior date,
  fecha_nueva    date,
  motivo         text,
  workshop_id    bigint not null references workshops (id) on delete cascade,
  perfil_id      bigint references perfiles (id) on delete set null,  -- quién; null si fue la tarea o SQL
  created_at     timestamptz not null default now()                    -- cuándo
);

-- Qué educador imparte el workshop y su ejecución real. Asignar un grupo de educadores = una
-- fila por educador, recordando de qué grupo vino. Las FK compuestas garantizan que el educador y
-- el workshop son de la misma organización; el trigger, que el educador está activo.
create table workshop_educadores (
  id                bigint generated always as identity primary key,
  estado            estado_asignacion not null default 'PENDIENTE',
  iniciado_en       timestamptz,          -- el runner dijo «listo» en Educators
  terminado_en      timestamptz,          -- el runner dijo «terminado»
  dispositivos_unidos int check (dispositivos_unidos >= 0),  -- los conectados al terminar (educador_terminar); el educador lo corrige en el cierre
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
  asistentes_reales     int not null check (asistentes_reales >= 0),        -- el total
  asistentes_ninas      int check (asistentes_ninas >= 0),                  -- cuántas eran niñas
  asistentes_ninos      int check (asistentes_ninos >= 0),                  -- cuántos eran niños
  participacion_grupo   participacion_grupo not null,
  claridad_contenido    claridad_contenido not null,
  dificultades_grupo    text,             -- qué le costó más al grupo
  material_faltante     text,             -- qué material faltó
  workshop_educador_id  bigint not null unique references workshop_educadores (id) on delete cascade,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  -- Niñas y niños van los dos o ninguno, y suman el total. Son opcionales: el total es lo principal y
  -- el educador puede no haberse fijado (Luis, 2026-11-26).
  constraint workshop_feedback_desglose check (
    (asistentes_ninas is null and asistentes_ninos is null) or asistentes_ninas + asistentes_ninos = asistentes_reales)
);

-- La conexión del taller (tarea 013): cada vez que se da, abre una para que otros dispositivos se
-- unan con el QR o el código. El código vale mientras está abierta y es único entre las abiertas; la
-- llave (aquí solo su huella) la tiene la pantalla del educador para aprobar y quitar. Se cierra al
-- terminar el taller o cuando deja de estar publicado. Si se reprograma y se vuelve a dar, abre otra.
create table workshop_conexiones (
  id              bigint generated always as identity primary key,
  codigo          text not null check (codigo ~ '^[A-HJKMNP-Z2-9]{6}$'),  -- sin 0/O ni 1/I/L: se dicta y se escribe sin dudas
  llave_hash      text not null,
  abierta_en      timestamptz not null default now(),
  cerrada_en      timestamptz,
  workshop_id     bigint not null,
  organizacion_id bigint not null,
  unique (id, organizacion_id),
  foreign key (workshop_id, organizacion_id) references workshops (id, organizacion_id) on delete cascade,
  check (cerrada_en is null or cerrada_en >= abierta_en)
);

-- Quien se une a una conexión desde su dispositivo (tarea 013): un avatar y un apodo, nunca quién es.
-- `dispositivo` es un identificador al azar que el teléfono crea para esa conexión: vuelve como el
-- mismo al recargar, pero no se le sigue de un taller a otro. El tiempo conectado suma las
-- reconexiones; lo anota la pantalla del educador.
create table workshop_conexion_participantes (
  id                   bigint generated always as identity primary key,
  dispositivo          uuid not null,
  avatar               text not null check (avatar ~ '^[a-z]{2,20}$'),  -- la clave del avatar en Player
  apodo                text check (char_length(apodo) between 1 and 20),  -- sin apodo, el nombre del avatar
  estado               estado_participante not null default 'ESPERANDO',
  pidio_en             timestamptz not null default now(),
  -- Mientras espera, el dispositivo da señal (participante_estado, cada 15 s): sin señal en 45 s, su solicitud ya no
  -- cuenta (ni se ve ni la aprueba «Aprobar a todos»). Al irse de la página la retira (participante_retirar).
  ultima_senal_en      timestamptz not null default now(),
  aprobado_en          timestamptz,
  conectado_desde      timestamptz,                                      -- conectado ahora, desde cuándo
  segundos_conectado   int not null default 0 check (segundos_conectado >= 0),
  ultima_salida_en     timestamptz,
  workshop_conexion_id bigint not null,
  organizacion_id      bigint not null,
  unique (workshop_conexion_id, dispositivo),
  foreign key (workshop_conexion_id, organizacion_id) references workshop_conexiones (id, organizacion_id) on delete cascade
);

create index on educadores (organizacion_id);
create index on educador_grupos (organizacion_id);
create index on educador_grupo_miembros (educador_id);
create index on programas (organizacion_id, fecha_inicio, fecha_fin);
create index on comunidades (organizacion_id);
create index on lugares (organizacion_id);
create index on lugares (comunidad_id);
create index on grupos_audiencia (organizacion_id);
create unique index grupos_audiencia_publico_general on grupos_audiencia (organizacion_id) where publico_general;
create index on jornadas (organizacion_id, fecha_inicio, fecha_fin);
create index on jornadas (lugar_id);
create index on jornadas (programa_id);
create index on workshops (organizacion_id, fecha);
create index on workshops (lugar_id);
create index on workshops (grupo_audiencia_id);
create index on workshops (programa_id);
create index on workshop_historial (workshop_id);
create index on workshop_conexiones (workshop_id);
create unique index workshop_conexiones_codigo_abierto on workshop_conexiones (codigo) where cerrada_en is null;
create unique index workshop_conexiones_una_abierta on workshop_conexiones (workshop_id) where cerrada_en is null;
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

-- Una jornada existe aunque no tenga workshops (tarea 023): tiene su sección en Admin, se crea primero y después se le
-- agregan. Si se queda sin ninguno, sigue ahí hasta que alguien la borre.

-- El workshop de una jornada toma su lugar y su programa. Corre antes que workshops_estado (los
-- BEFORE van por orden alfabético), para que la regla de publicar vea el lugar que tomó.
create function workshops_toma_de_la_jornada()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_j jornadas;
begin
  if new.jornada_id is not null then
    select * into v_j from jornadas where id = new.jornada_id;
    new.lugar_id := v_j.lugar_id;
    new.programa_id := v_j.programa_id;
  end if;
  return new;
end;
$$;

create trigger workshops_de_la_jornada
  before insert or update on workshops
  for each row execute function workshops_toma_de_la_jornada();

-- Un lugar o un grupo retirado (`activo = false`) no entra en un workshop nuevo ni en uno que
-- cambia a él; los que ya lo tenían no se tocan. El workshop de un programa cae en sus fechas.
create function workshops_valida_lugar_grupo_programa()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_p programas;
begin
  if new.lugar_id is not null and (tg_op = 'INSERT' or new.lugar_id is distinct from old.lugar_id)
     and not (select activo from lugares where id = new.lugar_id) then
    raise exception 'El lugar está retirado: elige otro o vuelve a activarlo';
  end if;
  if new.grupo_audiencia_id is not null
     and (tg_op = 'INSERT' or new.grupo_audiencia_id is distinct from old.grupo_audiencia_id)
     and not (select activo from grupos_audiencia where id = new.grupo_audiencia_id) then
    raise exception 'El grupo está retirado: elige otro o vuelve a activarlo';
  end if;
  if new.programa_id is not null and new.fecha is not null and new.estado <> 'ARCHIVADO' then
    select * into v_p from programas where id = new.programa_id;
    if new.fecha not between v_p.fecha_inicio and v_p.fecha_fin then
      raise exception 'La fecha % está fuera del programa «%» (% a %)', new.fecha, v_p.nombre, v_p.fecha_inicio, v_p.fecha_fin;
    end if;
  end if;
  return new;
end;
$$;

create trigger workshops_lugar_grupo_programa
  before insert or update on workshops
  for each row execute function workshops_valida_lugar_grupo_programa();

-- Un programa no cambia de fechas si deja fuera a alguno de sus workshops (como la jornada; los
-- archivados no cuentan).
create function programas_valida_fechas()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_fecha date;
begin
  select min(w.fecha) into v_fecha
    from workshops w
   where w.programa_id = new.id and w.fecha is not null and w.estado <> 'ARCHIVADO'
     and w.fecha not between new.fecha_inicio and new.fecha_fin;
  if v_fecha is not null then
    raise exception 'El programa «%» tiene talleres fuera de esas fechas (el primero, el %): muévelos antes', new.nombre, v_fecha;
  end if;
  return new;
end;
$$;

create trigger programas_fechas
  before update of fecha_inicio, fecha_fin on programas
  for each row execute function programas_valida_fechas();

-- Una jornada con workshops ya dados no cambia de lugar ni de programa: el reporte cambiaría lo que
-- ya pasó. Si ninguno se dio, sus workshops la siguen (los archivados no se tocan).
create function jornadas_valida_cambio()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if exists (select 1 from workshops w where w.jornada_id = new.id and workshop_empezado(w.id)) then
    raise exception 'La jornada «%» ya tiene talleres dados: no cambia de lugar ni de programa', new.nombre;
  end if;
  return new;
end;
$$;

create trigger jornadas_cambio
  before update of lugar_id, programa_id on jornadas
  for each row when (new.lugar_id is distinct from old.lugar_id or new.programa_id is distinct from old.programa_id)
  execute function jornadas_valida_cambio();

create function jornadas_propaga()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update workshops set lugar_id = new.lugar_id, programa_id = new.programa_id
   where jornada_id = new.id and estado <> 'ARCHIVADO';
  return null;
end;
$$;

create trigger jornadas_propaga
  after update of lugar_id, programa_id on jornadas
  for each row when (new.lugar_id is distinct from old.lugar_id or new.programa_id is distinct from old.programa_id)
  execute function jornadas_propaga();

-- Cada organización nace con su audiencia «Público general», abierta (tarea 023): para una feria o un evento
-- abierto ya está, y nadie tiene que crearla ni puede olvidar marcarla.
create function organizaciones_publico_general()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into grupos_audiencia (nombre, abierto, publico_general, organizacion_id) values ('Público general', true, true, new.id);
  return null;
end;
$$;

create trigger organizaciones_publico_general
  after insert on organizaciones
  for each row execute function organizaciones_publico_general();

-- «Público general» es fija: se le cambia el nombre (y la edad o la descripción), pero no se desactiva, no deja
-- de ser abierta ni se elimina, y ninguna otra pasa a serlo. Se va solo con su organización (al borrarla, la
-- organización ya no existe cuando llega el borrado en cascada).
create function grupos_audiencia_protege_publico_general()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.publico_general and exists (select 1 from organizaciones where id = old.organizacion_id) then
      raise exception 'La audiencia «Público general» de la organización no se elimina';
    end if;
    return old;
  end if;
  if new.publico_general is distinct from old.publico_general then
    raise exception 'La audiencia «Público general» es la que trae la organización: no se cambia cuál es';
  end if;
  if old.publico_general and (not new.activo or not new.abierto) then
    raise exception 'La audiencia «Público general» de la organización no se desactiva ni deja de ser abierta';
  end if;
  return new;
end;
$$;

create trigger grupos_audiencia_publico_general
  before update or delete on grupos_audiencia
  for each row execute function grupos_audiencia_protege_publico_general();

-- Alguno de sus educadores ya lo empezó.
create function workshop_empezado(p_workshop_id bigint)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from workshop_educadores where workshop_id = p_workshop_id and iniciado_en is not null)
$$;

-- El ciclo del workshop, para cualquier camino (Admin, Educators o SQL):
--   · nace en borrador o en revisión; se publica con fecha, hora, lugar, grupo y al menos un educador;
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
    if new.estado = 'PUBLICADO' and (new.lugar_id is null or new.grupo_audiencia_id is null) then
      raise exception 'Un workshop publicado necesita lugar y grupo';
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
    if new.lugar_id is null or new.grupo_audiencia_id is null then
      raise exception 'Para publicar, el workshop necesita lugar y grupo';
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

-- Eliminar un workshop (tarea 023) se lleva sus asignaciones, su historial y sus conexiones: solo cabe mientras no se ha
-- dado. En borrador o en revisión, siempre; publicado, si nadie lo empezó. Finalizado, cancelado o archivado, no: se
-- archiva (descartado) y lo que pasó se queda para el reporte. La baja de una organización
-- (platform_eliminar_organizacion) se lleva todos los suyos.
create function workshops_valida_borrado()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if current_setting('playhub.baja_de_organizacion', true) = old.organizacion_id::text then
    return old;
  end if;
  if old.estado in ('BORRADOR', 'EN_REVISION')
     or (old.estado = 'PUBLICADO' and not workshop_empezado(old.id)) then
    return old;
  end if;
  raise exception 'Solo se elimina un workshop que no se ha dado (borrador, en revisión o publicado sin empezar): archívalo';
end;
$$;

create trigger workshops_borrado
  before delete on workshops
  for each row execute function workshops_valida_borrado();

-- El historial: cancelar (con su motivo), reprogramar y mover la fecha de uno publicado. Quién lo
-- hizo sale de la sesión de Admin; la tarea horaria y el SQL dejan `perfil_id` en null.
create function workshops_anota_historial()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_perfil bigint := (select id from perfiles where usuario_id = auth.uid());
begin
  if new.estado = 'CANCELADO' and old.estado <> 'CANCELADO' then
    insert into workshop_historial (tipo, fecha_anterior, motivo, workshop_id, perfil_id)
    values ('CANCELADO', old.fecha, new.motivo_cancelacion, new.id, v_perfil);
  elsif new.estado = 'PUBLICADO' and old.estado in ('FINALIZADO', 'CANCELADO') then
    insert into workshop_historial (tipo, fecha_anterior, fecha_nueva, workshop_id, perfil_id)
    values ('REPROGRAMADO', old.fecha, new.fecha, new.id, v_perfil);
  elsif new.estado = 'PUBLICADO' and old.estado = 'PUBLICADO' and new.fecha is distinct from old.fecha then
    insert into workshop_historial (tipo, fecha_anterior, fecha_nueva, workshop_id, perfil_id)
    values ('FECHA_CAMBIADA', old.fecha, new.fecha, new.id, v_perfil);
  end if;
  return null;
end;
$$;

create trigger workshops_historial
  after update on workshops
  for each row execute function workshops_anota_historial();

-- Cierra la conexión abierta del workshop (tarea 013): el código deja de valer y el tiempo de quien
-- seguía conectado se suma hasta ahora. La llaman educador_terminar y el trigger de abajo.
create function workshop_cierra_conexion(p_workshop_id bigint)
returns void
language sql
security definer set search_path = public
as $$
  with cerrada as (
    update workshop_conexiones set cerrada_en = now()
     where workshop_id = p_workshop_id and cerrada_en is null
    returning id
  )
  update workshop_conexion_participantes p
     set segundos_conectado = p.segundos_conectado + greatest(0, extract(epoch from now() - p.conectado_desde))::int,
         conectado_desde = null,
         ultima_salida_en = now()
    from cerrada
   where p.workshop_conexion_id = cerrada.id and p.conectado_desde is not null;
$$;

-- Un workshop que deja de estar publicado (finalizado, también por la tarea horaria, o cancelado)
-- cierra su conexión.
create function workshops_cierra_conexion()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform workshop_cierra_conexion(new.id);
  return null;
end;
$$;

create trigger workshops_conexion
  after update of estado on workshops
  for each row when (old.estado = 'PUBLICADO' and new.estado <> 'PUBLICADO')
  execute function workshops_cierra_conexion();

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
