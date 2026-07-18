// ─────────────────────────────────────────────────────────────────────────────
// Shared drag & drop registry, ported from the StoryPlay DS.
// Draggables and DropZones register here independently — no direct refs.
//
// Differences vs the DS class (intentional fixes):
// - Movement is transform-based (translate), NOT position:fixed. position:fixed
//   breaks inside the scaled 1280×800 game stage (a transformed ancestor turns
//   fixed into ancestor-relative). Transforms compose correctly.
// - Pointer deltas are divided by the current visual scale so dragging tracks
//   the cursor 1:1 inside a scaled stage.
// ─────────────────────────────────────────────────────────────────────────────

import { Sounds } from '../sounds'

export interface DragPayload {
  data: string
  label?: string
  emoji?: string
  /** Accent tint of the item (red|blue|green|yellow) — chips inherit it */
  color?: string
  /** Numeric metadata read by measurement instruments, mirroring the DS
      data-* attributes: { weight } kg, { height } cm, { temp } °C */
  meta?: Record<string, number>
}

export interface DraggableHandle {
  el: HTMLElement
  payload: DragPayload
  onPlaced: () => void
  onReturned: () => void
}

export interface ZoneHandle {
  el: HTMLElement
  canAccept: (data: string) => boolean
  accept: (payload: DragPayload) => void
  reject: () => void
  setHover: (state: 'valid' | 'invalid' | null) => void
}

const zones: ZoneHandle[] = []

export function registerZone(zone: ZoneHandle) {
  zones.push(zone)
}

export function unregisterZone(zone: ZoneHandle) {
  const i = zones.indexOf(zone)
  if (i >= 0) zones.splice(i, 1)
}

function zoneUnderPoint(x: number, y: number): ZoneHandle | null {
  // Reverse iteration: last registered = topmost in typical rendering
  for (let i = zones.length - 1; i >= 0; i--) {
    const z = zones[i]!
    const rect = z.el.getBoundingClientRect()
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return z
    }
  }
  return null
}

/** Visual scale of an element (1 outside the game stage, <1 when letterboxed) */
function visualScale(el: HTMLElement): number {
  const w = el.offsetWidth
  if (!w) return 1
  return el.getBoundingClientRect().width / w
}

/**
 * Begin dragging on pointerdown. Handles move/up listeners, zone hover
 * states, drop/reject resolution and the bounce-back animation.
 */
export function beginDrag(handle: DraggableHandle, e: PointerEvent) {
  const el = handle.el
  const scale = visualScale(el)
  const startX = e.clientX
  const startY = e.clientY

  el.classList.add('is-dragging')

  const onPointerMove = (ev: PointerEvent) => {
    const dx = (ev.clientX - startX) / scale
    const dy = (ev.clientY - startY) / scale
    el.style.transform = `translate(${dx}px, ${dy}px) scale(1.05)`

    const hovering = zoneUnderPoint(ev.clientX, ev.clientY)
    // Over a zone the item drops its bottom shadow — border only, lighter UI
    el.classList.toggle('is-over-zone', !!hovering)
    zones.forEach((z) => {
      if (z === hovering) {
        z.setHover(z.canAccept(handle.payload.data) ? 'valid' : 'invalid')
      }
      else {
        z.setHover(null)
      }
    })
  }

  const onPointerUp = (ev: PointerEvent) => {
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
    document.removeEventListener('pointercancel', onPointerUp)

    zones.forEach(z => z.setHover(null))

    const zone = zoneUnderPoint(ev.clientX, ev.clientY)

    if (zone && zone.canAccept(handle.payload.data)) {
      zone.accept(handle.payload)
      el.classList.remove('is-dragging', 'is-over-zone')
      el.style.transform = ''
      handle.onPlaced()
      return
    }

    // Bounce back to origin; invalid attempt on a zone plays the error sound (DS)
    if (zone) {
      zone.reject()
      Sounds.play('error')
    }
    el.classList.remove('is-dragging', 'is-over-zone')
    el.classList.add('is-returning')
    el.style.transform = ''
    setTimeout(() => {
      el.classList.remove('is-returning')
      handle.onReturned()
    }, 450)
  }

  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
  document.addEventListener('pointercancel', onPointerUp)
}
