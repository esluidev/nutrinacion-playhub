import { reactive } from 'vue'
import type { InjectionKey } from 'vue'

// Cada escena aparece completa, de una vez. Una escena recién montada se queda oculta mientras espera lo que tarda en
// estar después de montarse (sus personajes de Rive, que cargan y pintan su primer cuadro un poco más tarde); cuando
// todo avisa, o al agotarse el plazo, se muestra entera. Lo que llega cuando la escena ya se ve (el ave que aparece al
// destapar una tarjeta) no la vuelve a ocultar: eso lo resuelve su propia entrada.

export interface SceneLoad {
  /** Cuántas cosas de la escena faltan por estar. */
  pending: number
  /** La escena ya se puede ver. */
  shown: boolean
}

/** Lo que usa una pieza para retener su escena: recibe su nodo y devuelve con qué avisar de que ya está. */
export const SCENE_HOLD_KEY: InjectionKey<(el: Element) => () => void> = Symbol('scene-hold')

export function useSceneLoad(count: number, limitMs = 1500) {
  const scenes = reactive<SceneLoad[]>(Array.from({ length: count }, () => ({ pending: 0, shown: false })))
  const timers = new Map<number, ReturnType<typeof setTimeout>>()
  const waiting = new Map<number, (() => void)[]>()
  // Cada apertura deja sin efecto los avisos de la anterior (una escena reiniciada mientras cargaba).
  const turns = Array.from({ length: count }, () => 0)

  function reveal(i: number) {
    const scene = scenes[i]
    if (!scene || scene.shown) return
    scene.shown = true
    clearTimeout(timers.get(i))
    timers.delete(i)
    waiting.get(i)?.forEach(done => done())
    waiting.delete(i)
  }

  /** La escena se monta (o se reinicia): queda oculta hasta `settle` y lo que espere, o hasta agotar el plazo. */
  function open(i: number) {
    const scene = scenes[i]
    if (!scene) return
    turns[i]! += 1
    scene.shown = false
    scene.pending = 0
    clearTimeout(timers.get(i))
    timers.set(i, setTimeout(() => reveal(i), limitMs))
  }

  /** Lo que la escena monta ya pudo pedir que la esperen: si nadie lo pidió, se muestra. */
  function settle(i: number) {
    const scene = scenes[i]
    if (scene && scene.pending <= 0) reveal(i)
  }

  /** Algo de la escena tarda en estar: la retiene hasta llamar a lo que devuelve. Ya mostrada, no la oculta. */
  function hold(i: number): () => void {
    const scene = scenes[i]
    if (!scene || scene.shown) return () => {}
    const turn = turns[i]
    scene.pending += 1
    let released = false
    return () => {
      if (released) return
      released = true
      if (turns[i] !== turn) return
      scene.pending -= 1
      if (scene.pending <= 0) reveal(i)
    }
  }

  /** Se cumple cuando la escena ya se ve. */
  function whenShown(i: number): Promise<void> {
    const scene = scenes[i]
    if (!scene || scene.shown) return Promise.resolve()
    return new Promise((resolve) => {
      waiting.set(i, [...(waiting.get(i) ?? []), resolve])
    })
  }

  function dispose() {
    timers.forEach(timer => clearTimeout(timer))
    timers.clear()
    waiting.clear()
  }

  return { scenes, open, settle, hold, whenShown, dispose }
}
