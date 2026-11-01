-- 0011: las invitaciones se envían por correo al crearlas (Resend; decisión 012, Luis 2026-11-01).
--
-- El enlace se sigue pudiendo copiar: el correo es un canal más, no el único. La Edge Function
-- `enviar-invitacion` anota aquí cuándo salió el correo o por qué no salió, para que Admin lo
-- muestre junto a la invitación y ofrezca reenviarlo.

alter table invitaciones
  add column correo_enviado_en timestamptz,   -- el último envío que Resend aceptó
  add column correo_error      text;          -- por qué falló el último intento; null si salió
