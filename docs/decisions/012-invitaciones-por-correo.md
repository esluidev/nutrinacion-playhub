# Invitaciones por correo, sin dejar de copiar el enlace

Fecha: 2026-11-01
Estado: aceptada
Sustituye a: en las invitaciones, «Admin no envía correos» de la [decisión 009](009-acceso-admin-sin-correo.md). La recuperación de la contraseña sigue como la decidió la 009.

## Contexto

Con la decisión 009, una invitación solo llegaba si quien la creaba copiaba el enlace y lo compartía por otro canal. Antes de empezar su QA desde cero, Luis pide que el correo salga solo al crear la invitación, con Resend, y que se pueda seguir copiando el enlace.

## Decisión

Aceptada por Luis el 2026-11-01:

- **Al crear una invitación, Admin la envía por correo** con la Edge Function `enviar-invitacion` (Resend). Vale para las invitaciones de administrador y de colaborador, desde Platform o desde la organización.
- **El enlace se sigue pudiendo copiar** al crearla y desde la lista de pendientes, con «Reenviar correo» y «Revocar».
- **Quién puede enviarla** lo decide la RLS: los mismos que pueden crearla o revocarla. Quien solo la recibe, no.
- **La invitación guarda el estado del correo:** cuándo salió el último envío (`correo_enviado_en`) o por qué falló (`correo_error`, migración `0011`). Admin lo muestra junto a la invitación.
- Secretos: `RESEND_API_KEY` y, opcional, `RESEND_FROM` (por defecto `hello@nutrinacion.com`, con el dominio verificado en Resend). En local, en `supabase/.env`; en la nube, `supabase secrets set`.
- **Recuperar la contraseña sigue igual:** un enlace que genera el titular o soporte, sin correo ([decisión 009](009-acceso-admin-sin-correo.md)).

## Consecuencias

- Una invitación llega sin pasos extra si Resend está configurado. Si no lo está o falla, Admin lo dice con el motivo y el enlace sigue ahí para copiarlo.
- Para producción hay que verificar `nutrinacion.com` en Resend y guardar la key en los secretos del proyecto.
- El envío lo pide Admin justo después de crear la invitación, no un webhook de la base: así quien la crea ve al momento si salió. Una invitación creada por SQL no se envía sola.
- Entre dos envíos de la misma invitación hay un minuto de espera, para que un doble clic no mande dos correos.
