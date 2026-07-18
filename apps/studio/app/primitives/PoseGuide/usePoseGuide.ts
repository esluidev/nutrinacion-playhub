import { computed, onBeforeUnmount, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { lerpPoseDef, type KidPoseDef } from '~/sprites/kid-poses'

// Motor de la demo de ejercicio: recibe la secuencia de poses YA horneadas
// (KidPoseDef[], espejos incluidos) y las anima por INTERPOLACIÓN — un tween
// continuo a 60fps (requestAnimationFrame) con easing seno in-out entre cada
// pose y la siguiente, al tempo del `interval`. El movimiento se ve natural
// (la rodilla sube y baja, el salto describe su arco) sin autorar cuadros
// intermedios: las poses son geometría pura y se interpolan solas.
//
// `defs`/`interval` son REACTIVOS: si el ejercicio mostrado cambia (p. ej. la
// siguiente ronda de una escena), la demo se resetea al primer cuadro del
// nuevo movimiento — sin recrear el componente.
export function usePoseGuide(opts: {
  defs: MaybeRefOrGetter<KidPoseDef[]>
  interval?: MaybeRefOrGetter<number | undefined>
  /** Se dispara al cruzar cada cuadro (para sincronizar sonidos) */
  onStep?: (index: number) => void
}) {
  const defs = computed(() => toValue(opts.defs))

  const index = ref(0)
  const playing = ref(false)
  const def = ref<KidPoseDef>(defs.value[0]!)

  let raf: number | null = null
  let segStart = 0

  // Seno in-out: acelera al salir de una pose y se asienta en la siguiente
  // (pequeña pausa natural en los extremos del movimiento)
  const ease = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2

  function tick(now: number) {
    const interval = Math.max(120, toValue(opts.interval) ?? 700)
    let elapsed = now - segStart
    while (elapsed >= interval) {
      segStart += interval
      elapsed -= interval
      index.value = (index.value + 1) % defs.value.length
      opts.onStep?.(index.value)
    }
    const a = defs.value[index.value % defs.value.length]!
    const b = defs.value[(index.value + 1) % defs.value.length]!
    def.value = lerpPoseDef(a, b, ease(Math.min(elapsed / interval, 1)))
    raf = requestAnimationFrame(tick)
  }

  function play() {
    if (typeof window === 'undefined') return
    if (playing.value || defs.value.length <= 1) return
    playing.value = true
    segStart = performance.now()
    raf = requestAnimationFrame(tick)
  }

  function pause() {
    playing.value = false
    if (raf != null) cancelAnimationFrame(raf)
    raf = null
  }

  function reset() {
    pause()
    index.value = 0
    def.value = defs.value[0]!
  }

  // Cambió el movimiento: volver al primer cuadro del nuevo (y si estaba
  // sonando la demo, retomarla con su propio tempo)
  watch(defs, () => {
    const wasPlaying = playing.value
    reset()
    if (wasPlaying) play()
  })

  onBeforeUnmount(pause)

  return { def, index, playing, play, pause, reset }
}
