import type { Ref } from 'vue'

// Espacio de diseño 1280 × 800 con zoom al área segura de la pantalla (PLAYER-DESIGN.md).
// Mide la pantalla con una sonda (`probe`, con los insets de env(safe-area-*)) y fija en el
// documento las variables que lee runner.css: --player-scale, --frame-w/-h, --safe-*, la fila
// de la consigna y el encaje del tablero (--scene-fit, nunca mayor que 1). `sinBandas` (la vista
// previa) no reserva la barra ni el pie: la escena se encaja en todo el alto.

const FRAME = { width: 1280, height: 800 }
const SCENE = { width: 1280, height: 600 }
const UI_FLOOR = { tablet: 1, phone: 44 / 48, mouse: 40 / 48 }
const UI_MIN_WIDTH = 720
const EDGE = { phone: 12, large: 20 }
const PHONE_MAX = 600
const GUTTER = 32
// Controles del HUD más su base de 4: 44, el mínimo táctil (48 en teléfonos, que dibujan a 44/48).
const CONTROL = { large: 44 + 4, phone: 48 + 4 }
const CONSIGNA = { large: 56, phone: 48 }

export function useFrameFit(frame: Ref<HTMLElement | null>, probe: Ref<HTMLElement | null>, onFit: () => void, sinBandas = false) {
  const compact = ref(false)
  const phone = ref(false)
  let observer: ResizeObserver | null = null
  let coarse: MediaQueryList | null = null

  function fit() {
    const box = probe.value?.getBoundingClientRect()
    const el = frame.value
    if (!box || !el || !probe.value) return
    const style = getComputedStyle(probe.value)
    const [top, right, bottom, left] = ['Top', 'Right', 'Bottom', 'Left'].map(side => parseFloat(style.getPropertyValue(`padding-${side.toLowerCase()}`)) || 0) as [number, number, number, number]
    const side = Math.max(left, right)
    const width = box.width - 2 * side
    const height = box.height - top - bottom
    const fitScale = Math.min(width / FRAME.width, height / FRAME.height)
    const isPhone = Math.min(box.width, box.height) < PHONE_MAX
    const isCoarse = coarse?.matches ?? false
    const floor = !isCoarse ? UI_FLOOR.mouse : isPhone ? UI_FLOOR.phone : UI_FLOOR.tablet
    const scale = Math.max(fitScale, Math.min(floor, width / UI_MIN_WIDTH), 0.1)
    const normal = { bar: EDGE.large + CONTROL.large, footer: 24 + CONTROL.large + EDGE.large, edge: EDGE.large }
    const isCompact = isCoarse || height / scale - normal.bar - normal.footer < SCENE.height * 0.9
    const conBandas = isCompact
      ? (() => {
          const edge = (isPhone ? EDGE.phone : EDGE.large) / scale
          const control = isPhone ? CONTROL.phone : CONTROL.large
          return { bar: edge + control, footer: (isPhone ? 16 : 24) + control + edge, edge }
        })()
      : normal
    const bars = sinBandas ? { bar: 0, footer: 0, edge: conBandas.edge } : conBandas
    const pad = (inset: number, margin: number) => Math.max(inset / scale - margin, 0)
    const padTop = pad(top, bars.edge)
    const padBottom = pad(bottom, bars.edge)
    const padSide = pad(side, GUTTER)
    const frameWidth = box.width / scale
    const frameHeight = box.height / scale
    const consigna = isPhone && isCompact ? CONSIGNA.phone : CONSIGNA.large
    // La consigna y el tablero viajan juntos, centrados entre la barra y el pie.
    const room = frameHeight - padTop - padBottom - bars.bar - bars.footer
    const stageWidth = frameWidth - 2 * padSide
    const sceneFit = Math.min(stageWidth / SCENE.width, (room - consigna) / SCENE.height, 1)
    const spare = Math.max(room - consigna - SCENE.height * sceneFit, 0) / 2
    const root = document.documentElement.style
    const px = (value: number) => `${value.toFixed(3)}px`
    root.setProperty('--player-scale', scale.toFixed(5))
    root.setProperty('--frame-w', px(frameWidth))
    root.setProperty('--frame-h', px(frameHeight))
    root.setProperty('--safe-t', px(padTop))
    root.setProperty('--safe-b', px(padBottom))
    root.setProperty('--safe-l', px(padSide))
    root.setProperty('--safe-r', px(padSide))
    root.setProperty('--consigna-h', px(consigna))
    root.setProperty('--consigna-top', px(spare))
    root.setProperty('--scene-h', px(SCENE.height * sceneFit))
    root.setProperty('--scene-fit', sceneFit.toFixed(5))
    el.style.setProperty('--scene-top', px(spare + consigna))
    el.style.setProperty('--edge', px(bars.edge))
    compact.value = isCompact
    phone.value = isCompact && isPhone
    document.body.toggleAttribute('data-phone', phone.value)
    requestAnimationFrame(onFit)
  }

  onMounted(() => {
    coarse = matchMedia('(pointer: coarse)')
    coarse.addEventListener('change', fit)
    observer = new ResizeObserver(() => fit())
    if (probe.value) observer.observe(probe.value)
    fit()
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    coarse?.removeEventListener('change', fit)
    document.body.removeAttribute('data-phone')
    const root = document.documentElement.style
    for (const name of ['--player-scale', '--frame-w', '--frame-h', '--safe-t', '--safe-b', '--safe-l', '--safe-r', '--consigna-h', '--consigna-top', '--scene-h', '--scene-fit']) {
      root.removeProperty(name)
    }
  })

  return { compact, phone, fit }
}
