<template>
  <div ref="root" class="tap-game">
    <!-- Field with the tappable targets -->
    <div :class="['tap-field', { 'is-complete': isComplete }]">
      <div v-if="title" class="tap-field-title">{{ title }}</div>

      <div class="tap-field-grid" :style="{ gridTemplateColumns: `repeat(${columns}, 1fr)` }">
        <div
          v-for="t in shuffledTargets"
          :key="t.id"
          :class="['tap-target', t.color ? `tap-target-${t.color}` : '', {
            'is-flying': capturedIds.has(t.id),
            'is-wrong': wrongId === t.id,
            'is-faded': isComplete,
          }]"
          @click="onTap(t)"
        >
          <span v-if="t.sprite" class="tap-target-sprite"><component :is="t.sprite" v-bind="t.spriteProps" /></span>
          <span v-else class="tap-target-emoji">{{ t.emoji }}</span>
          <span v-if="t.label" class="tap-target-label">{{ t.label }}</span>
        </div>
      </div>

      <!-- Celebration overlay -->
      <div v-if="isComplete" class="tap-celebration">
        <svg class="tap-celebration-trophy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
        <div class="tap-celebration-message">{{ celebrationMessage }}</div>
        <span
          v-for="star in stars"
          :key="star.id"
          class="tap-celebration-star"
          :style="{ '--cx': star.cx, '--cy': star.cy, '--crot': star.rot, animationDelay: star.delay }"
        >★</span>
      </div>
    </div>

    <!-- Basket: slot pattern (tan, no border), one slot per correct target -->
    <div class="tap-basket">
      <div
        v-for="(slot, i) in basketSlots"
        :key="i"
        :class="['tap-basket-slot', { 'is-filled': slot !== null }]"
      >
        <span
          v-if="slot !== null"
          :class="['tap-basket-emoji', slot.color ? `tint-${slot.color}` : '']"
        ><span v-if="slot.sprite" class="tap-basket-sprite"><component :is="slot.sprite" v-bind="slot.spriteProps" /></span><template v-else>{{ slot.emoji }}</template></span>
        <span v-else class="tap-basket-mark">?</span>
      </div>
    </div>

    <!-- Flying clone (local coordinates — survives the scaled game stage) -->
    <div
      v-if="flyer"
      :class="['tap-flyer', flyer.color ? `tint-${flyer.color}` : '']"
      :style="{
        left: `${flyer.left}px`,
        top: `${flyer.top}px`,
        width: `${flyer.size}px`,
        height: `${flyer.size}px`,
      }"
    >
      <component :is="flyer.sprite" v-bind="flyer.spriteProps" v-if="flyer.sprite" class="tap-flyer-sprite" />
      <template v-else>{{ flyer.emoji }}</template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { Sounds } from '../sounds'
import type { TapBasketItem, TapFlyer, TapStar, TapTarget } from './TapField.types'

interface Props {
  targets: TapTarget[]
  title?: string
  columns?: number
  celebrationMessage?: string
  shuffled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  columns: 4,
  celebrationMessage: '¡Lo lograste!',
  shuffled: false,
})

const emit = defineEmits<{
  hit: [target: TapTarget]
  miss: [target: TapTarget]
  complete: []
}>()

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

const root = ref<HTMLElement | null>(null)
const shuffledTargets = ref<TapTarget[]>(props.shuffled ? shuffleArray(props.targets) : [...props.targets])
const capturedIds = ref(new Set<string>())
const wrongId = ref<string | null>(null)
const basketSlots = ref<(TapBasketItem | null)[]>(props.targets.filter(t => t.correct).map(() => null))
const isComplete = ref(false)
const flyer = ref<TapFlyer | null>(null)
const stars = ref<TapStar[]>([])
const timers: ReturnType<typeof setTimeout>[] = []

const totalCorrect = computed(() => props.targets.filter(t => t.correct).length)

function visualScale(el: HTMLElement): number {
  const w = el.offsetWidth
  if (!w) return 1
  return el.getBoundingClientRect().width / w
}

function onTap(target: TapTarget) {
  if (isComplete.value || capturedIds.value.has(target.id) || wrongId.value === target.id) return

  if (!target.correct) {
    wrongId.value = target.id
    Sounds.play('error')
    emit('miss', target)
    timers.push(setTimeout(() => {
      wrongId.value = null
    }, 500))
    return
  }

  captureCorrect(target)
}

