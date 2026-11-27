import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'
import actividadFisica from '~/assets/temas/actividad-fisica.svg?url'
import alimentacion from '~/assets/temas/alimentacion.svg?url'
import cuidadoPersonal from '~/assets/temas/cuidado-personal.svg?url'
import saludEmocional from '~/assets/temas/salud-emocional.svg?url'

// Los cuatro temas (las categorías de los storyboards), siempre los cuatro: cada uno con su área del kit (su color), su
// icono («Explora por tema», neutro para niños y adolescentes; Luis, 2026-11-27) y su dibujo, hecho con piezas de la
// librería de Player (`assets/temas/`), que hace de portada de un storyboard que todavía no tiene la suya.
export const TEMAS = [
  { categoria: 'ALIMENTACION', area: 'alimentacion', icono: 'apple', dibujo: alimentacion },
  { categoria: 'ACTIVIDAD_FISICA', area: 'actividad-fisica', icono: 'dumbbell', dibujo: actividadFisica },
  { categoria: 'CUIDADO_PERSONAL', area: 'cuidado-personal', icono: 'droplet', dibujo: cuidadoPersonal },
  { categoria: 'SALUD_EMOCIONAL', area: 'salud-emocional', icono: 'smile', dibujo: saludEmocional },
] as const satisfies readonly { categoria: string, area: string, icono: UiIconName, dibujo: string }[]

export function temaDe(categoria: string) {
  return TEMAS.find(t => t.categoria === categoria) ?? TEMAS[0]
}
