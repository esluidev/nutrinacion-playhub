import { setSetting, settings } from './settings'
import type { Setting } from './settings'
import { onSound, playSound, SOUNDS } from './sound'
import { onFrame } from './ticker'

// ---- El medidor del motor: lo que pasa en el dispositivo, en números y sobre la pantalla (`?medir=1`). Cada segundo:
//   - cuadros por segundo y qué parte se perdió (los cuadros que el dispositivo no llegó a pintar a tiempo);
//   - el cuadro más largo del segundo y el peor de la sesión;
//   - cuánto tarda un toque en llegar al siguiente cuadro (lo que la pieza va por detrás del dedo dentro del navegador);
//   - cuántas veces el código tuvo ocupado al navegador más de 50 ms (solo en Chrome).
// Y un botón para comparar en la misma tableta con y sin la vibración. Mide mientras está en pantalla, también con
// todo quieto; sin `?medir=1` no se carga. ----

const LABELS: Record<Setting, string> = { haptics: 'Vibración' }

export function startMeter(): () => void {
  const panel = document.createElement('div')
  panel.className = 'player-meter'
  const readout = document.createElement('pre')
  readout.textContent = 'midiendo…'
  panel.append(readout)
  for (const name of Object.keys(LABELS) as Setting[]) {
    const button = document.createElement('button')
    button.type = 'button'
    const label = () => { button.textContent = `${LABELS[name]}: ${settings[name] ? 'sí' : 'no'}` }
    button.addEventListener('click', () => { setSetting(name, !settings[name]); label() })
    label()
    panel.append(button)
  }
  document.body.append(panel)

  let frames: number[] = []
  let delays: number[] = []
  let pending = 0
  let blocks = 0
  let blockMs = 0
  let worstFrame = 0
  let worstDelay = 0
  let since = performance.now()

  // El primer toque que espera cuadro: de ahí al siguiente cuadro es lo que tarda en verse.
  const onPointer = (event: PointerEvent) => { if (!pending) pending = event.timeStamp }
  window.addEventListener('pointerdown', onPointer, { capture: true, passive: true })
  window.addEventListener('pointermove', onPointer, { capture: true, passive: true })

  let observer: PerformanceObserver | undefined
  try {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) { blocks += 1; blockMs = Math.max(blockMs, entry.duration) }
    })
    observer.observe({ type: 'long-animation-frame' })
  }
  catch { observer = undefined /* el navegador no lo mide */ }

  const round = (value: number) => Math.round(value)
  function show(elapsed: number) {
    if (!frames.length) return
    // Lo que dura un cuadro en esta pantalla: los más cortos del segundo. Los que duran varios, perdieron cuadros.
    const sorted = [...frames].sort((a, b) => a - b)
    const base = Math.min(Math.max(sorted[Math.floor(sorted.length / 4)]!, 4), 34)
    const lost = frames.reduce((sum, ms) => sum + Math.max(Math.round(ms / base) - 1, 0), 0)
    const longest = sorted.at(-1)!
    worstFrame = Math.max(worstFrame, longest)
    const top = [
      `${round(frames.length / (elapsed / 1000))} cuadros/s`,
      `${round(lost / (frames.length + lost) * 100)} % perdidos`,
      `más largo ${round(longest)} ms (sesión ${round(worstFrame)})`,
    ]
    let touch = 'toque a cuadro —'
    if (delays.length) {
      worstDelay = Math.max(worstDelay, ...delays)
      touch = `toque a cuadro ${round(delays.reduce((sum, ms) => sum + ms, 0) / delays.length)} ms`
    }
    const bottom = [worstDelay ? `${touch} (peor ${round(worstDelay)})` : touch]
    if (observer) bottom.push(`bloqueos ${blocks}${blocks ? ` (hasta ${round(blockMs)} ms)` : ''}`)
    readout.textContent = `${top.join(' · ')}\n${bottom.join(' · ')}`
  }

  let first = true
  const stopFrames = onFrame((dt, now) => {
    // El primer cuadro trae el tiempo desde que se pidió, no el de un cuadro.
    if (first) { first = false; since = now; pending = 0; return }
    frames.push(dt * 1000)
    if (pending) { delays.push(Math.max(now - pending, 0)); pending = 0 }
    if (now - since < 1000) return
    show(now - since)
    since = now
    frames = []
    delays = []
  })

  return () => {
    stopFrames()
    observer?.disconnect()
    window.removeEventListener('pointerdown', onPointer, { capture: true })
    window.removeEventListener('pointermove', onPointer, { capture: true })
    panel.remove()
  }
}

// ---- El panel de sonidos (`?sonidos=1`): para juzgar de oído. Un botón por cada sonido del motor, para oírlo suelto,
// y el nombre del último que sonó mientras se juega: así se puede decir cuál no gusta por su nombre. ----
export function startSoundboard(): () => void {
  const panel = document.createElement('div')
  panel.className = 'player-sounds'
  const last = document.createElement('pre')
  last.textContent = 'sonó: —'
  panel.append(last)
  for (const name of Object.keys(SOUNDS)) {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = name
    button.addEventListener('click', () => playSound(name))
    panel.append(button)
  }
  document.body.append(panel)
  const off = onSound((name) => { last.textContent = `sonó: ${name}` })
  return () => {
    off()
    panel.remove()
  }
}
