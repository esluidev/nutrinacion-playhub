import { muted } from '../audio/settings'
import { librarySfx } from '../content'

// ---- Los sonidos del motor. No son archivos: el motor los genera en el momento con el audio del navegador, a partir
// de una receta por acción (`SOUNDS`). Así suenan al instante, no pesan, no hay nada que descargar ni licencias que
// cuidar, y cambiar uno es cambiar sus números. No son la narración (esa es una voz, en `audio/`).
//
// Qué suena en cada acción lo deciden los patrones de sonido de los juegos, no el gusto de cada escena:
//   - El tono sigue al gesto. Lo que sube suena hacia arriba y lo que baja, hacia abajo: tomar una pieza es un «pop»
//     que sube; dejarla, un «plop» que baja y se asienta; un toque que la hace saltar, un «boing».
//   - Lo que va bien sube y lo que no, baja. Un acierto son campanas hacia arriba; un «otra vez», dos notas graves y
//     apagadas hacia abajo, que nunca suenan a castigo.
//   - Cada familia tiene su timbre, y de oído se sabe qué pasó: las piezas son burbujas (pop, plop, boing); lo que se
//     mueve, aire (un soplo); la respuesta del juego, campanas; la interfaz, toques secos sin tono.
//   - Un sonido bueno tiene capas: el golpe del principio, el cuerpo y la cola. La hoja de la respuesta suena a cómo
//     entra (el soplo con que sube) y a lo que dice (sus campanas).
//   - La racha se oye: cada acierto seguido suena un paso más arriba en la escala (`SCALE`), hasta el cierre.
//   - Descubrir es voltear una carta: el soplo grave de una hoja que gira y cae.
//   - Nunca dos veces igual: cada vez cambia un poco el tono (`vary`), para que lo repetido no canse.
//   - Una interacción suena una vez: de lo que se pide a la vez suena lo que más pesa (`cueSound`, `cueInterface`).
// Nada lleva barridos largos, ondas cuadradas ni ecos, que es lo que suena a juego espacial.
//
//   - Respeta el silencio del runner.
//   - Una escena puede traer una grabación suya (un cacareo de verdad): el archivo va en `content/library/sfx/`, su
//     nombre en `library.sfx` de su `scene.json`, y se pide igual, por su nombre.
// El navegador solo deja sonar después de un toque del usuario: el primero que llega prepara el audio. ----

/** Una capa de un sonido: un tono (una nota, que puede caer o subir un poco) o un ruido filtrado (un golpe, un soplo). */
export type Layer = {
  /** Cuándo empieza, en segundos desde el principio del sonido. */
  at?: number
  /** Lo que tarda en llegar a su volumen, en segundos. */
  attack?: number
  /** Lo que tarda en apagarse, en segundos. */
  decay: number
  /** Su volumen dentro del sonido, de 0 a 1. */
  gain: number
} & (
  | { /** La frecuencia del tono, en Hz. */ tone: number, /** Adónde llega, si se mueve. */ to?: number, /** En cuánto tiempo. */ glide?: number, wave?: OscillatorType }
  | { /** El filtro del ruido. */ noise: BiquadFilterType, /** Su frecuencia, en Hz. */ freq: number, to?: number, glide?: number, q?: number }
)

export interface Recipe {
  /** Volumen del sonido entero, de 0 a 1. */
  volume: number
  /** Cuánto puede variar el tono cada vez, hacia arriba o hacia abajo (0,05 es un 5 %). */
  vary?: number
  layers: Layer[]
}

export interface SoundOptions {
  volume?: number
  /** Velocidad y tono: 1 es el original. */
  rate?: number
  vary?: number
}

/** Las notas, en Hz. */
const NOTE = { E4: 329.63, G4: 392, C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98 }

/** Los pasos de la escala mayor: cada acierto seguido suena uno más arriba. */
export const SCALE = [1, 9 / 8, 5 / 4, 4 / 3, 3 / 2, 5 / 3, 15 / 8, 2]

/** Lo más agudo que lleva un sonido: por encima, un altavoz pequeño chilla. */
const TOP = 4200

/**
 * Una burbuja: un tono muy corto que se desliza de una nota a otra, con el chasquido del principio. Hacia arriba es un
 * «pop»; hacia abajo, un «plop».
 */
