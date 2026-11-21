import type { Ref } from 'vue'

// Espacio de diseño 1280 × 800 con zoom al área segura de la pantalla (PLAYER-DESIGN.md).
// Mide la pantalla con una sonda (`probe`, con los insets de env(safe-area-*)) y fija en el
// documento las variables que lee runner.css: --player-scale, --frame-w/-h, --safe-* y el encaje
// del tablero (--scene-fit, nunca mayor que 1). La consigna no ocupa fila: es la primera hoja de la escena. En el marco fija la
// altura de la barra (--bar-h: los controles flotantes a la distancia del borde) y la de la banda
// del pie (--footer-h, con el aire --footer-gap sobre sus botones, donde va su borde de nubes). `sinBarra` y `sinPie` no
// reservan su alto (la vista previa no tiene ninguno de los dos): la escena se encaja en lo que queda y el pie conserva
// su alto para la hoja de feedback. Los demás modos tienen los dos, también el dispositivo, aunque no lleve nada abajo:
// el pie es el suelo del escenario en todos (Luis, 2026-11-18).

const FRAME = { width: 1280, height: 800 }
const SCENE = { width: 1280, height: 600 }
const UI_FLOOR = { tablet: 1, phone: 44 / 48, mouse: 40 / 48 }
const UI_MIN_WIDTH = 720
const EDGE = { phone: 12, large: 20 }
const PHONE_MAX = 600
const GUTTER = 32
// Controles del HUD (44, el mínimo táctil; 48 en teléfonos) más su base de 4.
const DEPTH = 4
const CONTROL = { large: 44, phone: 48 }
// El aire del pie sobre sus botones: ahí va el borde de nubes de la banda y de la hoja del feedback.
const GAP = { large: 28, phone: 20 }

export function useFrameFit(frame: Ref<HTMLElement | null>, probe: Ref<HTMLElement | null>, onFit: () => void, { sinBarra = false, sinPie = false } = {}) {
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
    const bands = (edge: number, control: number, gap: number) => ({
      bar: edge + control + DEPTH,
      footer: gap + control + DEPTH + edge,
    })
    const normal = bands(EDGE.large, CONTROL.large, GAP.large)
    const isCompact = isCoarse || height / scale - normal.bar - normal.footer < SCENE.height * 0.9
    const usePhone = isCompact && isPhone
    const edge = isCompact ? (isPhone ? EDGE.phone : EDGE.large) / scale : EDGE.large
    const control = usePhone ? CONTROL.phone : CONTROL.large
    // Sin barra o sin pie, no ocupan nada; el pie conserva su alto para la hoja de feedback.
    const band = bands(edge, control, usePhone ? GAP.phone : GAP.large)
    const bar = sinBarra ? 0 : band.bar
    const footer = sinPie ? 0 : band.footer
    const pad = (inset: number, margin: number) => Math.max(inset / scale - margin, 0)
    const padTop = pad(top, edge)
    const padBottom = pad(bottom, edge)
    const padSide = pad(side, GUTTER)
    const frameWidth = box.width / scale
    const frameHeight = box.height / scale
    const room = frameHeight - padTop - padBottom - bar - footer
    const stageWidth = frameWidth - 2 * padSide
    const sceneFit = Math.min(stageWidth / SCENE.width, room / SCENE.height, 1)
    const spare = Math.max(room - SCENE.height * sceneFit, 0) / 2
    const root = document.documentElement.style
    const px = (value: number) => `${value.toFixed(3)}px`
    root.setProperty('--player-scale', scale.toFixed(5))
    root.setProperty('--frame-w', px(frameWidth))
    root.setProperty('--frame-h', px(frameHeight))
    root.setProperty('--safe-t', px(padTop))
    root.setProperty('--safe-b', px(padBottom))
    root.setProperty('--safe-l', px(padSide))
    root.setProperty('--safe-r', px(padSide))
    root.setProperty('--scene-h', px(SCENE.height * sceneFit))
    root.setProperty('--scene-fit', sceneFit.toFixed(5))
    el.style.setProperty('--scene-top', px(spare))
    el.style.setProperty('--edge', px(edge))
    el.style.setProperty('--bar-h', px(bar))
    el.style.setProperty('--footer-h', px(band.footer))
    el.style.setProperty('--footer-gap', px(usePhone ? GAP.phone : GAP.large))
    compact.value = isCompact
    phone.value = usePhone
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
    for (const name of ['--player-scale', '--frame-w', '--frame-h', '--safe-t', '--safe-b', '--safe-l', '--safe-r', '--scene-h', '--scene-fit']) {
      root.removeProperty(name)
    }
  })

  return { compact, phone, fit }
}
