// Color = significado (packages/ui/DESIGN.md, «Roles de color»): un solo mapa por concepto para
// todo Admin, para que el mismo estado se vea igual en Platform y en la organización.
import type { UiTone } from '@playhub/ui/app/utils/ui-tones'
import { hoyLocal } from './fechas'

// Licencia: activa (vigente) lima; trial cielo (vigente de prueba, información); suspendida neutro
// (inactiva); vencida coral.
const LICENCIA_TONE = { ACTIVA: 'lime', TRIAL: 'sky', SUSPENDIDA: 'neutral', VENCIDA: 'coral' } as const satisfies Record<string, UiTone>
export function licenciaTone(estado?: string | null): UiTone {
  return LICENCIA_TONE[estado as keyof typeof LICENCIA_TONE] ?? 'neutral'
}

// Invitación: pendiente uva (nueva, aún sin respuesta); aceptada lima; expirada, revocada o
// rechazada coral.
const INVITACION_TONE = { PENDIENTE: 'grape', USADA: 'lime', EXPIRADA: 'coral', REVOCADA: 'coral', RECHAZADA: 'coral' } as const satisfies Record<string, UiTone>
export function invitacionTone(estado?: string | null): UiTone {
  return INVITACION_TONE[estado as keyof typeof INVITACION_TONE] ?? 'neutral'
}

// Fin de una licencia: ya pasó → coral; vigente que vence en 30 días o menos → sol (el umbral de
// «Por vencer» del resumen de Platform). Si no, sin tono.
export const DIAS_POR_VENCER = 30
export function finLicenciaTone(
  l: { estado: string, fecha_fin: string | null },
  hoy = hoyLocal(),
): UiTone | undefined {
  if (!l.fecha_fin) return undefined
  const fin = l.fecha_fin.slice(0, 10)
  if (fin < hoy) return 'coral'
  const limite = new Date(Date.parse(hoy) + DIAS_POR_VENCER * 86_400_000).toISOString().slice(0, 10)
  return (l.estado === 'ACTIVA' || l.estado === 'TRIAL') && fin <= limite ? 'sun' : undefined
}