function bubble(from: number, to: number, length: number, gain = 1): Layer[] {
  return [
    { tone: from, to, glide: length * 0.6, attack: 0.002, decay: length, gain },
    { noise: 'bandpass', freq: 1800, q: 1.4, attack: 0.001, decay: 0.006, gain: gain * 0.04 },
  ]
}

/**
 * Una campana de caja de música: la nota con su octava, su quinta y un brillo arriba, cada uno más corto que el
 * anterior, y el toque del martillo.
 */
function bell(freq: number, at = 0, gain = 1, decay = 0.4): Layer[] {
  const partials = [[1, 1, 1], [2, 0.4, 0.6], [3, 0.18, 0.4], [4.2, 0.08, 0.25]] as const
  return [
    ...partials.filter(([ratio]) => freq * ratio <= TOP).map(([ratio, level, length]): Layer => ({ tone: freq * ratio, at, attack: 0.004, decay: decay * length, gain: gain * level })),
    { noise: 'bandpass', freq: Math.min(freq * 4, TOP), q: 1.2, at, attack: 0.001, decay: 0.01, gain: gain * 0.03 },
  ]
}

/** Una nota de madera, apagada y sin brillo: para lo que no salió. */
function mallet(freq: number, at = 0, gain = 1, decay = 0.22): Layer[] {
  return [
    { tone: freq, at, attack: 0.003, decay, gain },
    { tone: freq * 4, at, attack: 0.002, decay: decay * 0.3, gain: gain * 0.12 },
  ]
}

/** Un toque seco sobre papel o cartón: un ruido cortísimo y estrecho, sin tono. Es el material de la interfaz. */
function tick(freq: number, at = 0, gain = 1): Layer[] {
  return [
    { noise: 'bandpass', freq, q: 2.2, at, attack: 0.001, decay: 0.016, gain },
    { noise: 'lowpass', freq: 420, at, attack: 0.001, decay: 0.028, gain: gain * 0.2 },
  ]
}

/** Un soplo de aire que sube o baja de color, sin tono. */
function breath(from: number, to: number, length: number, gain = 1, at = 0): Layer[] {
  return [{ noise: 'bandpass', freq: from, to, glide: length, q: 0.8, at, attack: length * 0.35, decay: length * 0.75, gain }]
}

/** El soplo corto con que sube la hoja de la respuesta. */
const sheet = () => breath(700, 1600, 0.12, 0.45)

/**
 * Qué suena en cada acción. Las de las piezas las hereda cualquier pieza (`useDrag`); `volar`, `destapar`, `cocer` y
 * `listo` las piden las plantillas; la respuesta del juego y la interfaz las pone el marco. Pasar de escena no suena.
 */