function captureCorrect(target: TapTarget) {
  const rootEl = root.value
  if (!rootEl) return
  const slotIndex = basketSlots.value.findIndex(s => s === null)
  if (slotIndex < 0) return

  const targetEl = rootEl.querySelector<HTMLElement>(`.tap-target:nth-child(${shuffledTargets.value.findIndex(t => t.id === target.id) + 1})`)
  const slotEl = rootEl.querySelectorAll<HTMLElement>('.tap-basket-slot')[slotIndex]

  // Local-coordinate flight: both rects share the same scale, so dividing by
  // the root's visual scale yields stage-correct positions.
  if (targetEl && slotEl) {
    const scale = visualScale(rootEl)
    const rootRect = rootEl.getBoundingClientRect()
    const fromRect = targetEl.getBoundingClientRect()
    const toRect = slotEl.getBoundingClientRect()

    flyer.value = {
      sprite: target.sprite,
      spriteProps: target.spriteProps,
      emoji: target.emoji,
      color: target.color,
      left: (fromRect.left - rootRect.left) / scale,
      top: (fromRect.top - rootRect.top) / scale,
      size: fromRect.width / scale,
    }

    requestAnimationFrame(() => {
      if (!flyer.value) return
      const size = Math.min(toRect.width, toRect.height) / scale * 0.7
      flyer.value = {
        ...flyer.value,
        left: (toRect.left - rootRect.left) / scale + (toRect.width / scale - size) / 2,
        top: (toRect.top - rootRect.top) / scale + (toRect.height / scale - size) / 2,
        size,
      }
    })
  }

  capturedIds.value = new Set([...capturedIds.value, target.id])
  Sounds.play('pop')

  timers.push(setTimeout(() => {
    flyer.value = null
    basketSlots.value[slotIndex] = { sprite: target.sprite, spriteProps: target.spriteProps, emoji: target.emoji, color: target.color }
    emit('hit', target)

    if (capturedIds.value.size >= totalCorrect.value && !isComplete.value) {
      timers.push(setTimeout(() => {
        celebrate()
      }, 400))
    }
  }, 620))
}

function celebrate() {
  isComplete.value = true
  Sounds.play('celebrate')
  stars.value = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2
    const dist = 90 + Math.random() * 70
    return {
      id: i,
      cx: `${Math.cos(angle) * dist}px`,
      cy: `${Math.sin(angle) * dist}px`,
      rot: `${Math.random() * 720 - 360}deg`,
      delay: `${i * 40}ms`,
    }
  })
  emit('complete')
}

function shuffle() {
  shuffledTargets.value = shuffleArray(shuffledTargets.value)
  Sounds.play('tick')
}

function reset() {
  capturedIds.value = new Set()
  wrongId.value = null
  basketSlots.value = props.targets.filter(t => t.correct).map(() => null)
  isComplete.value = false
  flyer.value = null
  stars.value = []
  shuffledTargets.value = props.shuffled ? shuffleArray(props.targets) : [...props.targets]
}

onBeforeUnmount(() => timers.forEach(clearTimeout))

defineExpose({ shuffle, reset })
</script>

<style scoped>
.tap-game {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 640px;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* Field: NO container — the targets live directly on the game canvas.
   The wrapper only exists to position the celebration overlay. */
.tap-field {
  position: relative;
}

.tap-field-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 18px;
  color: var(--ink);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  text-align: center;
  margin-bottom: 16px;
  line-height: 1;
}

.tap-field.is-complete {
  animation: tap-field-complete 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes tap-field-complete {
  0% { transform: scale(1); }
  40% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.tap-field-grid {
  display: grid;
  gap: 12px;
  min-height: 180px;
}

/* Targets: white cards with ink border + flat shadow (ruleta card pattern) */
.tap-target {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 8px;
  aspect-ratio: 1 / 1;
  background: var(--card-surface);
  border: var(--card-border-width) solid var(--card-border-color);
  border-radius: 20px;
  box-shadow: 0 4px 0 var(--ink);
  cursor: pointer;
  touch-action: manipulation;
  transition:
    transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 180ms ease-out,
    opacity 300ms ease-out;
}

/* Accent tints per target — pastel cards like the DS variants (Seedle-style:
   the card color relates to its content, nothing stays plain white) */
.tap-target.tap-target-red { background: var(--red-tint); }
.tap-target.tap-target-blue { background: var(--blue-tint); }
.tap-target.tap-target-green { background: var(--green-tint); }
.tap-target.tap-target-yellow { background: var(--yellow-tint); }

.tap-target:hover:not(.is-flying):not(.is-wrong) {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 var(--ink);
}

.tap-target:active:not(.is-flying):not(.is-wrong) {
  transform: translateY(2px);
  box-shadow: 0 1px 0 var(--ink);
}

.tap-target-sprite {
  width: 58px;
  height: 58px;
  display: block;
}

.tap-flyer-sprite {
  width: 100%;
  height: 100%;
  display: block;
}

.tap-basket-sprite {
  width: 72%;
  height: 72%;
  display: block;
  margin: auto;
}

.tap-target-emoji {
  font-size: 38px;
  line-height: 1;
}

.tap-target-label {
  font-family: var(--font-body);
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 1.2px;
  color: var(--ink);
  text-align: center;
  text-transform: uppercase;
  line-height: 1.1;
}

.tap-target.is-flying {
  opacity: 0;
  pointer-events: none;
}

.tap-target.is-faded {
  opacity: 0;
  transform: scale(0.7);
  pointer-events: none;
}

.tap-target.is-wrong {
  animation: tap-target-wrong 500ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

@keyframes tap-target-wrong {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-8px) rotate(-4deg); }
  30% { transform: translateX(8px) rotate(4deg); }
  45% { transform: translateX(-6px) rotate(-3deg); }
  60% { transform: translateX(6px) rotate(3deg); }
  75% { transform: translateX(-3px); }
  90% { transform: translateX(3px); }
}

.tap-target.is-wrong::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(230, 57, 70, 0.25);
  border-radius: inherit;
  pointer-events: none;
  animation: tap-wrong-flash 400ms ease-out;
}

