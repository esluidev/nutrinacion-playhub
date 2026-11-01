-- PlayHub · base de datos del proyecto nuevo (decisiones 005 y 011, tareas 006 y 011)
-- ─────────────────────────────────────────────────────────────────────────────
-- 0001: tipos, configuración y catálogos con sus datos de referencia. Sin ellos la app no
-- arranca (desplegables vacíos, FK de país sin resolver, correos sin plantilla).
--
-- Convenciones (tarea 006, acordadas con Luis):
--   · nombres con contexto: la tabla principal en plural; sus hijas llevan delante el nombre de
--     la principal en singular (workshop_feedback, guia_escenas); las columnas también dicen qué
--     son (grupo_asistente, idioma_contenido);
--   · español, salvo «workshop», como en las rutas de las apps;
--   · los textos visibles, en jsonb { es, en }; `id` bigint identity; los usuarios de Auth, uuid.
-- La taxonomía de los storyboards (categoría, subcategoría, edición, enfoques de salud) viene del
-- JSON del storyboard y se guarda como columnas en `storyboards`, con enums: las listas cerradas de
-- `catalogo.md` (skill playhub-guides-design). No hay tablas de catálogo. Los estados y demás
-- valores fijos también son enums; `npm run db:types` los exporta a las apps (Constants).
-- Añadir un valor: `alter type … add value` en una migración nueva.

-- ═════════════════════════════════════════════════════════════════════════════
-- TIPOS
-- ═════════════════════════════════════════════════════════════════════════════
create type estado_licencia as enum ('ACTIVA', 'VENCIDA', 'SUSPENDIDA', 'TRIAL');
-- Qué enlaza una invitación al canjearse: ADMIN → administra la organización; COLABORADOR → la
-- opera. Ser admin o colaborador es una relación (tablas de pertenencia), no una propiedad del perfil.
create type rol_invitacion as enum ('ADMIN', 'COLABORADOR');
create type estado_invitacion as enum ('PENDIENTE', 'USADA', 'EXPIRADA', 'REVOCADA', 'RECHAZADA');

-- Un storyboard como un artículo: registrado desde Player, en revisión del equipo, publicado (lo
-- ven las organizaciones) o archivado (no se programa más).
create type estado_publicacion as enum ('REGISTRADO', 'EN_REVISION', 'PUBLICADO', 'ARCHIVADO');

-- El workshop programado. FINALIZADO: pasó su fecha o todos sus educadores dejaron el feedback;
-- se reprograma volviendo a PUBLICADO. ARCHIVADO: descartado. Lo que pasó en la sesión (hoy, en
-- curso, realizado, sin realizar) se deduce de la fecha y de la ejecución de cada educador.
create type estado_workshop as enum ('BORRADOR', 'EN_REVISION', 'PUBLICADO', 'FINALIZADO', 'CANCELADO', 'ARCHIVADO');
-- La constitución: presencial, remoto o híbrido.
create type modalidad_workshop as enum ('PRESENCIAL', 'REMOTO', 'HIBRIDO');
-- La ejecución de cada educador asignado.
create type estado_asignacion as enum ('PENDIENTE', 'EN_CURSO', 'COMPLETADO', 'CANCELADO');
-- Feedback del workshop: observación del grupo, nunca de una persona.
create type participacion_grupo as enum ('BAJA', 'MEDIA', 'ALTA');
create type claridad_contenido as enum ('POCO_CLARA', 'CLARA', 'MUY_CLARA');

-- Taxonomía del storyboard (catalogo.md). Qué subcategorías y enfoques valen en cada categoría lo
-- dicen subcategoria_de_categoria y enfoques_de_categoria (0003).
create type categoria_storyboard as enum ('ALIMENTACION', 'ACTIVIDAD_FISICA', 'CUIDADO_PERSONAL', 'SALUD_EMOCIONAL');
create type subcategoria_storyboard as enum (
  'NUTRIENTES', 'HIDRATACION', 'CRECIMIENTO', 'ENERGIA', 'DIGESTION', 'PREVENCION', 'PROCESADOS', 'TEMPORADA',
  'FUERZA', 'COORDINACION', 'HIGIENE', 'RUTINAS', 'PIEL', 'DESCANSO', 'ACEPTACION', 'CREENCIAS', 'MEDICINA', 'HABITOS');
-- Infantil 4–8, preadolescencia 9–12, adolescencia 13–17 (no hay edición adulta).
create type edicion_storyboard as enum ('KIDS', 'PREADOLESCENTES', 'ADOLESCENTES');
-- Las etiquetas de la guía: los enfoques de salud de las jornadas y las búsquedas.
create type enfoque_salud as enum (
  'DIABETES', 'OBESIDAD', 'DESNUTRICION', 'ANEMIA', 'CELIAQUIA', 'ALERGIAS', 'HIPERTENSION', 'CARIES',
  'SEDENTARISMO', 'ASMA', 'PIE_DIABETICO', 'INFECCIONES', 'AUTOESTIMA');

-- Los idiomas de las apps y del contenido.
create type idioma as enum ('es', 'en');