export const SOUNDS = {
  // ---- Las piezas: burbujas. El tono sigue al gesto.
  /** Tomar una pieza: un «pop» que sube. */
  agarrar: { volume: 0.42, vary: 0.06, layers: bubble(300, 620, 0.075, 0.9) },
  /** Dejarla en su sitio, o llegar a él: un «plop» que baja y se asienta. */
  soltar: {
    volume: 0.5,
    vary: 0.06,
    layers: [...bubble(440, 170, 0.12, 0.9), { noise: 'lowpass', freq: 700, attack: 0.001, decay: 0.04, gain: 0.08 }],
  },
  /** Un toque sobre una pieza, que la hace saltar: un «boing» que sube. */
  tocar: {
    volume: 0.4,
    vary: 0.08,
    layers: [...bubble(330, 700, 0.16, 0.8), { tone: 660, to: 1400, glide: 0.1, attack: 0.003, decay: 0.1, gain: 0.14 }],
  },
  // ---- Lo que se mueve: aire.
  /** Soltarla fuera: vuelve a su sitio, con un soplo que baja. */
  volver: { volume: 0.38, vary: 0.05, layers: breath(1500, 500, 0.16) },
  /** Algo sale volando hacia su sitio: un soplo rápido que sube. */
  volar: { volume: 0.3, vary: 0.05, layers: breath(700, 2600, 0.18) },
  // ---- Descubrir: una carta que se voltea.
  /** Algo se descubre: el soplo grave de una hoja que gira, y su golpe al caer. */
  destapar: {
    volume: 0.45,
    vary: 0.04,
    layers: [...breath(350, 1300, 0.3), { tone: 135, to: 90, glide: 0.07, at: 0.24, attack: 0.004, decay: 0.1, gain: 0.5 }],
  },
  // ---- Lo que tarda: mientras se mantiene el dedo, burbujas pequeñas (`createSustain`); al terminar, una campanilla.
  /** Un grano de lo que se cuece o se llena mientras el dedo sigue: una burbuja pequeña, que suena muchas veces. */
  cocer: { volume: 0.18, vary: 0.14, layers: bubble(520, 860, 0.05, 0.8) },
  /** Ya está: la campanilla de un temporizador de cocina, dos notas rápidas hacia arriba. */
  listo: { volume: 0.34, layers: [...bell(NOTE.C6, 0, 0.9, 0.3), ...bell(NOTE.E6, 0.07, 0.6, 0.4)] },
  // ---- La respuesta del juego: la hoja que sube y sus campanas.
  /** La hoja que explica algo: dos campanas, la segunda una quinta más arriba, como un aviso que llega. */
  aviso: { volume: 0.42, layers: [...sheet(), ...bell(NOTE.G5, 0.08, 0.7, 0.35), ...bell(NOTE.D6, 0.2, 0.75, 0.55)] },
  /** Un acierto: tres campanas que suben por el acorde, y un brillo al final. */
  acierto: {
    volume: 0.45,
    layers: [...sheet(), ...bell(NOTE.C5, 0.06, 0.75, 0.3), ...bell(NOTE.E5, 0.16, 0.75, 0.3), ...bell(NOTE.G5, 0.26, 0.85, 0.65), ...bell(NOTE.G6, 0.3, 0.1, 0.5)],
  },
  /** Hay que intentarlo otra vez: dos notas de madera, graves y apagadas, que bajan. */
  reintento: { volume: 0.45, layers: [...sheet(), ...mallet(NOTE.G4, 0.06, 0.8, 0.26), ...mallet(NOTE.E4, 0.22, 0.8, 0.42)] },
  /** La escena quedó completa: el acorde entero hacia arriba, que se queda sonando, con su chispa. */
  completar: {
    volume: 0.38,
    layers: [
      ...bell(NOTE.C5, 0, 0.7, 0.3),
      ...bell(NOTE.E5, 0.09, 0.7, 0.3),
      ...bell(NOTE.G5, 0.18, 0.75, 0.34),
      ...bell(NOTE.C6, 0.29, 0.85, 0.9),
      ...bell(NOTE.E6, 0.29, 0.3, 0.8),
      ...bell(NOTE.G6, 0.29, 0.25, 0.8),
      { noise: 'highpass', freq: 3600, at: 0.29, attack: 0.01, decay: 0.3, gain: 0.03 },
    ],
  },
  // ---- La interfaz: toques secos sin tono. No se parecen a ninguna pieza.
  /** Pulsar un control: un toque, el más corto y el más bajo. */
  pulsar: { volume: 0.48, vary: 0.05, layers: tick(2100, 0, 0.8) },
  /** Se despliega un control, un panel o una ventana: dos toques, el segundo más claro. */
  abrir: { volume: 0.42, layers: [...tick(1500, 0, 0.8), ...tick(2500, 0.05, 0.95)] },
  /** Se recoge: los mismos dos, al revés. */
  cerrar: { volume: 0.42, layers: [...tick(2500, 0, 0.8), ...tick(1500, 0.05, 0.95)] },
} satisfies Record<string, Recipe>

export type SoundName = keyof typeof SOUNDS

/** El volumen de todos los sonidos a la vez. Deja margen para que dos que coinciden no saturen. */
const MASTER = 0.7
/** Un ruido filtrado pierde casi toda su fuerza en el filtro: se le devuelve, para que su `gain` se compare con el de un tono. */
const NOISE_MAKEUP = 4

const recipeOf = (name: string): Recipe | undefined => (SOUNDS as Record<string, Recipe>)[name]

