import { tr } from '~/types/i18n'
import type { I18nText } from '~/types/i18n'
import type { TemplateProps } from './types'

// Lo que comparten las plantillas: el tablero de 1280 × 600 en píxeles de diseño, la caja de cada pieza, el puntero en
// coordenadas del tablero, los textos de la escena y el movimiento reducido. El gesto de arrastrar y soltar, en
// `useDrag.ts`.

export const BOARD = { width: 1280, height: 600 }

/** La caja absoluta de una pieza en el tablero: izquierda, arriba, ancho y alto. */
export function box(x: number, y: number, w: number, h: number) {
  return { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` }
}

/** Un punto del puntero en coordenadas del tablero, con el zoom del marco y el encaje del tablero. */
export function toBoard(layer: Pick<HTMLElement, 'getBoundingClientRect'>, event: Pick<PointerEvent, 'clientX' | 'clientY'>) {
  const rect = layer.getBoundingClientRect()
  const k = rect.width / BOARD.width
  return { x: (event.clientX - rect.left) / k, y: (event.clientY - rect.top) / k }
}

/** Los textos de la escena en su idioma: `t` traduce un texto y `str`, una clave de `strings`. */
export function useSceneText(props: Pick<TemplateProps, 'scene' | 'locale'>) {
  const t = (value: I18nText | null | undefined) => (value ? tr(value, props.locale) : '')
  const str = (key: string | undefined) => (key ? t(props.scene.strings?.[key]) : '')
  return { t, str }
}

/** El sistema pide movimiento reducido. */
export const prefersReducedMotion = () => import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
