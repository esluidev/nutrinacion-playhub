-- 0002: capa comercial, identidad y tenancy.
--   organizacion → contrato (organizacion_licencias), administradores y educadores
--     └── comunidad → tenancy operativo (nunca «workspace»): colaboradores, educadores (ligados),
--                     participantes (perfiles del hogar, 0009) y workshops
-- Los usuarios de Admin usan Supabase Auth; los educadores (0006) y el hogar (0009), no.

-- ═════════════════════════════════════════════════════════════════════════════
-- ORGANIZACIÓN Y LICENCIA
-- ═════════════════════════════════════════════════════════════════════════════
create table organizaciones (
  id                  bigint generated always as identity primary key,
  nombre              text not null,
  correo              text,
  telefono            text,
  website             text,
  perfil_publico      boolean not null default false,   -- sale en la lista de «Unirme» de la app del hogar
  descripcion_publica jsonb,                            -- lo que ven las familias en esa lista
  logo                text,
  tipo_id             bigint references tipos_organizacion (id),
  created_at          timestamptz not null default now()
);

-- Capacidad y alcance del contrato, con números concretos. La organización accede al catálogo
-- estándar y a sus personalizados (hasta max_personalizados). No hay niveles gratis o premium.
create table organizacion_licencias (
  id                 bigint generated always as identity primary key,
  max_comunidades    int not null check (max_comunidades >= 0),
  max_educadores     int not null check (max_educadores >= 0),
  max_personalizados int not null default 0 check (max_personalizados >= 0),
  fecha_inicio       date not null,
  fecha_fin          date,                                  -- null = sin vencimiento
  estado             estado_licencia not null default 'ACTIVA',
  notas              text,
  paises             text[] not null default '{}',          -- donde puede abrir comunidades (códigos de `paises`); vacío = sin restricción
  organizacion_id    bigint not null references organizaciones (id) on delete cascade,
  created_at         timestamptz not null default now(),
  check (fecha_fin is null or fecha_fin >= fecha_inicio)
);