/** Lo que dura un sonido, en segundos. */
export const soundLength = (recipe: Recipe) => Math.max(...recipe.layers.map(layer => (layer.at ?? 0) + (layer.attack ?? 0.003) + layer.decay)) + 0.03

// Un segundo de ruido blanco por cada salida de audio: de ahí salen los golpes y los soplos.
const noises = new WeakMap<BaseAudioContext, AudioBuffer>()
function noiseOf(context: BaseAudioContext): AudioBuffer {
  let buffer = noises.get(context)
  if (!buffer) {
    buffer = context.createBuffer(1, context.sampleRate, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1
    noises.set(context, buffer)
  }
  return buffer
}

/** Monta un sonido en una salida de audio, para que empiece en `when`. `rate` sube o baja todos sus tonos. */
export function buildSound(context: BaseAudioContext, out: AudioNode, recipe: Recipe, when: number, rate = 1) {
  const SILENCE = 0.0001
  for (const layer of recipe.layers) {
    const start = when + (layer.at ?? 0)
    const attack = Math.max(layer.attack ?? 0.003, 0.001)
    const end = start + attack + layer.decay
    const level = context.createGain()
    level.gain.setValueAtTime(SILENCE, start)
    level.gain.exponentialRampToValueAtTime('tone' in layer ? layer.gain : layer.gain * NOISE_MAKEUP, start + attack)
    level.gain.exponentialRampToValueAtTime(SILENCE, end)
    level.connect(out)
    if ('tone' in layer) {
      const voice = context.createOscillator()
      voice.type = layer.wave ?? 'sine'
      voice.frequency.setValueAtTime(layer.tone * rate, start)
      if (layer.to) voice.frequency.exponentialRampToValueAtTime(layer.to * rate, start + (layer.glide ?? layer.decay))
      voice.connect(level)
      voice.start(start)
      voice.stop(end + 0.02)
    }
    else {
      const voice = context.createBufferSource()
      voice.buffer = noiseOf(context)
      voice.loop = true
      const filter = context.createBiquadFilter()
      filter.type = layer.noise
      filter.Q.value = layer.q ?? 0.7
      filter.frequency.setValueAtTime(layer.freq * rate, start)
      if (layer.to) filter.frequency.exponentialRampToValueAtTime(layer.to * rate, start + (layer.glide ?? layer.decay))
      voice.connect(filter).connect(level)
      voice.start(start, Math.random() * 0.5)
      voice.stop(end + 0.02)
    }
  }
}

/** Las muestras de un sonido, sin hacerlo sonar: para medirlo. Solo en un navegador. */
export async function renderSound(name: SoundName, sampleRate = 44100): Promise<Float32Array> {
  const recipe = SOUNDS[name]
  const offline = new OfflineAudioContext(1, Math.ceil(sampleRate * soundLength(recipe)), sampleRate)
  const level = offline.createGain()
  level.gain.value = recipe.volume * MASTER
  level.connect(offline.destination)
  buildSound(offline, level, recipe, 0)
  return (await offline.startRendering()).getChannelData(0)
}

let context: AudioContext | null | undefined
/** Por donde salen todos los sonidos: un limitador, para que dos que coinciden nunca saturen el altavoz. */
let bus: AudioNode | null = null
function audio(): AudioContext | null {
  if (context !== undefined) return context
  const Context = typeof window === 'undefined' ? undefined : window.AudioContext
  context = Context ? new Context() : null
  if (context) {
    const limiter = context.createDynamicsCompressor()
    limiter.threshold.value = -4
    limiter.knee.value = 0
    limiter.ratio.value = 20
    limiter.attack.value = 0.002
    limiter.release.value = 0.12
    limiter.connect(context.destination)
    bus = limiter
  }
  return context
}
// El primer toque prepara el audio, para que el primer sonido no llegue tarde.
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => { void audio()?.resume() }, { capture: true, passive: true })
}

// ---- Las grabaciones de una escena (`library.sfx`): se descargan y se decodifican una vez.
const loading = new Map<string, Promise<void>>()
const recordings = new Map<string, AudioBuffer>()

