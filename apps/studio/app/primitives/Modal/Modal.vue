<template>
  <!-- DS Modal (based on the ruleta popup). Lives OUTSIDE the stage:
       full-viewport overlay + its own scaler synced with the play stage
       (spec §3). Works unscaled too (playground/chrome): scale falls back to 1. -->
  <Teleport to="body">
    <div :class="['sp-modal-overlay', { show: open }]" @click="onOverlayClick" />

    <div class="sp-modal-scaler">
      <div class="sp-modal-stage" :style="{ transform: `scale(${playScale})` }">
        <div :class="['sp-modal-wrapper', { show: open }]">
          <div
            v-if="open"
            :class="['sp-modal', `sp-modal-size-${size}`, variant !== 'default' ? `sp-modal-${variant}` : '']"
          >
            <!-- Header: eyebrow + subtle accent dot (the only variant cue) -->
            <div class="sp-modal-header">
              <span class="sp-modal-eyebrow">{{ eyebrow }}</span>
              <span v-if="variant !== 'default'" class="sp-modal-accent" />
            </div>

            <!-- Body -->
            <div class="sp-modal-body">
              <slot />
            </div>

            <!-- Footer: audio (left, when audioText) + actions (right) -->
            <div v-if="audioText || $slots.footer" class="sp-modal-footer">
              <button
                v-if="audioText"
                :class="['sp-modal-audio', { speaking }]"
                :aria-label="audioLabel"
                @click="speakAudio"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              </button>
              <div v-if="$slots.footer" class="sp-modal-actions">
                <slot name="footer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { inject, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { useNarrator } from '~/composables/useNarrator'
import { cancelNarration } from '../narration'
import { Sounds } from '../sounds'
import type { ModalSize, ModalVariant } from './Modal.types'

interface Props {
  open: boolean
  eyebrow: string
  variant?: ModalVariant
  size?: ModalSize
  audioText?: string
  /** aria-label of the audio button. Default Spanish; pass a localized label
      when the modal is part of the game runner (served in the game's locale). */
  audioLabel?: string
  autoSpeak?: boolean
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  audioText: undefined,
  audioLabel: 'Escuchar',
  autoSpeak: false,
  closeOnOverlay: true,
})

const emit = defineEmits<{
  close: []
}>()

// Stage scale from the play layout; 1 outside the game runtime
const playScale = inject<Ref<number>>('playScale', ref(1))

// Plays the matching pre-recorded wav (shared runner namespace) inside the
// runner; Web Speech fallback outside it / when no audio exists.
const narrate = useNarrator()
const speaking = ref(false)

function speakAudio() {
  if (!props.audioText) return
  narrate(props.audioText, s => (speaking.value = s))
}

function onOverlayClick() {
  if (props.closeOnOverlay) close()
}

function close() {
  cancelNarration()
  speaking.value = false
  emit('close')
}

watch(() => props.open, (open) => {
  if (open) {
    Sounds.play('pop')
    if (props.autoSpeak && props.audioText) {
      setTimeout(() => speakAudio(), 350)
    }
  }
  else {
    cancelNarration()
    speaking.value = false
  }
})

onBeforeUnmount(() => cancelNarration())
</script>

<style>
/* Unscoped (teleported to <body>), names prefixed sp-modal-* per the style
   isolation rule. Structure and values verbatim from the DS MODAL section. */

.sp-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(45, 49, 66, 0.55);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
  z-index: 100;
}

.sp-modal-overlay.show {
  opacity: 1;
  pointer-events: auto;
}

.sp-modal-scaler {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 200;
}

.sp-modal-stage {
  width: 1280px;
  height: 800px;
  position: relative;
  transform-origin: center center;
  flex-shrink: 0;
  pointer-events: none;
}

.sp-modal-wrapper {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.sp-modal-wrapper.show {
  pointer-events: auto;
  opacity: 1;
}

/* The card (DS .modal) */
.sp-modal {
  position: relative;
  background: #ffffff;
  border: 3px solid var(--ink);
  border-radius: 28px;
  box-shadow: 0 5px 0 var(--ink);
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
  font-family: var(--font-body);
  color: var(--ink);
  animation: sp-modal-bounce 0.6s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
}

@keyframes sp-modal-bounce {
  0% { transform: scale(0) rotate(-8deg); opacity: 0; }
  40% { transform: scale(1.08) rotate(2deg); opacity: 1; }
  60% { transform: scale(0.96) rotate(-1deg); }
  80% { transform: scale(1.02) rotate(0.5deg); }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}

.sp-modal-size-sm { max-width: 360px; }
.sp-modal-size-md { max-width: 460px; }
.sp-modal-size-lg { max-width: 560px; }

/* Header */
.sp-modal-header {
  border-bottom: 2px solid #ececec;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.sp-modal-eyebrow {
  font-family: var(--font-body);
  font-weight: 900;
  font-size: 16px;
  letter-spacing: 2.5px;
  color: #b0a89a;
  text-transform: uppercase;
}

/* Subtle accent dot — the only visual cue of the variant */
.sp-modal-accent {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #b0a89a;
  flex-shrink: 0;
}

/* Body */
.sp-modal-body {
  padding: 28px 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.sp-modal-asset {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80px;
  line-height: 1;
}

.sp-modal-title {
  font-family: var(--font-body);
  font-weight: 900;
  font-size: 22px;
  color: var(--ink);
  margin: 0;
  line-height: 1.2;
}

.sp-modal-text {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 15px;
  color: var(--ink);
  line-height: 1.45;
  margin: 0;
}

.sp-modal-text .hl {
  font-weight: 900;
}

/* Footer */
.sp-modal-footer {
  border-top: 2px solid #ececec;
  padding: 14px 22px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.sp-modal-footer:has(> :nth-child(2)) {
  justify-content: space-between;
}

.sp-modal-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Secondary audio button (ruleta modal-btn-secondary) */
.sp-modal-audio {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 3px solid var(--ink);
  background: #dde8f0;
  color: var(--ink);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px var(--ink);
  transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.2s ease;
  padding: 0;
  flex-shrink: 0;
}

.sp-modal-audio svg {
  width: 24px;
  height: 24px;
}

.sp-modal-audio:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px var(--ink);
}

.sp-modal-audio:active {
  transform: translateY(2px);
  box-shadow: 0 1px var(--ink);
}

.sp-modal-audio.speaking {
  background: #b8d4e6;
  animation: sp-modal-speak-pulse 0.5s ease-in-out infinite;
}

@keyframes sp-modal-speak-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

/* Variant accents (eyebrow + dot only — bg never changes, DS rule) */
.sp-modal-info .sp-modal-eyebrow { color: var(--info); }
.sp-modal-info .sp-modal-accent { background: var(--info); }

.sp-modal-success .sp-modal-eyebrow { color: var(--success); }
.sp-modal-success .sp-modal-accent { background: var(--success); }

.sp-modal-warning .sp-modal-eyebrow { color: var(--warning); }
.sp-modal-warning .sp-modal-accent { background: var(--warning); }

.sp-modal-danger .sp-modal-eyebrow { color: var(--danger); }
.sp-modal-danger .sp-modal-accent { background: var(--danger); }
</style>