-- ═════════════════════════════════════════════════════════════════════════════
-- IDENTIDAD (usuarios de Admin)
-- ═════════════════════════════════════════════════════════════════════════════
-- `superadmin` es lo único global (abre Platform) y solo se da a mano: ninguna sesión puede
-- escribir esa columna (0005). Ser admin o colaborador vive en las tablas de pertenencia.
create table perfiles (
  id         bigint generated always as identity primary key,
  nombre     text,
  apellido   text,
  email      text,
  avatar     text,
  idioma     idioma not null default 'es',
  superadmin boolean not null default false,
  usuario_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Quién administra una organización. `titular` es quien firma el contrato: uno por organización.
-- Lo designa el superadmin (a mano o con una invitación de titular).
create table organizacion_administradores (
  id              bigint generated always as identity primary key,
  titular         boolean not null default false,
  organizacion_id bigint not null references organizaciones (id) on delete cascade,
  perfil_id       bigint not null references perfiles (id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (organizacion_id, perfil_id)
);

create unique index organizacion_administradores_un_titular on organizacion_administradores (organizacion_id) where titular;

-- Una comunidad está en un país (el de su licencia): decide qué storyboards puede usar.
-- `codigo_acceso` es el que reparte a las familias para unirse desde la app del hogar (0009);
-- cambiarlo solo impide altas nuevas.
create table comunidades (
  id                 bigint generated always as identity primary key,
  nombre             text not null,
  descripcion        text,
  correo             text,
  telefono           text,
  logo               text,
  pais               text not null references paises (codigo),
  codigo_acceso       text unique check (codigo_acceso ~ '^\d{6}$'),
  codigo_acceso_desde timestamptz,
  organizacion_id    bigint not null references organizaciones (id) on delete restrict,
  created_at         timestamptz not null default now()
);

-- Quien ayuda a gestionar una comunidad. Los admins de la organización no necesitan fila:
-- ya administran todas sus comunidades.
create table comunidad_colaboradores (
  id           bigint generated always as identity primary key,
  activo       boolean not null default true,
  comunidad_id bigint not null references comunidades (id) on delete cascade,
  perfil_id    bigint not null references perfiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (comunidad_id, perfil_id)
);

-- Alta cerrada: la organización y su licencia ya existen; el token solo enlaza a una persona.
-- El superadmin no se invita y los educadores tampoco (entran con correo y código).
create table invitaciones (
  id              bigint generated always as identity primary key,
  token           uuid not null unique default gen_random_uuid(),
  role            rol_invitacion not null,
  email           text,
  nombre          text,                                     -- a quién se invita, para reconocerlo
  apellido        text,
  titular         boolean not null default false,           -- invitación de administrador que será el titular
  idioma          idioma not null default 'es',             -- idioma del correo
  estado          estado_invitacion not null default 'PENDIENTE',
  expira_en       timestamptz,
  organizacion_id bigint not null references organizaciones (id) on delete cascade,
  comunidad_id    bigint references comunidades (id) on delete cascade,
  usada_por       bigint references perfiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  constraint invitaciones_colaborador_requiere_comunidad check (role <> 'COLABORADOR' or comunidad_id is not null),
  constraint invitaciones_titular_es_admin check (not titular or role = 'ADMIN')
);

create index on organizacion_licencias (organizacion_id);
create index on organizaciones (tipo_id);
create index on organizacion_administradores (perfil_id);
create index on comunidades (organizacion_id);
create index on comunidad_colaboradores (perfil_id);
create index on invitaciones (organizacion_id);
create index on invitaciones (lower(email));

-- Admin escucha sus invitaciones pendientes en vivo.
alter publication supabase_realtime add table invitaciones;

-- ═════════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═════════════════════════════════════════════════════════════════════════════
-- Al crear un usuario de Auth: su perfil y, si viene de una invitación, su enlace. Lee el rol
-- y el ámbito de raw_app_meta_data, que solo escribe el servidor (canjear-invitacion). Nunca de
-- raw_user_meta_data: quien se registre podría mandar ahí «ADMIN de la organización 1».
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role      rol_invitacion;
  v_titular   boolean;
  v_org       bigint;
  v_comunidad bigint;
  v_perfil    bigint;
begin
  v_role      := nullif(new.raw_app_meta_data->>'role', '')::rol_invitacion;
  v_titular   := coalesce((new.raw_app_meta_data->>'titular')::boolean, false);
  v_org       := nullif(new.raw_app_meta_data->>'organizacion_id', '')::bigint;
  v_comunidad := nullif(new.raw_app_meta_data->>'comunidad_id', '')::bigint;

  insert into perfiles (usuario_id, email, nombre, apellido, idioma)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'nombre',
    new.raw_user_meta_data->>'apellido',
    case when new.raw_user_meta_data->>'idioma' = 'en' then 'en'::idioma else 'es'::idioma end
  )
  returning id into v_perfil;

  if v_role = 'ADMIN' and v_org is not null then
    -- Una invitación de titular lo pasa a quien la canjea: el anterior sigue como administrador.
    if v_titular then
      update organizacion_administradores set titular = false where organizacion_id = v_org and titular;
    end if;
    insert into organizacion_administradores (organizacion_id, perfil_id, titular)
      values (v_org, v_perfil, v_titular)
      on conflict (organizacion_id, perfil_id) do nothing;
  elsif v_role = 'COLABORADOR' and v_comunidad is not null then
    insert into comunidad_colaboradores (comunidad_id, perfil_id, activo)
      values (v_comunidad, v_perfil, true)
      on conflict (comunidad_id, perfil_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Cupo de comunidades: no se crea una comunidad sin licencia vigente ni por encima del cupo.
-- Vale también fuera de la UI (SQL, service role).
create function comunidades_valida_cupo()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_max    int;
  v_usadas int;
begin
  select l.max_comunidades into v_max
    from organizacion_licencias l
   where l.organizacion_id = new.organizacion_id
     and l.estado in ('ACTIVA', 'TRIAL')
     and l.fecha_inicio <= current_date
     and (l.fecha_fin is null or l.fecha_fin >= current_date)
   order by l.created_at desc
   limit 1;

  if v_max is null then
    raise exception 'La organización no tiene una licencia vigente';
  end if;

  select count(*) into v_usadas from comunidades where organizacion_id = new.organizacion_id;
  if v_usadas >= v_max then
    raise exception 'La licencia permite % comunidad(es) y el cupo ya está en uso', v_max;
  end if;

  return new;
end;
$$;

create trigger comunidades_cupo
  before insert on comunidades
  for each row execute function comunidades_valida_cupo();

-- La comunidad está en un país de su licencia (si la licencia limita países).
create function comunidades_valida_pais()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_paises text[];
begin
  select l.paises into v_paises
    from organizacion_licencias l
   where l.organizacion_id = new.organizacion_id and l.estado in ('ACTIVA', 'TRIAL')
   order by l.created_at desc
   limit 1;

  if cardinality(coalesce(v_paises, '{}')) > 0 and not new.pais = any (v_paises) then
    raise exception 'La licencia de la organización no incluye el país %', new.pais;
  end if;
  return new;
end;
$$;

create trigger comunidades_pais
  before insert or update of pais, organizacion_id on comunidades
  for each row execute function comunidades_valida_pais();

-- La comunidad de una invitación pertenece a su organización.
create function invitaciones_valida_ambito()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.comunidad_id is not null
     and (select organizacion_id from comunidades where id = new.comunidad_id) is distinct from new.organizacion_id then
    raise exception 'La comunidad % no pertenece a la organización % de la invitación',
      new.comunidad_id, new.organizacion_id;
  end if;
  return new;
end;
$$;

create trigger invitaciones_ambito
  before insert or update on invitaciones
  for each row execute function invitaciones_valida_ambito();
