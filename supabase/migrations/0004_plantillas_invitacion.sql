-- 0004 — Plantillas de invitación: arregla los placeholders y agrega las de "ya tiene cuenta"
-- ─────────────────────────────────────────────────────────────────────────────
-- 1) FIX: las plantillas sembradas en 0001 usaban `{{organizacion}}` y `{{vence}}`, que NO
--    existen. `enviar-invitacion` interpola con UNA llave y solo conoce tres variables:
--      {org}     nombre de la organización
--      {com}     nombre de la comunidad (en invitaciones ADMIN cae al nombre de la org)
--      {expira}  fecha de vencimiento ya formateada según el idioma
--    Con `{{organizacion}}` el correo salía con un "{}" colgando en vez del nombre.
--
-- 2) NUEVAS: dos plantillas para cuando el correo YA TIENE CUENTA. Ese caso no se canjea desde
--    un link: la invitación aparece dentro de la app y se acepta ahí. Cambia el copy y el CTA
--    apunta a la bandeja, no al token.
--
-- Convención de clave: <base>[_existente]. `enviar-invitacion` la arma según si hay cuenta.
-- Re-ejecutable: `on conflict (clave) do update` — sirve para corregir el copy sin migrar.

insert into plantillas_correo (clave, nombre, asunto, cuerpo, cta_label) values

  -- ── Sin cuenta: el link lleva al formulario de registro ─────────────────────
  ('invitacion_admin', 'Invitación de administrador',
   '{"es":"Te invitaron a administrar {org} en Nutrinación",
     "en":"You have been invited to manage {org} on Nutrinación"}',
   '{"es":"Hola:\n\nTe invitaron a administrar {org} en Nutrinación.\n\nAbre el enlace y crea tu cuenta para empezar. La invitación vence el {expira}.",
     "en":"Hello:\n\nYou have been invited to manage {org} on Nutrinación.\n\nOpen the link and create your account to get started. This invitation expires on {expira}."}',
   '{"es":"Crear mi cuenta","en":"Create my account"}'),

  ('invitacion_colaborador', 'Invitación de colaborador',
   '{"es":"Te invitaron a colaborar en {com}",
     "en":"You have been invited to collaborate at {com}"}',
   '{"es":"Hola:\n\nTe invitaron a colaborar en {com}, de {org}.\n\nAbre el enlace y crea tu cuenta para empezar. La invitación vence el {expira}.",
     "en":"Hello:\n\nYou have been invited to collaborate at {com}, part of {org}.\n\nOpen the link and create your account to get started. This invitation expires on {expira}."}',
   '{"es":"Crear mi cuenta","en":"Create my account"}'),

  -- ── Ya tiene cuenta: no hay nada que crear, se acepta dentro de la app ──────
  ('invitacion_admin_existente', 'Invitación de administrador (cuenta existente)',
   '{"es":"Te invitaron a administrar {org} en Nutrinación",
     "en":"You have been invited to manage {org} on Nutrinación"}',
   '{"es":"Hola:\n\nTe invitaron a administrar {org} en Nutrinación.\n\nComo ya tienes una cuenta, solo entra y acéptala desde tus invitaciones pendientes. Vence el {expira}.",
     "en":"Hello:\n\nYou have been invited to manage {org} on Nutrinación.\n\nSince you already have an account, just sign in and accept it from your pending invitations. It expires on {expira}."}',
   '{"es":"Ver mis invitaciones","en":"View my invitations"}'),

  ('invitacion_colaborador_existente', 'Invitación de colaborador (cuenta existente)',
   '{"es":"Te invitaron a colaborar en {com}",
     "en":"You have been invited to collaborate at {com}"}',
   '{"es":"Hola:\n\nTe invitaron a colaborar en {com}, de {org}.\n\nComo ya tienes una cuenta, solo entra y acéptala desde tus invitaciones pendientes. Vence el {expira}.",
     "en":"Hello:\n\nYou have been invited to collaborate at {com}, part of {org}.\n\nSince you already have an account, just sign in and accept it from your pending invitations. It expires on {expira}."}',
   '{"es":"Ver mis invitaciones","en":"View my invitations"}')

on conflict (clave) do update set
  nombre     = excluded.nombre,
  asunto     = excluded.asunto,
  cuerpo     = excluded.cuerpo,
  cta_label  = excluded.cta_label,
  activo     = true,
  updated_at = now();
