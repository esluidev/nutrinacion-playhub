-- Nutrinación StoryPlay — esquema (archivo único)
-- ─────────────────────────────────────────────────────────────────────────────
-- Reemplaza por completo lo que haya en la base: primero DROPEA todo lo anterior y luego
-- lo reconstruye. Pensado para correrse de una sola vez en el SQL Editor.
--
-- NO siembra datos de negocio: ni perfiles, ni organizaciones, ni comunidades, ni
-- invitaciones. Todo eso se registra desde las apps. Lo único que se siembra son los
-- CATÁLOGOS y las PLANTILLAS DE CORREO — sin ellos la app no arranca (los desplegables
-- quedan vacíos, las FK de país no resuelven y el correo de invitación no encuentra su
-- plantilla ni la URL base).
--
-- `auth.users` NO se toca: tu login sobrevive. Pero `perfiles` queda vacío, así que hay que
-- volver a crear el perfil del superadmin a mano (ver nota al final del archivo).
--
-- Modelo en tres planos:
--   organizacion  → contrato + licencia + administradores (organizacion_administradores)
--     └── comunidad → tenancy operativo: colaboradores, educadores, talleres
--
-- Reglas: tenancy = COMUNIDAD (nunca "workspace"). Tablas/columnas y KEYS en ESPAÑOL
-- (excepción: `KIDS`). Los LABELS de cara al usuario son jsonb Localized ({ es, en }).
-- `id` bigint identity = PK y PRIMERA columna en toda tabla. IDs = identity; auth.users = uuid.

-- ═════════════════════════════════════════════════════════════════════════════
-- RESET — borrar todo lo anterior
-- ═════════════════════════════════════════════════════════════════════════════
drop trigger if exists on_auth_user_created on auth.users;
drop view if exists miembros_comunidad;

drop table if exists
  taller_asignaciones_participantes, participantes, grupos_participantes,
  feedback_taller, feedback_storyboard, taller_asignaciones_educadores, talleres,
  storyboard_escenas, storyboards,
  grupos_educadores, grupos, educadores,
  invitaciones, colaboradores, comunidades,
  organizacion_administradores, licencias, organizaciones,
  perfiles, plantillas_correo, configuracion, paises,
  categorias_storyboard, tipos_storyboard, tipos_organizacion, edades_audiencia
  cascade;

drop function if exists handle_new_user() cascade;
drop function if exists feedback_completa_asignacion() cascade;
-- helpers del RLS viejo (por si siguen vivos)
drop function if exists rls_perfil_id() cascade;
drop function if exists rls_es_superadmin() cascade;
drop function if exists rls_mis_organizaciones() cascade;
drop function if exists rls_mis_comunidades() cascade;
drop function if exists rls_orgs_visibles() cascade;
drop function if exists rls_educador_id() cascade;
drop function if exists rls_educador_comunidad() cascade;
drop function if exists rls_taller_en_mis_comunidades(bigint) cascade;
drop function if exists rls_taller_asignado_a_mi(bigint) cascade;
drop function if exists rls_asignacion_mia(bigint) cascade;
drop function if exists rls_asignacion_en_mis_comunidades(bigint) cascade;

drop type if exists
  estado_licencia, role, estado_storyboard, estado_taller, estado_asignacion,
  estado_invitacion, modalidad_taller, nivel_participacion, estado_feedback_contenido
  cascade;

