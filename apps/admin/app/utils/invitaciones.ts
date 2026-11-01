// A quién se invitó: el nombre y apellido que se escribieron al invitar, o null si no hay.
export function nombreInvitado(inv: { nombre?: string | null, apellido?: string | null }): string | null {
  return `${inv.nombre ?? ''} ${inv.apellido ?? ''}`.trim() || null
}

// El enlace de la invitación: abre el registro con su token en esta misma app. Va en el correo
// (decisión 012) y también se puede copiar y compartir por otro canal.
export function enlaceInvitacion(token: string): string {
  return `${window.location.origin}/invitacion/${token}`
}

// Cómo quedó el correo de una invitación (0011): `correo_error` es por qué falló el último intento
// (null si salió) y `correo_enviado_en`, el último envío que Resend aceptó. Un error manda sobre un
// envío anterior: el último intento no salió, aunque uno previo sí.
export type EstadoCorreo =
  | { tipo: 'enviado', enviadoEn: string }
  | { tipo: 'fallido', motivo: string, enviadoEn: string | null }
  | { tipo: 'sin_enviar' }

export function estadoCorreo(inv: { correo_enviado_en?: string | null, correo_error?: string | null }): EstadoCorreo {
  const motivo = inv.correo_error?.trim()
  if (motivo) return { tipo: 'fallido', motivo: sinPuntoFinal(motivo), enviadoEn: inv.correo_enviado_en ?? null }
  if (inv.correo_enviado_en) return { tipo: 'enviado', enviadoEn: inv.correo_enviado_en }
  return { tipo: 'sin_enviar' }
}

// Los motivos de la Edge Function terminan en punto; los textos que los citan ponen el suyo.
export function sinPuntoFinal(texto: string): string {
  return texto.trim().replace(/\.+$/, '')
}
