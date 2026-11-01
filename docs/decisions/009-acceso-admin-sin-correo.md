# Acceso a Admin sin enviar correos

Fecha: 2026-10-28
Estado: aceptada; sustituida en parte por la [decisión 012](012-invitaciones-por-correo.md): las invitaciones ya se envían por correo. La recuperación de la contraseña sigue como aquí
Sustituye a: el webhook de `enviar-invitacion` previsto en la [decisión 005](005-base-nueva-y-acceso-educador.md) y el «¿La olvidaste?» por correo.

## Contexto

Antes del QA de punta a punta, Luis pregunta si hace falta un proveedor de correo (Resend) y si a los administradores y colaboradores les conviene más un código por correo que una contraseña.

Lo que había:
- invitaciones con enlace que se copia;
- `enviar-invitacion`, que nada dispara (le falta el webhook);
- «¿La olvidaste?» por correo.

En la nube, el correo que trae Supabase es solo de prueba: manda únicamente a los correos del equipo del proyecto. Cualquier correo de Auth a un usuario real (código de entrada o recuperar contraseña) necesita un SMTP propio. Un código por correo no quita esa dependencia: la vuelve obligatoria en cada entrada desde un dispositivo nuevo. El análisis está en la [tarea 006](../../tasks/006-modelo-de-datos.md).

## Decisión

Aceptada por Luis el 2026-10-28:

- **Admin no envía correos.** Las invitaciones se comparten con «Copiar enlace».
- **Administradores y colaboradores entran con correo y contraseña.** El correo identifica la cuenta; no se verifica.
- **Si alguien olvida su contraseña, quien le dio acceso le genera un enlace** para elegir otra y se lo comparte. Es el mismo modelo que el código de activación de los educadores. Quién puede generarlo (`recuperacion_autorizar`, migración `0011`):
  - el superadmin (soporte), para cualquier cuenta;
  - el titular de una organización, para una cuenta que solo llega a organizaciones de las que es titular. Así nadie gana, con un enlace, el acceso a otra organización ([decisión 007](007-educador-hogar-y-ciclo-del-workshop.md): ninguna organización restablece el acceso de otra);
  - nadie, para su propia cuenta: la contraseña se cambia desde el perfil.
- El enlace (Edge Function `enlace-recuperacion`, sin enviar correo) sirve una vez y dura 24 horas; uno nuevo anula el anterior. `/restablecer` lo canjea al guardar la contraseña, no al abrirse, para que la vista previa de un chat no lo gaste.
- **Educadores:** sin cambios. Correo y PIN, con el código de activación que genera Admin.

## Consecuencias

- No hay SMTP, dominio que verificar ni entregabilidad de la que depender para entrar o recuperar el acceso.
- Olvidar la contraseña cuesta una petición al titular o a soporte. Perder el buzón no deja a nadie fuera.
- Quien tiene el enlace de una invitación o de recuperación entra con esa cuenta. Se comparte por un canal de confianza; caduca, sirve una vez y se puede revocar (invitaciones) o anular generando otro (recuperación).
- `enviar-invitacion` y las plantillas de `plantillas_correo` se conservan sin desplegar.
- Se revisa al construir la app del hogar: las familias son muchas y su recuperación del PIN no puede pasar por soporte. Ese día se configura un SMTP una sola vez (Resend sirve), y se decide si Admin activa la recuperación por correo o el código.
