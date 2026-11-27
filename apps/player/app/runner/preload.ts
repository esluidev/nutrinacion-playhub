import { libraryRive, librarySvg } from './content'
import { loadSound } from './engine/sound'
import { loadRive, loadRiveFile } from './rive'
import { TEMPLATE_SVG } from './templates/library'
import type { RunnerScene } from './types'

// Tener lista una escena antes de mostrarla: sus dibujos ya decodificados, el motor de Rive arrancado, sus archivos de
// Rive en memoria, los dibujos que trae su plantilla (`templates/library.ts`), sus grabaciones de sonido (los sonidos de
// las acciones no se cargan: los genera el motor) y, si trae
// su propio `scene.vue`, su código. Así la escena aparece entera y no por partes (primero el
// marco, luego la letra, los dibujos y al final el personaje), que es lo que delata a una página web. Cada escena dice
// lo que usa en `library` de su `scene.json`; lo que no declare se carga al usarse, como antes.

const images = new Map<string, Promise<void>>()
// Las imágenes ya decodificadas se conservan: mientras alguien las tiene, el navegador no las suelta.
const kept: HTMLImageElement[] = []

export function decodeImage(url: string | undefined): Promise<void> {
  if (!url || typeof Image === 'undefined') return Promise.resolve()
  let ready = images.get(url)
  if (!ready) {
    const image = new Image()
    image.src = url
    kept.push(image)
    const loaded = typeof image.decode === 'function'
      ? image.decode()
      : new Promise<void>((resolve) => { image.onload = image.onerror = () => resolve() })
    // Un dibujo que falla no detiene la escena: se verá su hueco, como antes.
    ready = loaded.then(() => {}, () => {})
    images.set(url, ready)
  }
  return ready
}

/** Deja listo un dibujo de la librería que usa el marco y no una escena (el avatar del niño). */

let runtime: Promise<void> | null = null
/** El motor de Rive con su wasm ya compilado: lo más pesado de la primera carga. */
function riveRuntime(): Promise<void> {
  runtime ??= loadRive()
    .then((rive) => {
      mark('rive-codigo')
      return rive.RuntimeLoader.awaitInstance()
    })
    .then(() => mark('rive-motor'), (error) => { console.warn('Rive no disponible', error) })
  return runtime
}

/** La letra del kit en los pesos del runner: sin ella el texto saldría en otra letra y saltaría al llegar. */
export function fontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.load) return Promise.resolve()
  return Promise.all([document.fonts.load('600 16px Nunito'), document.fonts.load('900 16px Nunito')]).then(() => mark('letra'), () => {})
}

const scenes = new WeakMap<RunnerScene, Promise<void>>()
const done = new WeakSet<RunnerScene>()

/** Deja lista una escena. Se puede pedir varias veces: se prepara una sola. */
export function preloadScene(scene: RunnerScene): Promise<void> {
  let ready = scenes.get(scene)
  if (!ready) {
    const { svg: own = [], rive = [], sfx = [] } = scene.json.library ?? {}
    // Los de la escena y los que trae su plantilla (una forma compartida no los lista en cada storyboard).
    const svg = [...new Set([...own, ...(scene.json.template ? TEMPLATE_SVG[scene.json.template] ?? [] : [])])]
    const riveFiles = rive.flatMap((name) => {
      const url = libraryRive(name)
      return url ? [loadRiveFile(url).then(() => {}, () => {})] : []
    })
    ready = Promise.all([
      Promise.all(svg.map(name => decodeImage(librarySvg(name)))).then(() => mark('dibujos')),
      ...(rive.length ? [riveRuntime(), ...riveFiles] : []),
      ...sfx.map(loadSound),
      scene.custom ? scene.custom().then(() => {}, () => {}) : undefined,
    ]).then(() => { done.add(scene) })
    scenes.set(scene, ready)
  }
  return ready
}

/** La escena ya está lista. */
export const isPreloaded = (scene: RunnerScene) => done.has(scene)

/** Deja una marca de tiempo (`performance.getEntriesByType('mark')`): sirve para medir la carga en un dispositivo. */
export function mark(name: string) {
  if (typeof performance !== 'undefined') performance.mark?.(`playhub:${name}`)
}

/** Espera un trabajo como mucho `ms`: con mala red, se sigue con lo que haya. */
export function within(ms: number, work: Promise<unknown>): Promise<void> {
  return Promise.race([work, new Promise(resolve => setTimeout(resolve, ms))]).then(() => {})
}