@keyframes tap-wrong-flash {
  0% { opacity: 0; }
  30% { opacity: 1; }
  100% { opacity: 0; }
}

/* Celebration overlay — transparent: the faded targets clear the space,
   trophy + message + stars float directly over the canvas */
.tap-celebration {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 10;
}

.tap-celebration-trophy {
  width: 72px;
  height: 72px;
  color: var(--accent-yellow-dark);
  animation: tap-trophy-bounce 800ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes tap-trophy-bounce {
  0% { opacity: 0; transform: translateY(-20px) scale(0.5) rotate(-15deg); }
  60% { opacity: 1; transform: translateY(8px) scale(1.1) rotate(5deg); }
  100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); }
}

.tap-celebration-message {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 28px;
  color: var(--ink);
  text-transform: uppercase;
  letter-spacing: 2px;
  text-align: center;
  animation: tap-message-in 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 200ms both;
}

@keyframes tap-message-in {
  0% { opacity: 0; transform: scale(0.7); }
  100% { opacity: 1; transform: scale(1); }
}

.tap-celebration-star {
  position: absolute;
  left: 50%;
  top: 50%;
  font-size: 24px;
  color: var(--accent-yellow);
  pointer-events: none;
  animation: tap-celebration-star-fly 1500ms ease-out both;
}

@keyframes tap-celebration-star-fly {
  0% { opacity: 0; transform: translate(0, 0) scale(0.3) rotate(0); }
  20% { opacity: 1; }
  100% { opacity: 0; transform: translate(var(--cx, 0px), var(--cy, 0px)) scale(1) rotate(var(--crot, 180deg)); }
}

/* Basket: slot pattern — tan background, slot marks like the ruleta "?" */
.tap-basket {
  display: flex;
  background: var(--slot-bg);
  border-radius: 24px;
  overflow: hidden;
  height: 104px;
}

.tap-basket-slot {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tap-basket-slot:not(:last-child)::after {
  content: '';
  position: absolute;
  right: -1px;
  top: 18%;
  bottom: 18%;
  width: 2px;
  background: var(--slot-mark);
  opacity: 0.6;
}

.tap-basket-mark {
  font-family: var(--font-body);
  font-weight: 900;
  font-size: 34px;
  color: var(--slot-mark);
  line-height: 1;
}

/* Captured item: white sticker badge with ink border — the "revealed card"
   pattern of the ruleta, so landing in the basket feels like a small win */
.tap-basket-emoji {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 66px;
  height: 66px;
  background: #ffffff;
  border: 3px solid var(--ink);
  border-radius: 50%;
  font-size: 34px;
  line-height: 1;
}

.tap-basket-emoji.tint-red { background: var(--red-tint); }
.tap-basket-emoji.tint-blue { background: var(--blue-tint); }
.tap-basket-emoji.tint-green { background: var(--green-tint); }
.tap-basket-emoji.tint-yellow { background: var(--yellow-tint); }

.tap-basket-slot.is-filled .tap-basket-emoji {
  animation: tap-basket-pop 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes tap-basket-pop {
  0% { transform: scale(0.5) rotate(-10deg); }
  40% { transform: scale(1.15) rotate(4deg); }
  70% { transform: scale(0.95) rotate(-2deg); }
  100% { transform: scale(1) rotate(0); }
}

/* Flying clone */
.tap-flyer {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  background: #ffffff;
  border: 3px solid var(--ink);
  border-radius: 50%;
  pointer-events: none;
  z-index: 1000;
  box-shadow: 0 4px 0 var(--ink);
  transition:
    left 600ms cubic-bezier(0.5, -0.1, 0.6, 1.2),
    top 600ms cubic-bezier(0.5, -0.1, 0.6, 1.2),
    width 600ms cubic-bezier(0.5, -0.1, 0.6, 1.2),
    height 600ms cubic-bezier(0.5, -0.1, 0.6, 1.2);
}

.tap-flyer.tint-red { background: var(--red-tint); }
.tap-flyer.tint-blue { background: var(--blue-tint); }
.tap-flyer.tint-green { background: var(--green-tint); }
.tap-flyer.tint-yellow { background: var(--yellow-tint); }
</style>
