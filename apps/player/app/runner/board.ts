import { getCurrentScope, onScopeDispose } from 'vue'
import { textoDe, vozDe } from './audio/voz'
import type { Parte } from './audio/voz'
import { realTime } from './engine/world'
import type { World } from './engine/world'
import type { FeedbackKind, FeedbackPayload, TemplateProps, Texto } from './types'

// Lo que comparten las plantillas: el tablero de 1280 × 600 en píxeles de diseño, la caja de cada pieza, el puntero en
// coordenadas del tablero, los textos de la escena, el movimiento reducido y las animaciones con guion (cuadro a
// cuadro, de duración fija: un vuelo, la mano). Las piezas que se arrastran o cambian de sitio, en `useDrag.ts`, con
// la física del motor (`engine/`); la mano que demuestra la acción, en `useDemo.ts` y `DemoHand.vue`.

export const BOARD = { width: 1280, height: 600 }

export interface Point { x: number, y: number }

/** La caja absoluta de una pieza en el tablero: izquierda, arriba, ancho y alto. */
export function box(x: number, y: number, w: number, h: number) {
  return { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` }
}

/**
 * El puntero en coordenadas del tablero, con el zoom del marco y el encaje del tablero. La caja del tablero se lee una
 * vez: lo que devuelve sirve para todas las muestras de un mismo evento.
 */
export function boardPoint(layer: Pick<HTMLElement, 'getBoundingClientRect'>): (event: Pick<PointerEvent, 'clientX' | 'clientY'>) => Point {
  const rect = layer.getBoundingClientRect()
  const k = rect.width / BOARD.width
  return event => ({ x: (event.clientX - rect.left) / k, y: (event.clientY - rect.top) / k })
}

/**
 * La isla de un lugar: su único suelo, una pieza de la librería que es la misma en todo el taller (`isla-corral`,
 * `isla-pasto`, `isla-cancha`…). Va suelta en el tablero, bajo lo que se toma o se toca (el origen de un recorrido, una
 * fila de nidos, el personaje que se toca), y en la ficha que es un lugar (`islandTile`). En una tarjeta, el lugar no
 * lleva su isla: lleva su exterior (`sceneryCard`). Todas comparten forma (la de las piezas del tablero: un
 * rectángulo con las esquinas de `--radius-board`, 26, y su canto delante), lienzo y apoyos: lo que va al fondo (un
 * edificio) se apoya en `back`; quien está de pie, en `stand`; lo que va delante, en `front`. Su canto termina en
 * `foot`.
 */
export const ISLAND = { w: 560, h: 166, back: 72, stand: 100, front: 125, foot: 163 }

/**
 * La tarjeta del plano detalle (PLAYER-DESIGN, «Piezas del tablero»): una sola tarjeta con interior, como las de una
 * fila pero grande, centrada en el tablero. Ocupa el alto de las demás (de y 20 a y 580) y toma el ancho de su dibujo
 * (`art`: 704 × 536, un interior ancho de la librería, da 732 × 560), sin pasar de la columna del juego. Dentro del
 * marco (`line`), el dibujo va a escala `k`.
 */
export function detailCard(art: { w: number, h: number } = { w: 704, h: 536 }) {
  const line = 6
  const k = Math.min((560 - line * 2) / art.h, (1040 - line * 2) / art.w)
  const w = art.w * k + line * 2
  const h = art.h * k + line * 2
  return { line, k, w, h, x: (1280 - w) / 2, y: (600 - h) / 2 }
}

/**
 * La isla larga: la isla de un lugar a lo ancho de la columna del juego (`isla-corral-larga`, `isla-pasto-larga`), o
 * la base que no es de ningún lugar (`tarima-larga`), para una fila de cosas sueltas (los nidos de Destapar). Lo que lleva se apoya en `rest`, centrado cada `pitch` desde
 * el centro (en x 160, 520 y 880: entre uno y otro va el tramo de cerca o las matas de la isla), y la isla asoma
 * `front` por delante, hasta su canto. Se puede usar más pequeña: todo se escala con ella.
 */
export const ISLAND_ROW = { w: 1040, h: 166, rest: 128, front: 35, pitch: 360 }

/**
 * La tarjeta con escenario (PLAYER-DESIGN, «Piezas del tablero»): dentro del contorno de 3 y un margen blanco de 3
 * (`line`), la vista del lugar llena la tarjeta (`art`, con la clase `tb-exterior`). Un lugar al aire libre lleva su
 * exterior (`exterior` del ítem: `exterior-corral`, `exterior-acera`…): el cielo claro arriba y el suelo del lugar
 * abajo, de lado a lado; uno bajo techo, su interior (`interior`). Los dos tienen 616 de ancho y la proporción de su
 * tarjeta: 616 × 536 para una de 320 × 280 y 616 × 456 para una de 352 × 264. En un exterior el horizonte va en y 334
 * (`EXTERIOR.horizon`; lo de arriba es cielo) y lo que la tarjeta muestra se apoya a la misma distancia del pie del
 * dibujo en las dos medidas: lo que va al fondo (un edificio), a 104 (`back`); quien está de pie, a 74 (`stand`); lo
 * que llega, delante, a 48 (`front`). Devuelve, en coordenadas de la tarjeta, la caja del dibujo, su escala (`k`), el
 * horizonte (`sky`) y esas tres líneas.
 */
export const EXTERIOR = { w: 616, horizon: 334, back: 104, stand: 74, front: 48 }

export function sceneryCard(w: number, h: number) {
  const line = 6
  const k = (w - line * 2) / EXTERIOR.w
  const foot = h - line
  return {
    line,
    k,
    art: { x: line, y: line, w: w - line * 2, h: h - line * 2 },
    sky: line + EXTERIOR.horizon * k,
    back: foot - EXTERIOR.back * k,
    stand: foot - EXTERIOR.stand * k,
    front: foot - EXTERIOR.front * k,
  }
}

/**
 * La ficha que es un lugar (Repasar): dentro del contorno de 3 y un margen blanco de 3 (`line`), la isla del lugar
 * (`island`, con la clase `tb-isla`), la misma que va suelta en el tablero, abajo y centrada, con 12 de aire a los
 * lados y 8 debajo. Una ficha se mueve entera: lleva el lugar como se ve suelto, sobre su base, no como una tarjeta con
 * escenario. Sobre la isla, las líneas donde se apoya lo que la ficha muestra (`back`, `stand` y `front`, las de
 * `ISLAND`). En coordenadas de la ficha.
 */
export function islandTile(w: number, h: number) {
  const line = 6
  const side = 12
  const below = 8
  const iw = w - side * 2
  const k = iw / ISLAND.w
  const top = h - below - ISLAND.h * k
  return {
    line,
    island: { x: side, y: top, w: iw, h: ISLAND.h * k },
    back: top + ISLAND.back * k,
    stand: top + ISLAND.stand * k,
    front: top + ISLAND.front * k,
  }
}

/**
 * Los textos de la escena en su idioma: `t` da lo que se ve de un texto y `str`, de una clave de `strings`; `raw`
 * da el texto de una clave tal como está (con su voz, si la trae). `sheet` arma una hoja de feedback con textos de la
 * escena: su título y su cuerpo se ven, y su voz sale de esos mismos textos (`vozDe`, audio/voz.ts). Una plantilla
 * pasa los textos, no lo ya traducido, para que la hoja diga su voz.
 */
export function useSceneText(props: Pick<TemplateProps, 'scene' | 'locale'>) {
  const t = (value: Parte) => textoDe(value, props.locale)
  const raw = (key: string | undefined): Texto | undefined => (key ? props.scene.strings?.[key] : undefined)
  const str = (key: string | undefined) => t(raw(key))
  const sheet = (kind: FeedbackKind, title: Parte, ...body: Parte[]): FeedbackPayload => {
    const cuerpo = body.map(t).filter(Boolean).join(' ')
    return { kind, title: t(title), ...(cuerpo ? { body: cuerpo } : {}), voice: vozDe([title, ...body], props.locale) }
  }
  return { t, str, raw, sheet }
}

/** El sistema pide movimiento reducido. */
export const prefersReducedMotion = () => import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Un punto de la curva de `a` a `b` con control en `c` (de Bézier, cuadrática), con `s` de 0 a 1. */
export function curve(a: Point, c: Point, b: Point, s: number): Point {
  return {
    x: (1 - s) ** 2 * a.x + 2 * (1 - s) * s * c.x + s ** 2 * b.x,
    y: (1 - s) ** 2 * a.y + 2 * (1 - s) * s * c.y + s ** 2 * b.y,
  }
}

/** Aceleración suave al salir y al llegar (un vuelo, la mano que demuestra). */
export const easeInOut = (k: number) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2)
/** Sale rápido y frena al llegar (la vuelta a casa). */
export const easeOut = (k: number) => 1 - (1 - k) ** 3

/**
 * Una animación con guion de `ms`, cuadro a cuadro: `step(k)` con `k` de 0 a 1 y, al final, `step(1)` y `done`. Corre
 * en el tiempo de un mundo del motor (`engine/world.ts`): con el de la plantilla, se detiene con el tablero en pausa
 * y sigue al volver; sin él, en tiempo real. Termina siempre: si el navegador deja de pintar cuadros (la pestaña o el
 * panel en segundo plano), el reloj del motor sigue por temporizador y la escena no se queda a medias. Con 0 ms, de
 * una vez. Devuelve con qué pararla sin llegar al final.
 */
export function animate(ms: number, step: (k: number) => void, done?: () => void, world: World = realTime): () => void {
  return world.tween(ms, step, done)
}

/** Una animación a la vez (`animate`): empezar otra para la anterior, y se para al desmontar la plantilla. */
export function useAnimation(world: World = realTime) {
  let stopCurrent = () => {}
  // Cuál es la última: si una animación de 0 ms termina al empezar y su `done` para o empieza otra, esa manda.
  let turn = 0
  const stop = () => {
    turn += 1
    stopCurrent()
    stopCurrent = () => {}
  }
  if (getCurrentScope()) onScopeDispose(stop)
  return {
    run(ms: number, step: (k: number) => void, done?: () => void) {
      stop()
      const mine = turn
      const stopThis = animate(ms, step, done, world)
      if (turn === mine) stopCurrent = stopThis
    },
    stop,
  }
}