-- ═════════════════════════════════════════════════════════════════════════════
-- TIPOS
-- ═════════════════════════════════════════════════════════════════════════════
create type estado_licencia     as enum ('ACTIVA', 'VENCIDA', 'SUSPENDIDA', 'TRIAL');
-- `role` NO es una propiedad de la persona: se usa en `invitaciones.role` para decirle al
-- trigger QUÉ enlazar (ADMIN → organizacion_administradores / COLABORADOR → colaboradores)
-- y como etiqueta en la vista miembros_comunidad. Quién administra qué vive en las tablas
-- de pertenencia. PARTICIPANTE se conserva para uso futuro.
create type role                as enum ('SUPERADMIN', 'ADMIN', 'COLABORADOR', 'EDUCADOR', 'PARTICIPANTE');
create type estado_storyboard   as enum ('BORRADOR', 'EN_REVISION', 'PUBLICADO', 'ARCHIVADO');
create type estado_taller       as enum ('BORRADOR', 'PROGRAMADO', 'CANCELADO');   -- "completado" se deriva de las asignaciones
create type estado_asignacion   as enum ('PENDIENTE', 'EN_CURSO', 'COMPLETADO', 'CANCELADO');
create type estado_invitacion   as enum ('PENDIENTE', 'USADA', 'EXPIRADA', 'REVOCADA', 'RECHAZADA');
create type modalidad_taller    as enum ('PRESENCIAL', 'ASIGNADO');
create type nivel_participacion as enum ('BAJO', 'MEDIO', 'ALTO');
create type estado_feedback_contenido as enum ('PENDIENTE', 'REVISADO', 'APLICADO', 'DESCARTADO');

-- ═════════════════════════════════════════════════════════════════════════════
-- CATÁLOGOS Y CONFIGURACIÓN
-- ═════════════════════════════════════════════════════════════════════════════
-- Ajustes GENERALES de la plataforma (no por organización). `valor` es text plano.
create table configuracion (
  id          bigint generated always as identity primary key,
  clave       text not null unique,
  valor       text,
  descripcion text,
  updated_at  timestamptz not null default now()
);

-- Las dos claves que la plataforma espera; el VALOR lo pones tú (Studio / Admin URL).
insert into configuracion (clave, descripcion) values
  ('studio_url', 'URL base de los juegos; Educators la carga y le agrega el slug del juego + parámetros'),
  ('admin_url',  'URL base de la app de administración; la usa el correo de invitación para armar el link');

create table paises (
  id        bigint generated always as identity primary key,
  codigo    text not null unique,        -- ISO alpha-2; el país se referencia POR CÓDIGO
  nombre    jsonb not null,              -- Localized { es, en }
  bandera   text,
  extension text,                        -- código telefónico
  region    text,                        -- agrupación simple (ej. "Centroamérica")
  activo    boolean not null default true
);

insert into paises (codigo, nombre, bandera, extension, region) values
  ('GT', '{"es":"Guatemala","en":"Guatemala"}',          '🇬🇹', '+502', 'Centroamérica'),
  ('BZ', '{"es":"Belice","en":"Belize"}',                '🇧🇿', '+501', 'Centroamérica'),
  ('SV', '{"es":"El Salvador","en":"El Salvador"}',      '🇸🇻', '+503', 'Centroamérica'),
  ('HN', '{"es":"Honduras","en":"Honduras"}',            '🇭🇳', '+504', 'Centroamérica'),
  ('NI', '{"es":"Nicaragua","en":"Nicaragua"}',          '🇳🇮', '+505', 'Centroamérica'),
  ('CR', '{"es":"Costa Rica","en":"Costa Rica"}',        '🇨🇷', '+506', 'Centroamérica'),
  ('PA', '{"es":"Panamá","en":"Panama"}',                '🇵🇦', '+507', 'Centroamérica'),
  ('MX', '{"es":"México","en":"Mexico"}',                '🇲🇽', '+52',  'Norteamérica'),
  ('US', '{"es":"Estados Unidos","en":"United States"}', '🇺🇸', '+1',   'Norteamérica');

-- Catálogos de tipos: `codigo` es la clave estable; `nombre`/`descripcion` son Localized.
create table tipos_organizacion (
  id          bigint generated always as identity primary key,
  codigo      text not null unique,
  nombre      jsonb not null,
  descripcion jsonb,
  orden       int not null default 0,
  activo      boolean not null default true
);

create table tipos_storyboard (
  id          bigint generated always as identity primary key,
  codigo      text not null unique,
  nombre      jsonb not null,
  descripcion jsonb,
  orden       int not null default 0,
  activo      boolean not null default true
);

