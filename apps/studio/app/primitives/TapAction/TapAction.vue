<template>
  <!-- DS TapAction: a PHYSICAL action done by tapping N times (crack an egg,
       whisk a bowl, knead dough…). Wraps the scene's art in the default slot
       (exposes `count` so the art can show progressive states), wiggles on
       each tap and fills progress pips underneath. -->
  <div class="tap-action-wrap">
    <button
      :class="['tap-action', { 'is-tapping': isTapping, 'is-complete': isComplete }]"
      :disabled="disabled || isComplete"
      @click="onTap"
    >
      <slot :count="count" :remaining="taps - count" />
    </button>
    <div class="tap-action-pips" aria-hidden="true">
      <span
        v-for="n in taps"
        :key="n"
        :class="['tap-action-pip', { 'is-filled': n <= count }]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { Sounds } from '../sounds'
import type { TapActionProps } from './TapAction.types'

const props = withDefaults(defineProps<TapActionProps>(), {
  disabled: false,
})

const emit = defineEmits<{
  tap: [count: number]
  complete: []
}>()

const count = ref(0)
const isTapping = ref(false)
const isComplete = computed(() => count.value >= props.taps)
let wiggleTimer: ReturnType<typeof setTimeout> | null = null

function onTap() {
  if (props.disabled || isComplete.value) return
  count.value++
  Sounds.play('tick')

  // Retrigger the wiggle cleanly on every tap
  isTapping.value = false
  requestAnimationFrame(() => {
    isTapping.value = true
  })
  if (wiggleTimer) clearTimeout(wiggleTimer)
  wiggleTimer = setTimeout(() => {
    isTapping.value = false
  }, 260)

  emit('tap', count.value)
  if (isComplete.value) emit('complete')
}

function reset() {
  count.value = 0
}

onBeforeUnmount(() => {
  if (wiggleTimer) clearTimeout(wiggleTimer)
})

defineExpose({ reset, count })
</script>

<style scoped>
.tap-action-wrap {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* Bare button: the slotted art IS the visual — no chrome of its own */
.tap-action {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.tap-action:disabled {
  cursor: default;
}

.tap-action.is-tapping {
  animation: tap-action-wiggle 260ms ease-out;
}

@keyframes tap-action-wiggle {
  0% { transform: scale(1) rotate(0); }
  35% { transform: scale(1.08) rotate(-5deg); }
  70% { transform: scale(0.98) rotate(4deg); }
  100% { transform: scale(1) rotate(0); }
}

/* Progress pips: how many taps remain */
.tap-action-pips {
  display: flex;
  gap: 6px;
}

.tap-action-pip {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid var(--ink);
  transition: background 180ms ease;
}

.tap-action-pip.is-filled {
  background: var(--accent-yellow);
}
</style>
