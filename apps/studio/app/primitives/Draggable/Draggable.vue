<template>
  <div
    ref="root"
    :class="[
      'draggable',
      color !== 'default' ? `draggable-${color}` : '',
      { 'is-placed': isPlaced },
    ]"
    @pointerdown="onPointerDown"
  >
    <div class="draggable-art">
      <slot>
        <span v-if="emoji" class="draggable-emoji">{{ emoji }}</span>
      </slot>
    </div>
    <div v-if="label" class="draggable-label">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { beginDrag } from '../dragdrop/registry'
import type { DraggableColor } from './Draggable.types'

interface Props {
  data: string
  label?: string
  emoji?: string
  color?: DraggableColor
  disabled?: boolean
  /** Numeric metadata for measurement instruments ({ weight }, { height }, { temp }) */
  meta?: Record<string, number>
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  emoji: undefined,
  color: 'default',
  disabled: false,
  meta: undefined,
})

const emit = defineEmits<{
  dragstart: [data: string]
  placed: [data: string]
  returned: [data: string]
}>()

const root = ref<HTMLElement | null>(null)
const isPlaced = ref(false)

function onPointerDown(e: PointerEvent) {
  if (props.disabled || isPlaced.value || !root.value) return
  e.preventDefault()
  emit('dragstart', props.data)
  beginDrag({
    el: root.value,
    payload: {
      data: props.data,
      label: props.label,
      emoji: props.emoji,
      color: props.color !== 'default' ? props.color : undefined,
      meta: props.meta,
    },
    onPlaced: () => {
      isPlaced.value = true
      emit('placed', props.data)
    },
    onReturned: () => emit('returned', props.data),
  }, e)
}

function reset() {
  isPlaced.value = false
}

defineExpose({ reset, isPlaced })
</script>

<style scoped>
/* Card visual from the DS, on the game palette: white card, 4px ink border.
   At rest it's border-only (like the reveal cards) — the flat offset shadow
   appears ONLY on interaction (hover/drag) as the "grabbable" cue, and stays
   the SAME size in both states via --drag-shadow. Pastel tints per variant. */
.draggable {
  /* Sombra de interacción tomada de la escala del DS (escala con --card-shadow*) */
  --drag-shadow: var(--card-shadow-hover);
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 108px;
  min-height: 124px;
  padding: 8px 8px 11px;
  background: var(--card-surface);
  border: var(--card-border-width) solid var(--card-border-color);
  border-radius: 22px;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 150ms ease-out;
}

/* La identidad de color tiñe el PAD del arte, no toda la tarjeta: la
   superficie queda blanca (jerarquía limpia: tarjeta > pad > sprite) */
.draggable-art {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  min-width: 88px;
  min-height: 88px;
  padding: 10px;
  border-radius: 18px;
  background: var(--canvas);
}

.draggable.draggable-red .draggable-art { background: var(--red-tint); }
.draggable.draggable-blue .draggable-art { background: var(--blue-tint); }
.draggable.draggable-green .draggable-art { background: var(--green-tint); }
.draggable.draggable-yellow .draggable-art { background: var(--yellow-tint); }

.draggable:hover {
  transform: translateY(-1px);
  box-shadow: var(--drag-shadow);
}

.draggable:active {
  cursor: grabbing;
  transform: scale(0.97);
}

/* Levantada: CRECE y se ladea un pelo — en tablet no hay hover, esta es la
   confirmación física de "lo tengo en la mano" para el niño */
.draggable.is-dragging {
  cursor: grabbing;
  box-shadow: var(--drag-shadow);
  z-index: 100;
  opacity: 0.95;
  transform: scale(1.08) rotate(-2deg);
  transition: box-shadow 150ms ease-out, transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Hovering over a drop zone: shadow off, border only — lighter while aiming */
.draggable.is-dragging.is-over-zone {
  box-shadow: none;
}

.draggable.is-returning {
  transition:
    transform 450ms cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 200ms ease-out;
  animation: draggable-reject-wobble 450ms ease-out;
}

@keyframes draggable-reject-wobble {
  0% { transform: scale(1.05) rotate(0); }
  30% { transform: scale(1.02) rotate(-8deg); }
  60% { transform: scale(1) rotate(6deg); }
  85% { transform: scale(1) rotate(-2deg); }
  100% { transform: scale(1) rotate(0); }
}

.draggable.is-placed {
  pointer-events: none;
  opacity: 0.45;
  filter: saturate(0.6);
}

.draggable-emoji {
  font-size: 40px;
  line-height: 1;
}

.draggable-label {
  font-family: var(--font-body);
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 1.5px;
  color: var(--ink);
  text-align: center;
  text-transform: uppercase;
  line-height: 1.1;
}
</style>