-- Subcategorías bajo cada tipo. `codigo` es único POR TIPO, no global.
create table categorias_storyboard (
  id          bigint generated always as identity primary key,
  codigo      text not null,
  nombre      jsonb not null,
  descripcion jsonb,
  orden       int not null default 0,
  activo      boolean not null default true,
  tipo_id     bigint not null references tipos_storyboard (id) on delete cascade,
  unique (tipo_id, codigo)
);

create table edades_audiencia (
  id       bigint generated always as identity primary key,
  codigo   text not null unique,
  nombre   jsonb not null,
  edad_min int,
  edad_max int,
  orden    int not null default 0,
  activo   boolean not null default true
);

insert into tipos_organizacion (codigo, nombre, orden) values
  ('CENTRO_EDUCATIVO', '{"es":"Centro educativo","en":"Educational Center"}', 1),
  ('EMPRESA',          '{"es":"Empresa","en":"Company"}', 2),
  ('ONG',              '{"es":"ONG","en":"NGO"}', 3),
  ('FUNDACION',        '{"es":"Fundación","en":"Foundation"}', 4),
  ('GUBERNAMENTAL',    '{"es":"Gubernamental","en":"Government"}', 5),
  ('OTRO',             '{"es":"Otro","en":"Other"}', 6);

-- Los 4 TIPOS de storyboard sobre los que trabaja la plataforma.
insert into tipos_storyboard (codigo, nombre, orden) values
  ('ALIMENTACION',     '{"es":"Alimentación","en":"Food"}', 1),
  ('ACTIVIDAD_FISICA', '{"es":"Actividad física","en":"Physical Activity"}', 2),
  ('CUIDADO_PERSONAL', '{"es":"Cuidado personal","en":"Personal Care"}', 3),
  ('SALUD_EMOCIONAL',  '{"es":"Salud emocional","en":"Emotional Health"}', 4);

insert into edades_audiencia (codigo, nombre, edad_min, edad_max, orden) values
  ('KIDS',            '{"es":"Niños","en":"Kids"}', 4, 8, 1),
  ('PREADOLESCENTES', '{"es":"Preadolescentes","en":"Preteens"}', 9, 12, 2),
  ('ADOLESCENTES',    '{"es":"Adolescentes","en":"Teens"}', 13, 17, 3),
  ('ADULTOS',         '{"es":"Adultos","en":"Adults"}', 18, null, 4);

-- Categorías por tipo. En INSERT..SELECT los literales json requieren cast explícito a ::jsonb.
insert into categorias_storyboard (tipo_id, codigo, nombre, orden)
  select id, 'PREVENCION', '{"es":"Prevención","en":"Prevention"}'::jsonb, 1 from tipos_storyboard where codigo = 'ALIMENTACION'
  union all
  select id, 'PREVENCION', '{"es":"Prevención","en":"Prevention"}'::jsonb, 1 from tipos_storyboard where codigo = 'ACTIVIDAD_FISICA'
  union all
  select id, 'DIABETES', '{"es":"Diabetes","en":"Diabetes"}'::jsonb, 1 from tipos_storyboard where codigo = 'CUIDADO_PERSONAL'
  union all
  select id, 'BIENESTAR', '{"es":"Bienestar","en":"Well-being"}'::jsonb, 1 from tipos_storyboard where codigo = 'SALUD_EMOCIONAL';

-- ═════════════════════════════════════════════════════════════════════════════
-- CAPA COMERCIAL — organización, licencia, administradores
-- ═════════════════════════════════════════════════════════════════════════════
create table organizaciones (
  id         bigint generated always as identity primary key,
  nombre     text not null,
  correo     text,
  telefono   text,
  website    text,
  tipo_id    bigint references tipos_organizacion (id),
  created_at timestamptz not null default now()
);

-- Capacidad + alcance del contrato, con números CONCRETOS (nadie es "ilimitado").
-- Contenido: la org accede al catálogo ESTÁNDAR completo (storyboards sin dueño) + sus
-- propios personalizados (hasta max_personalizados). No hay tiers gratis/premium.
create table licencias (
  id                 bigint generated always as identity primary key,
  max_comunidades    int not null,
  max_educadores     int not null,
  max_personalizados int not null default 0,
  fecha_inicio       date not null,
  fecha_fin          date,                                  -- null = sin vencimiento
  estado             estado_licencia not null default 'ACTIVA',   -- trial = TRIAL + fecha_fin corta
  notas              text,
  paises             text[] not null default '{}',          -- ISO; vacío = sin restricción
  organizacion_id    bigint not null references organizaciones (id) on delete cascade,
  created_at         timestamptz not null default now()
);

