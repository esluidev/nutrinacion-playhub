<template>
  <TransitionGroup
    tag="div"
    name="reorder"
    :class="[
      'reorder-list',
      color !== 'default' ? `reorder-list-${color}` : '',
      { 'is-complete': showComplete, 'is-drag-active': draggedId !== null },
    ]"
  >
    <div
      v-for="(id, index) in order"
      :key="id"
      :data-id="id"
      :class="[
        'reorder-item',
        {
          'is-dragging': draggedId === id,
          'is-shifting': draggedId !== null && draggedId !== id,
          'is-correct': isCorrect(id, index),
          'is-readonly': mode === 'readonly',
        },
      ]"
      :style="rowStyle(id)"
      @pointerdown="onPointerDown($event, id, index)"
    >
      <div class="reorder-item-number">{{ index + 1 }}</div>
      <span v-if="itemById(id)?.sprite" class="reorder-item-sprite"><component :is="itemById(id)!.sprite" v-bind="itemById(id)?.spriteProps" /></span>
      <span v-else-if="itemById(id)?.emoji" class="reorder-item-emoji">{{ itemById(id)?.emoji }}</span>
      <div class="reorder-item-label">{{ itemById(id)?.label }}</div>
      <div class="reorder-item-handle">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M4 8h16M4 16h16" />
        </svg>
      </div>
    </div>
  </TransitionGroup>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Sounds } from '../sounds'
import type { ReorderColor, ReorderItem, ReorderMode } from './ReorderList.types'

interface Props {
  items: ReorderItem[]
  correctOrder?: string[]
  mode?: ReorderMode
  shuffled?: boolean
  color?: ReorderColor
}

const props = withDefaults(defineProps<Props>(), {
  correctOrder: undefined,
  mode: 'freeform',
  shuffled: false,
  color: 'default',
})

const emit = defineEmits<{
  reorder: [order: string[]]
  complete: []
}>()

function shuffleArray(arr: string[]): string[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

const initialIds = props.items.map(it => it.id)
const order = ref<string[]>(props.shuffled ? shuffleArray(initialIds) : [...initialIds])

const draggedId = ref<string | null>(null)
const draggedOffset = ref(0)
const shifts = ref<Record<string, number>>({})
const showComplete = ref(false)
let completeFired = props.mode === 'validate' && isAllCorrect()
let completeTimer: ReturnType<typeof setTimeout> | null = null

function itemById(id: string): ReorderItem | undefined {
  return props.items.find(it => it.id === id)
}

function isCorrect(id: string, index: number): boolean {
  if (props.mode !== 'validate' || !props.correctOrder) return false
  return props.correctOrder[index] === id
}

function isAllCorrect(): boolean {
  if (props.mode !== 'validate' || !props.correctOrder) return false
  return order.value.every((id, i) => props.correctOrder![i] === id)
}

function rowStyle(id: string) {
  if (draggedId.value === id) {
    return { transform: `translateY(${draggedOffset.value}px) scale(1.02) rotate(-1deg)` }
  }
  const shift = shifts.value[id]
  return shift ? { transform: `translateY(${shift}px)` } : undefined
}

/* ── Drag to reorder ─────────────────────────────────────────────────────────
   Transform-based: the dragged row follows the pointer (scale-compensated for
   the 1280×800 game stage), siblings shift via translateY, and on drop the
   order array updates — Vue's TransitionGroup FLIP animates the settle. */

interface DragState {
  startIndex: number
  currentIndex: number
  startClientY: number
  scale: number
  strideLocal: number
  count: number
}

let drag: DragState | null = null

function onPointerDown(e: PointerEvent, id: string, index: number) {
  if (props.mode === 'readonly' || draggedId.value) return
  e.preventDefault()

  const rowEl = (e.currentTarget as HTMLElement)
  const listEl = rowEl.parentElement!
  const rows = Array.from(listEl.querySelectorAll<HTMLElement>('.reorder-item'))

  // Visual scale measured on the LIST (never transformed), so a FLIP animation
  // in flight on the rows can't corrupt the measurement
  const scale = listEl.offsetWidth ? listEl.getBoundingClientRect().width / listEl.offsetWidth : 1

  // Stride from offsetTop: layout positions ignore transforms entirely —
  // grabbing a row mid-FLIP no longer yields a corrupt stride (erratic jumps)
  const strideLocal = rows.length > 1
    ? rows[1]!.offsetTop - rows[0]!.offsetTop
    : rowEl.offsetHeight + 8

  drag = {
    startIndex: index,
    currentIndex: index,
    startClientY: e.clientY,
    scale,
    strideLocal,
    count: order.value.length,
  }

  draggedId.value = id
  draggedOffset.value = 0
  shifts.value = {}

  const onMove = (ev: PointerEvent) => {
    if (!drag) return
    const deltaLocal = (ev.clientY - drag.startClientY) / drag.scale
    draggedOffset.value = deltaLocal

    // Hysteresis (±0.1 stride around the midpoint): the target index only
    // switches after clearly crossing it, killing jitter at the boundary
    const rawFloat = drag.startIndex + deltaLocal / drag.strideLocal
    if (Math.abs(rawFloat - drag.currentIndex) > 0.6) {
      const targetIndex = Math.max(0, Math.min(drag.count - 1, Math.round(rawFloat)))
      if (targetIndex !== drag.currentIndex) {
        drag.currentIndex = targetIndex
        applyShifts(drag.startIndex, targetIndex, drag.strideLocal)
      }
    }
  }

  const onUp = () => {
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
    document.removeEventListener('pointercancel', onUp)
    if (!drag) return

    const { startIndex, currentIndex } = drag
    drag = null

    // Clear transforms and reorder in the same patch: TransitionGroup's FLIP
    // measures the pre-update (shifted) positions and animates the settle.
    draggedId.value = null
    draggedOffset.value = 0
    shifts.value = {}

    if (currentIndex !== startIndex) {
      const next = [...order.value]
      const [moved] = next.splice(startIndex, 1)
      next.splice(currentIndex, 0, moved!)
      order.value = next
      Sounds.play('tick')
      emit('reorder', [...next])
      validate()
    }
  }

  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp)
  document.addEventListener('pointercancel', onUp)
}