/** Deja lista una grabación de la librería. Se puede pedir varias veces; nunca falla. */
export function loadSound(name: string): Promise<void> {
  let ready = loading.get(name)
  if (!ready) {
    const url = librarySfx(name)
    const player = url ? audio() : null
    ready = !url || !player
      ? Promise.resolve()
      : fetch(url)
          .then(response => response.arrayBuffer())
          .then(data => player.decodeAudioData(data))
          .then((buffer) => { recordings.set(name, buffer) }, () => {})
    loading.set(name, ready)
  }
  return ready
}

const listeners = new Set<(name: string, rate: number) => void>()
/** Avisa de cada sonido que suena y a qué tono (para el panel de sonidos). Devuelve con qué dejar de escuchar. */
export function onSound(fn: (name: string, rate: number) => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

/**
 * Hace sonar una acción del motor o una grabación de la escena, por su nombre. Si no existe, en silencio o sin audio en
 * el dispositivo, no hace nada.
 */
export function playSound(name: SoundName | (string & {}), options: SoundOptions = {}) {
  const recipe = recipeOf(name)
  const recording = recipe ? undefined : recordings.get(name)
  if ((!recipe && !recording) || muted.value) return
  const player = audio()
  if (!player) return
  if (player.state === 'suspended') void player.resume()
  const vary = options.vary ?? recipe?.vary ?? 0
  const rate = (options.rate ?? 1) * (1 + (Math.random() * 2 - 1) * vary)
  const level = player.createGain()
  level.gain.value = (options.volume ?? recipe?.volume ?? 1) * MASTER
  level.connect(bus ?? player.destination)
  if (recipe) {
    buildSound(player, level, recipe, player.currentTime + 0.005, rate)
  }
  else {
    const source = player.createBufferSource()
    source.buffer = recording!
    source.playbackRate.value = rate
    source.connect(level)
    source.start()
  }
  listeners.forEach(fn => fn(name, rate))
}

/**
 * Un sonido que dura lo que dura un gesto (mantener el dedo). No es una nota larga: son granos del mismo sonido, cada
 * vez más seguidos y más agudos conforme lo que se hace se acerca al final, el patrón de los juegos para lo que se
 * carga o se llena. Quien lleva el gesto lo avanza en su tiempo de juego (`tick`), así que en pausa calla.
 * `gap` es lo que separa dos granos al empezar y al terminar, en segundos; `rise`, cuánto sube el tono al final.
 */
export function createSustain(
  name: SoundName,
  options: { gap?: [number, number], rise?: number } = {},
  play: (name: SoundName, options?: SoundOptions) => void = playSound,
) {
  const [slow, fast] = options.gap ?? [0.34, 0.13]
  const rise = options.rise ?? 0.6
  let wait = 0
  return {
    /** Avanza `dt` segundos con el avance `k`, de 0 a 1: suena un grano cuando toca. */
    tick(dt: number, k: number) {
      wait -= dt
      if (wait > 0) return
      const c = Math.min(Math.max(k, 0), 1)
      // El hueco entre granos varía un poco, para que no suene a metrónomo.
      wait = (slow + (fast - slow) * c) * (0.8 + Math.random() * 0.4)
      play(name, { rate: 1 + rise * c })
    },
    /** Vuelve a empezar: el siguiente grano suena enseguida. */
    reset() { wait = 0 },
  }
}

// ---- Una cosa suena una vez. Lo que se pide casi a la vez se junta un instante y suena solo lo que más pesa, de
// menos a más en `rank`. ----
function createCue<Name extends SoundName>(rank: readonly Name[], gather: number) {
  let pending: { name: Name, options?: SoundOptions } | null = null
  return (name: Name, options?: SoundOptions, play: (name: Name, options?: SoundOptions) => void = playSound) => {
    if (pending === null) {
      setTimeout(() => {
        const winner = pending
        pending = null
        if (winner) play(winner.name, winner.options)
      }, gather)
    }
    if (pending === null || rank.indexOf(name) > rank.indexOf(pending.name)) pending = { name, options }
  }
}

/** La respuesta del juego: un acierto que además completa la escena suena solo a escena completa. */
export const cueSound = createCue(['aviso', 'reintento', 'acierto', 'completar'], 60)

/** La interfaz: pulsar un botón que despliega o recoge algo suena solo a eso, no a las dos cosas. */
export const cueInterface = createCue(['pulsar', 'cerrar', 'abrir'], 30)