-- ═════════════════════════════════════════════════════════════════════════════
-- IDENTIDAD Y TENANCY
-- ═════════════════════════════════════════════════════════════════════════════
-- Usuario administrativo ligado a Supabase Auth. `superadmin` es lo ÚNICO que define el
-- tipo de usuario a nivel global (abre /platform). Ser admin de una org o colaborador de
-- una comunidad NO es propiedad de la persona: vive en las tablas de pertenencia, y por eso
-- una misma persona puede ser admin de una org y colaborador en la comunidad de otra.
create table perfiles (
  id         bigint generated always as identity primary key,
  nombre     text,
  apellido   text,
  email      text,
  avatar     text,
  idioma     text not null default 'es',       -- ISO 639-1 ('es'/'en')
  superadmin boolean not null default false,   -- true = operador Nutrinación
  usuario_id uuid not null unique,             -- FK lógica a auth.users
  created_at timestamptz not null default now()
);

-- Quién administra una organización (N:M perfil ↔ org). Una org puede tener VARIOS admins,
-- todos con los mismos permisos. `titular` = el firmante del contrato (billing/legal): se
-- designa A MANO desde el UI, nunca automáticamente.
create table organizacion_administradores (
  id              bigint generated always as identity primary key,
  organizacion_id bigint not null references organizaciones (id) on delete cascade,
  perfil_id       bigint not null references perfiles (id) on delete cascade,
  titular         boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (organizacion_id, perfil_id)
);

create table comunidades (
  id              bigint generated always as identity primary key,
  nombre          text not null,
  descripcion     text,
  correo          text,
  telefono        text,
  logo            text,
  organizacion_id bigint not null references organizaciones (id) on delete restrict,
  pais            text references paises (codigo),   -- su región se deriva (paises.region)
  created_at      timestamptz not null default now()
);

-- Perfiles que ayudan a gestionar UNA comunidad. Un perfil puede colaborar en varias
-- comunidades, incluso de organizaciones distintas (de ahí sale el multi-org, gratis).
-- Los admins de la org NO necesitan fila aquí: ya administran todas sus comunidades.
create table colaboradores (
  id           bigint generated always as identity primary key,
  activo       boolean not null default true,
  comunidad_id bigint not null references comunidades (id) on delete cascade,
  perfil_id    bigint not null references perfiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (comunidad_id, perfil_id)
);