function applyShifts(startIndex: number, targetIndex: number, stride: number) {
  const next: Record<string, number> = {}
  order.value.forEach((id, i) => {
    if (i === startIndex) return
    if (targetIndex < startIndex && i >= targetIndex && i < startIndex) {
      next[id] = stride // dragged row moves up → these shift down
    }
    else if (targetIndex > startIndex && i > startIndex && i <= targetIndex) {
      next[id] = -stride // dragged row moves down → these shift up
    }
  })
  shifts.value = next
}

function validate() {
  if (props.mode !== 'validate' || !props.correctOrder) return
  if (isAllCorrect()) {
    if (!completeFired) {
      completeFired = true
      showComplete.value = true
      Sounds.play('celebrate')
      emit('complete')
      if (completeTimer) clearTimeout(completeTimer)
      completeTimer = setTimeout(() => {
        showComplete.value = false
      }, 900)
    }
  }
  else {
    completeFired = false
  }
}

function shuffle() {
  order.value = shuffleArray(order.value)
  completeFired = false
  validate()
}

function reset() {
  order.value = props.items.map(it => it.id)
  completeFired = false
  validate()
}

function getOrder(): string[] {
  return [...order.value]
}

defineExpose({ shuffle, reset, getOrder })
</script>

<style scoped>
/* Rows reuse the shared card surface (--card-* tokens): white, ink border, and
   NO shadow at rest — like the other cards, the shadow appears only on
   interaction (hover / dragging). Color variants tint the row + number badge. */
.reorder-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 440px;
}

.reorder-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 64px;
  padding: 0 16px;
  background: var(--card-surface);
  border: var(--card-border-width) solid var(--card-border-color);
  border-radius: 18px; /* radio propio de la fila (más baja que una card) */
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    background 180ms ease-out;
  --row-number-bg: var(--accent-yellow-dark);
}

/* Color variants tint the row background (pastel) + the number badge accent */
.reorder-list-red .reorder-item { --row-number-bg: var(--accent-red-dark); background: var(--red-tint); }
.reorder-list-blue .reorder-item { --row-number-bg: var(--accent-blue-dark); background: var(--blue-tint); }
.reorder-list-green .reorder-item { --row-number-bg: var(--accent-green-dark); background: var(--green-tint); }
.reorder-list-yellow .reorder-item { --row-number-bg: var(--accent-yellow-dark); background: var(--yellow-tint); }

.reorder-item.is-readonly {
  cursor: default;
}

.reorder-item:hover:not(.is-readonly):not(.is-dragging) {
  box-shadow: var(--card-shadow-hover);
}

.reorder-item:active:not(.is-readonly) {
  cursor: grabbing;
}

.reorder-item.is-dragging {
  cursor: grabbing;
  z-index: 100;
  box-shadow: var(--card-shadow-hover);
}

.reorder-item.is-shifting {
  transition: transform 250ms cubic-bezier(0.25, 0.8, 0.4, 1);
}

/* Vue TransitionGroup FLIP: rows slide to their new slot on reorder.
   Suppressed while a drag is active — a running FLIP must never fight
   the drag transforms (source of erratic jumps). */
.reorder-move {
  transition: transform 300ms cubic-bezier(0.25, 0.8, 0.4, 1);
}

.reorder-list.is-drag-active .reorder-move {
  transition: none;
}

.reorder-item-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--row-number-bg);
  color: #fff;
  border-radius: 50%;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
  transition: background 200ms ease-out;
}

.reorder-item.is-correct {
  background: var(--green-tint);
}

.reorder-item.is-correct .reorder-item-number {
  background: var(--accent-green-dark);
}

.reorder-item-sprite {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: block;
}

.reorder-item-emoji {
  font-size: 26px;
  line-height: 1;
  flex-shrink: 0;
}

.reorder-item-label {
  flex: 1;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 16px;
  color: var(--ink);
  line-height: 1.2;
}

.reorder-item-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--ink-soft);
  flex-shrink: 0;
  opacity: 0.6;
  transition: opacity 180ms ease-out;
}

.reorder-item-handle svg {
  width: 22px;
  height: 22px;
}

.reorder-item:hover .reorder-item-handle {
  opacity: 1;
}

/* Complete celebration: staggered bounce */
.reorder-list.is-complete .reorder-item {
  animation: reorder-complete-bounce 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.reorder-list.is-complete .reorder-item:nth-child(2) { animation-delay: 60ms; }
.reorder-list.is-complete .reorder-item:nth-child(3) { animation-delay: 120ms; }
.reorder-list.is-complete .reorder-item:nth-child(4) { animation-delay: 180ms; }
.reorder-list.is-complete .reorder-item:nth-child(5) { animation-delay: 240ms; }
.reorder-list.is-complete .reorder-item:nth-child(6) { animation-delay: 300ms; }

@keyframes reorder-complete-bounce {
  0% { transform: scale(1); }
  40% { transform: scale(1.04); }
  100% { transform: scale(1); }
}
</style>
