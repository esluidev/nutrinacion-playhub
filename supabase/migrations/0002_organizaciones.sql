-- 0002: la organización, su contrato y quién la administra u opera (decisión 011).
--   organizacion → la única unidad de operación: declara en qué países opera, tiene su contrato
--     (organizacion_licencias), sus administradores (uno es el titular), sus colaboradores, sus
--     educadores (0004), sus jornadas y sus workshops (0004).
-- Los usuarios de Admin usan Supabase Auth; los educadores (0006), no.

-- ═════════════════════════════════════════════════════════════════════════════
-- ORGANIZACIÓN Y LICENCIA
-- ═════════════════════════════════════════════════════════════════════════════
-- `paises` son los países donde opera (códigos de `paises`, uno o más): deciden qué storyboards
-- estándar tiene disponibles (0003). El país no baja al taller.
create table organizaciones (
  id         bigint generated always as identity primary key,
  nombre     text not null,
  correo     text,
  telefono   text,
  website    text,
  logo       text,
  paises     text[] not null check (cardinality(paises) >= 1),
  tipo_id    bigint references tipos_organizacion (id),
  created_at timestamptz not null default now()
);

-- El contrato: vigencia, estado y notas. Sin cupos ni países (decisión 011): la organización accede
-- al catálogo estándar de sus países y a sus personalizados, sin tope.
create table organizacion_licencias (
  id              bigint generated always as identity primary key,
  estado          estado_licencia not null default 'ACTIVA',
  fecha_inicio    date not null,
  fecha_fin       date,                                  -- null = sin vencimiento
  notas           text,
  organizacion_id bigint not null references organizaciones (id) on delete cascade,
  created_at      timestamptz not null default now(),
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

-- Quien opera la organización sin administrarla: educadores, grupos, talleres, jornadas y el
-- planificador; no toca la licencia, los administradores ni los colaboradores. `activo = false` le
-- cierra el paso sin perder quién fue. Los admins no necesitan fila: ya operan la suya.
create table organizacion_colaboradores (
  id              bigint generated always as identity primary key,
  activo          boolean not null default true,
  organizacion_id bigint not null references organizaciones (id) on delete cascade,
  perfil_id       bigint not null references perfiles (id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (organizacion_id, perfil_id)
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
  idioma          idioma not null default 'es',             -- idioma de quien la recibe
  estado          estado_invitacion not null default 'PENDIENTE',
  expira_en       timestamptz,
  organizacion_id bigint not null references organizaciones (id) on delete cascade,
  usada_por       bigint references perfiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  constraint invitaciones_titular_es_admin check (not titular or role = 'ADMIN')
);

create index on organizacion_licencias (organizacion_id);
create index on organizaciones (tipo_id);
create index on organizacion_administradores (perfil_id);
create index on organizacion_colaboradores (perfil_id);
create index on invitaciones (organizacion_id);
create index on invitaciones (lower(email));

-- Admin escucha sus invitaciones pendientes en vivo.
alter publication supabase_realtime add table invitaciones;

-- ═════════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═════════════════════════════════════════════════════════════════════════════
-- Los países de la organización salen del catálogo y están activos. Vale también fuera de la UI.
create function organizaciones_valida_paises()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_pais text;
begin
  select p into v_pais from unnest(new.paises) p
   where not exists (select 1 from paises x where x.codigo = p and x.activo) limit 1;
  if v_pais is not null then
    raise exception 'El país % no está en el catálogo de países', v_pais;
  end if;
  return new;
end;
$$;

create trigger organizaciones_paises
  before insert or update of paises on organizaciones
  for each row execute function organizaciones_valida_paises();

-- Al crear un usuario de Auth: su perfil y, si viene de una invitación, su enlace. Lee el rol
-- y la organización de raw_app_meta_data, que solo escribe el servidor (canjear-invitacion). Nunca
-- de raw_user_meta_data: quien se registre podría mandar ahí «ADMIN de la organización 1».
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role    rol_invitacion;
  v_titular boolean;
  v_org     bigint;
  v_perfil  bigint;
begin
  v_role    := nullif(new.raw_app_meta_data->>'role', '')::rol_invitacion;
  v_titular := coalesce((new.raw_app_meta_data->>'titular')::boolean, false);
  v_org     := nullif(new.raw_app_meta_data->>'organizacion_id', '')::bigint;

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
  elsif v_role = 'COLABORADOR' and v_org is not null then
    insert into organizacion_colaboradores (organizacion_id, perfil_id, activo)
      values (v_org, v_perfil, true)
      on conflict (organizacion_id, perfil_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