-- Registro cerrado, "organización primero": la org y su licencia YA existen; el token solo
-- ENLAZA a una persona. `role` dice QUÉ enlazar: ADMIN → la org / COLABORADOR → la comunidad
-- (por eso comunidad_id solo se llena para COLABORADOR). El superadmin NO se invita: se crea
-- a mano. Los educadores tampoco: entran con correo + código.
create table invitaciones (
  id              bigint generated always as identity primary key,
  token           uuid not null unique default gen_random_uuid(),
  role            role not null,                   -- ADMIN o COLABORADOR
  email           text,
  idioma          text not null default 'es',      -- idioma del correo
  estado          estado_invitacion not null default 'PENDIENTE',
  expira_en       timestamptz,
  organizacion_id bigint not null references organizaciones (id) on delete cascade,
  comunidad_id    bigint references comunidades (id) on delete cascade,   -- requerido si role = COLABORADOR
  usada_por       bigint references perfiles (id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ═════════════════════════════════════════════════════════════════════════════
-- EQUIPO — educadores y grupos (siempre dentro de una comunidad)
-- ═════════════════════════════════════════════════════════════════════════════
-- Los educadores NO son usuarios de Supabase Auth: entran con correo + código (contraseña
-- simple que setea el admin, guardada HASHEADA). Login válido = activo AND deleted_at IS NULL.
create table educadores (
  id                 bigint generated always as identity primary key,
  nombre             text not null,
  apellido           text,
  correo             text,
  telefono           text,
  profesion          text,
  biografia          text,
  avatar             text,
  codigo_acceso_hash text,                          -- nunca se lee; el admin lo setea/reemplaza
  idioma             text not null default 'es',
  activo             boolean not null default true, -- toggle rápido del admin
  deleted_at         timestamptz,                   -- soft delete
  comunidad_id       bigint not null references comunidades (id) on delete cascade,
  pais               text references paises (codigo),
  created_at         timestamptz not null default now()
);

create table grupos (
  id           bigint generated always as identity primary key,
  nombre       text not null,
  descripcion  text,
  activo       boolean not null default true,
  comunidad_id bigint not null references comunidades (id) on delete cascade,
  created_at   timestamptz not null default now()
);

create table grupos_educadores (
  id          bigint generated always as identity primary key,
  grupo_id    bigint not null references grupos (id) on delete cascade,
  educador_id bigint not null references educadores (id) on delete cascade,
  unique (grupo_id, educador_id)
);

-- ═════════════════════════════════════════════════════════════════════════════
-- CONTENIDO — storyboards y escenas
-- ═════════════════════════════════════════════════════════════════════════════
-- Storyboard = build (derivado de storyboard.json, lo sobrescribe el sync) + catálogo
-- (editable en Supabase, el sync nunca lo toca). Detalle de ownership en docs/backend.md.
create table storyboards (
  id              bigint generated always as identity primary key,
  clave           uuid not null unique,                  -- identidad estable (nace en storyboard.json)
  slug            text not null,                         -- build-owned
  numero_escenas  int not null default 0,                -- build-owned
  titulo          jsonb not null default '{}'::jsonb,    -- Localized
  descripcion     jsonb not null default '{}'::jsonb,
  objetivo        jsonb,                                 -- guía; texto enriquecido
  bibliografia    jsonb,
  estado          estado_storyboard not null default 'BORRADOR',   -- catálogo-owned
  duracion_min    int,
  portada         text,
  idiomas         text[] not null default '{}',          -- build-owned
  paises          text[] not null default '{}',          -- disponibilidad; VACÍO = global
  tipo_id         bigint not null references tipos_storyboard (id),
  categoria_id    bigint references categorias_storyboard (id),
  audiencia_id    bigint references edades_audiencia (id),
  organizacion_id bigint references organizaciones (id) on delete set null,  -- dueño si personalizado; null = estándar
  created_at      timestamptz not null default now()
);

-- Guía pedagógica por escena: una sección por campo, 1:1 con el doc del educador. Cada campo
-- es jsonb SOLO por idioma; el valor es TEXTO ENRIQUECIDO con sus preguntas/listas embebidas.
create table storyboard_escenas (
  id            bigint generated always as identity primary key,
  orden         int not null,
  folder        text not null,                         -- carpeta de la escena = el juego (build-owned)
  titulo        jsonb not null default '{}'::jsonb,    -- build-owned
  descripcion   jsonb,
  objetivo      jsonb,
  pedagogia     jsonb,
  psicologia    jsonb,
  cientifico    jsonb,
  consejos      jsonb,
  mecanica      jsonb,
  activa        boolean not null default true,
  storyboard_id bigint not null references storyboards (id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (storyboard_id, orden)
);

-- ═════════════════════════════════════════════════════════════════════════════
-- OPERACIÓN — talleres y feedback (todo cuelga de la COMUNIDAD)
-- ═════════════════════════════════════════════════════════════════════════════
-- El taller es lo que el admin PROGRAMA una vez (fecha/hora/lugar). Quién lo imparte va en
-- taller_asignaciones_educadores (N). "Completado" se deriva de las asignaciones.
create table talleres (
  id            bigint generated always as identity primary key,
  titulo        text,
  descripcion   text,
  fecha         date,
  hora_inicio   time,
  hora_fin      time,
  ubicacion     text,
  estado        estado_taller not null default 'BORRADOR',
  modalidad     modalidad_taller not null default 'PRESENCIAL',
  notas         text,
  comunidad_id  bigint not null references comunidades (id) on delete cascade,
  storyboard_id bigint not null references storyboards (id) on delete restrict,
  created_at    timestamptz not null default now()
);

-- Asignar un educador a impartir un taller. AQUÍ vive el estado por docente. Asignar un GRUPO
-- = una fila por cada educador del grupo (con grupo_id, para reportar).
create table taller_asignaciones_educadores (
  id                   bigint generated always as identity primary key,
  estado               estado_asignacion not null default 'PENDIENTE',
  asistentes_estimados int,
  taller_id            bigint not null references talleres (id) on delete cascade,
  educador_id          bigint not null references educadores (id) on delete cascade,
  grupo_id             bigint references grupos (id) on delete set null,
  created_at           timestamptz not null default now(),
  unique (taller_id, educador_id)
);

-- Encuesta del educador sobre la EJECUCIÓN de un taller: UNA fila por ASIGNACIÓN. Al
-- insertarla, la asignación pasa a COMPLETADO (trigger). Mezcla la encuesta + los datos que
-- emite el runner.
create table feedback_taller (
  id                  bigint generated always as identity primary key,
  calificacion        int,                -- 1..5
  asistentes          int,                -- nº REAL de niños atendidos
  nivel_participacion nivel_participacion,
  comentarios         text,
  escenas_completadas int,                -- desde aquí: datos del runner (no se preguntan)
  escenas_total       int,
  puntos              int,
  duracion_segundos   int,
  asignacion_id       bigint not null unique references taller_asignaciones_educadores (id) on delete cascade,
  created_at          timestamptz not null default now()
);

-- Opinión sobre el CONTENIDO de un storyboard, dirigida a Nutrinación como canal de mejora.
-- No confundir con feedback_taller (ejecución).
create table feedback_storyboard (
  id            bigint generated always as identity primary key,
  texto         text not null,
  calificacion  int,
  estado        estado_feedback_contenido not null default 'PENDIENTE',   -- triage de Nutrinación
  storyboard_id bigint not null references storyboards (id) on delete cascade,
  perfil_id     bigint references perfiles (id) on delete set null,
  comunidad_id  bigint references comunidades (id) on delete set null,
  created_at    timestamptz not null default now()
);

-- ═════════════════════════════════════════════════════════════════════════════
-- CORREO — copy de las plantillas (el layout HTML vive en la Edge Function)
-- ═════════════════════════════════════════════════════════════════════════════
create table plantillas_correo (
  id         bigint generated always as identity primary key,
  clave      text not null unique,       -- la Edge Function la resuelve por el role de la invitación
  nombre     text not null,
  asunto     jsonb not null,             -- Localized { es, en }
  cuerpo     jsonb not null,
  cta_label  jsonb,
  activo     boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Placeholders: `enviar-invitacion` interpola con UNA llave y solo conoce {org}, {com} y {expira}.
-- La clave se arma como <base>[_existente]: si el correo ya tiene cuenta, la invitación no se
-- canjea por link — se acepta dentro de la app.
insert into plantillas_correo (clave, nombre, asunto, cuerpo, cta_label) values
  ('invitacion_admin', 'Invitación de administrador',
   '{"es":"Te invitaron a administrar {org} en Nutrinación","en":"You have been invited to manage {org} on Nutrinación"}',
   '{"es":"Hola:\n\nTe invitaron a administrar {org} en Nutrinación.\n\nAbre el enlace y crea tu cuenta para empezar. La invitación vence el {expira}.","en":"Hello:\n\nYou have been invited to manage {org} on Nutrinación.\n\nOpen the link and create your account to get started. This invitation expires on {expira}."}',
   '{"es":"Crear mi cuenta","en":"Create my account"}'),
  ('invitacion_colaborador', 'Invitación de colaborador',
   '{"es":"Te invitaron a colaborar en {com}","en":"You have been invited to collaborate at {com}"}',
   '{"es":"Hola:\n\nTe invitaron a colaborar en {com}, de {org}.\n\nAbre el enlace y crea tu cuenta para empezar. La invitación vence el {expira}.","en":"Hello:\n\nYou have been invited to collaborate at {com}, part of {org}.\n\nOpen the link and create your account to get started. This invitation expires on {expira}."}',
   '{"es":"Crear mi cuenta","en":"Create my account"}'),
  ('invitacion_admin_existente', 'Invitación de administrador (cuenta existente)',
   '{"es":"Te invitaron a administrar {org} en Nutrinación","en":"You have been invited to manage {org} on Nutrinación"}',
   '{"es":"Hola:\n\nTe invitaron a administrar {org} en Nutrinación.\n\nComo ya tienes una cuenta, solo entra y acéptala desde tus invitaciones pendientes. Vence el {expira}.","en":"Hello:\n\nYou have been invited to manage {org} on Nutrinación.\n\nSince you already have an account, just sign in and accept it from your pending invitations. It expires on {expira}."}',
   '{"es":"Ver mis invitaciones","en":"View my invitations"}'),
  ('invitacion_colaborador_existente', 'Invitación de colaborador (cuenta existente)',
   '{"es":"Te invitaron a colaborar en {com}","en":"You have been invited to collaborate at {com}"}',
   '{"es":"Hola:\n\nTe invitaron a colaborar en {com}, de {org}.\n\nComo ya tienes una cuenta, solo entra y acéptala desde tus invitaciones pendientes. Vence el {expira}.","en":"Hello:\n\nYou have been invited to collaborate at {com}, part of {org}.\n\nSince you already have an account, just sign in and accept it from your pending invitations. It expires on {expira}."}',
   '{"es":"Ver mis invitaciones","en":"View my invitations"}');

-- ═════════════════════════════════════════════════════════════════════════════
-- ÍNDICES DE APOYO
-- ═════════════════════════════════════════════════════════════════════════════
create index on comunidades (organizacion_id);
create index on licencias (organizacion_id);
create index on organizacion_administradores (perfil_id);
create index on colaboradores (perfil_id);
create index on educadores (comunidad_id);
create index on grupos (comunidad_id);
create index on organizaciones (tipo_id);
create index on categorias_storyboard (tipo_id);
create index on invitaciones (organizacion_id);
create index on storyboards (organizacion_id);
create index on storyboards (tipo_id);
create index on storyboards using gin (paises);
create index on storyboard_escenas (storyboard_id);
create index on talleres (comunidad_id);
create index on talleres (storyboard_id);
create index on taller_asignaciones_educadores (educador_id);
create index on feedback_storyboard (storyboard_id);

-- ═════════════════════════════════════════════════════════════════════════════
-- RLS — simple a propósito
-- ═════════════════════════════════════════════════════════════════════════════
-- Una sola regla por tabla: el usuario AUTENTICADO tiene acceso. `anon` (sin sesión) queda
-- fuera. `service_role` (Edge Functions / sync de Studio) bypasea RLS siempre.
--
-- NO hay aislamiento entre organizaciones a nivel de BD: cualquier usuario logueado puede
-- leer/escribir todo. El gate de /platform vive en el middleware de la app. Se irá afinando
-- tabla por tabla según haga falta.
do $$
declare t text;
begin
  foreach t in array array[
    'configuracion','paises','tipos_organizacion','tipos_storyboard','categorias_storyboard',
    'edades_audiencia','plantillas_correo',
    'organizaciones','organizacion_administradores','licencias',
    'perfiles','comunidades','colaboradores','invitaciones',
    'educadores','grupos','grupos_educadores',
    'storyboards','storyboard_escenas',
    'talleres','taller_asignaciones_educadores','feedback_taller','feedback_storyboard'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I on %I for all to authenticated using (true) with check (true)',
      t || '_authenticated', t);
  end loop;
end $$;

-- ═════════════════════════════════════════════════════════════════════════════
-- FUNCIONES Y TRIGGERS
-- ═════════════════════════════════════════════════════════════════════════════
-- Al crear un usuario en auth.users, registrar su perfil y enlazarlo según lo que diga la
-- invitación (metadata que pone la Edge Function canjear-invitacion). Corre en la MISMA
-- transacción del insert → atómico. Un usuario creado sin metadata (ej. desde el Dashboard)
-- recibe un perfil sin enlaces, como red de seguridad.
--   · superadmin NO se otorga aquí: queda false y se da a mano.
--   · titular NO se asigna aquí: queda false y se designa desde el UI.
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role      role;
  v_org       bigint;
  v_comunidad bigint;
  v_perfil_id bigint;
begin
  v_role      := coalesce((new.raw_user_meta_data->>'role')::role, 'COLABORADOR');
  v_org       := nullif(new.raw_user_meta_data->>'organizacion_id', '')::bigint;
  v_comunidad := nullif(new.raw_user_meta_data->>'comunidad_id', '')::bigint;

  insert into perfiles (usuario_id, email, nombre, apellido, idioma)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'nombre',
    new.raw_user_meta_data->>'apellido',
    coalesce(new.raw_user_meta_data->>'idioma', 'es')
  )
  returning id into v_perfil_id;

  if v_role = 'ADMIN' and v_org is not null then
    insert into organizacion_administradores (organizacion_id, perfil_id)
      values (v_org, v_perfil_id)
      on conflict (organizacion_id, perfil_id) do nothing;
  elsif v_role = 'COLABORADOR' and v_comunidad is not null then
    insert into colaboradores (comunidad_id, perfil_id, activo)
      values (v_comunidad, v_perfil_id, true)
      on conflict (comunidad_id, perfil_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Al insertar un feedback de taller, la asignación del educador queda COMPLETADO.
-- Solo en INSERT: editar el feedback desde el historial NO re-dispara.
create function feedback_completa_asignacion()
returns trigger
language plpgsql
as $$
begin
  update taller_asignaciones_educadores
     set estado = 'COMPLETADO'
   where id = new.asignacion_id;
  return new;
end;
$$;

create trigger trg_feedback_completa_asignacion
after insert on feedback_taller
for each row execute function feedback_completa_asignacion();

-- ═════════════════════════════════════════════════════════════════════════════
-- VISTA — todos los miembros de una comunidad con su rol
-- ═════════════════════════════════════════════════════════════════════════════
-- Une las tres fuentes según su forma de acceso, etiquetando cada fila con el enum `role`.
-- Solo lectura; security_invoker = el RLS de las tablas base sigue aplicando.
create view miembros_comunidad with (security_invoker = on) as
  -- Administradores de la organización: cada uno, en cada comunidad de su org
  select c.id as comunidad_id,
         'ADMIN'::role as role,
         'perfil'::text as origen,
         p.id as ref_id,
         trim(coalesce(p.nombre, '') || ' ' || coalesce(p.apellido, '')) as nombre,
         p.email as contacto
    from comunidades c
    join organizacion_administradores oa on oa.organizacion_id = c.organizacion_id
    join perfiles p on p.id = oa.perfil_id
  union all
  select cc.comunidad_id, 'COLABORADOR'::role, 'perfil', p.id,
         trim(coalesce(p.nombre, '') || ' ' || coalesce(p.apellido, '')), p.email
    from colaboradores cc
    join perfiles p on p.id = cc.perfil_id
   where cc.activo
  union all
  select e.comunidad_id, 'EDUCADOR'::role, 'educador', e.id,
         trim(coalesce(e.nombre, '') || ' ' || coalesce(e.apellido, '')), e.correo
    from educadores e
   where e.activo and e.deleted_at is null;

-- ═════════════════════════════════════════════════════════════════════════════
-- DESPUÉS DE CORRER ESTO
-- ═════════════════════════════════════════════════════════════════════════════
-- `perfiles` quedó vacío y tu usuario de auth.users sigue existiendo, pero sin perfil no
-- puedes entrar. Recupera tu acceso con (ajusta el correo):
--
--   insert into perfiles (usuario_id, email, nombre, apellido, superadmin)
--   select id, email, 'Luis', '', true from auth.users where email = 'luisrc.07@gmail.com';
--
-- Y setea las URLs que usa la plataforma:
--
--   update configuracion set valor = 'http://localhost:3000' where clave = 'admin_url';