-- ═════════════════════════════════════════════════════════════════════════════
-- CONFIGURACIÓN
-- ═════════════════════════════════════════════════════════════════════════════
-- Ajustes generales de la plataforma. `valor` es texto plano; lo pone cada entorno.
create table configuracion (
  id          bigint generated always as identity primary key,
  clave       text not null unique,
  valor       text,
  descripcion text,
  updated_at  timestamptz not null default now()
);

insert into configuracion (clave, descripcion) values
  ('admin_url',  'URL de Admin; la usa el correo de invitación para armar el enlace'),
  ('player_url', 'URL de Player; Admin la usa para «Probar» el runner');

create table paises (
  id        bigint generated always as identity primary key,
  codigo    text not null unique,        -- ISO alfa-2; el país se referencia por código
  nombre    jsonb not null,
  bandera   text,
  extension text,                        -- prefijo telefónico
  region    text,
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

create table tipos_organizacion (
  id          bigint generated always as identity primary key,
  codigo      text not null unique,
  nombre      jsonb not null,
  descripcion jsonb,
  orden       int not null default 0,
  activo      boolean not null default true
);

insert into tipos_organizacion (codigo, nombre, orden) values
  ('CENTRO_EDUCATIVO', '{"es":"Centro educativo","en":"Educational center"}', 1),
  ('EMPRESA',          '{"es":"Empresa","en":"Company"}', 2),
  ('ONG',              '{"es":"ONG","en":"NGO"}', 3),
  ('FUNDACION',        '{"es":"Fundación","en":"Foundation"}', 4),
  ('GUBERNAMENTAL',    '{"es":"Gubernamental","en":"Government"}', 5),
  ('OTRO',             '{"es":"Otro","en":"Other"}', 6);

-- ═════════════════════════════════════════════════════════════════════════════
-- CORREO — el texto de las plantillas (el HTML vive en la Edge Function)
-- ═════════════════════════════════════════════════════════════════════════════
create table plantillas_correo (
  id         bigint generated always as identity primary key,
  clave      text not null unique,       -- enviar-invitacion la resuelve por el rol de la invitación
  nombre     text not null,
  asunto     jsonb not null,
  cuerpo     jsonb not null,
  cta_label  jsonb,
  activo     boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Marcadores: enviar-invitacion solo conoce {org} y {expira}. La clave es <base>[_existente]: si
-- el correo ya tiene cuenta, la invitación se acepta dentro de Admin. (Admin no envía correos,
-- decisión 009: las plantillas quedan para cuando vuelva a hacerlo.)
insert into plantillas_correo (clave, nombre, asunto, cuerpo, cta_label) values
  ('invitacion_admin', 'Invitación de administrador',
   '{"es":"Te invitaron a administrar {org} en Nutrinación","en":"You have been invited to manage {org} on Nutrinación"}',
   '{"es":"Hola:\n\nTe invitaron a administrar {org} en Nutrinación.\n\nAbre el enlace y crea tu cuenta para empezar. La invitación vence el {expira}.","en":"Hello:\n\nYou have been invited to manage {org} on Nutrinación.\n\nOpen the link and create your account to get started. This invitation expires on {expira}."}',
   '{"es":"Crear mi cuenta","en":"Create my account"}'),
  ('invitacion_colaborador', 'Invitación de colaborador',
   '{"es":"Te invitaron a colaborar en {org}","en":"You have been invited to collaborate at {org}"}',
   '{"es":"Hola:\n\nTe invitaron a colaborar en {org}, en Nutrinación.\n\nAbre el enlace y crea tu cuenta para empezar. La invitación vence el {expira}.","en":"Hello:\n\nYou have been invited to collaborate at {org} on Nutrinación.\n\nOpen the link and create your account to get started. This invitation expires on {expira}."}',
   '{"es":"Crear mi cuenta","en":"Create my account"}'),
  ('invitacion_admin_existente', 'Invitación de administrador (cuenta existente)',
   '{"es":"Te invitaron a administrar {org} en Nutrinación","en":"You have been invited to manage {org} on Nutrinación"}',
   '{"es":"Hola:\n\nTe invitaron a administrar {org} en Nutrinación.\n\nComo ya tienes una cuenta, solo entra y acéptala desde tus invitaciones pendientes. Vence el {expira}.","en":"Hello:\n\nYou have been invited to manage {org} on Nutrinación.\n\nSince you already have an account, just sign in and accept it from your pending invitations. It expires on {expira}."}',
   '{"es":"Ver mis invitaciones","en":"View my invitations"}'),
  ('invitacion_colaborador_existente', 'Invitación de colaborador (cuenta existente)',
   '{"es":"Te invitaron a colaborar en {org}","en":"You have been invited to collaborate at {org}"}',
   '{"es":"Hola:\n\nTe invitaron a colaborar en {org}, en Nutrinación.\n\nComo ya tienes una cuenta, solo entra y acéptala desde tus invitaciones pendientes. Vence el {expira}.","en":"Hello:\n\nYou have been invited to collaborate at {org} on Nutrinación.\n\nSince you already have an account, just sign in and accept it from your pending invitations. It expires on {expira}."}',
   '{"es":"Ver mis invitaciones","en":"View my invitations"}');
