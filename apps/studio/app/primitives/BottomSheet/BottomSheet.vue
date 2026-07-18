<template>
  <!-- DS BottomSheet (Duolingo-style completion/control sheet). NON-modal:
       no overlay, the scene stays visible and interactive — feedback is the
       point, never cover it. Spans the FULL viewport width with no side or
       bottom margins and square corners; only the 3px ink top border marks it.
       Lives OUTSIDE the stage (teleport) like the Modal, but its content is a
       1280px logical row scaled with the play stage so it lines up with the
       top HUD's 24px lateral alignment. -->
  <Teleport to="body">
    <div
      :class="['sp-sheet', `sp-sheet-${variant}`, { show: open }]"
      :style="{ height: `${height * playScale + 3}px` }"
    >
      <div
        class="sp-sheet-stage"
        :style="{ transform: `translateX(-50%) scale(${playScale})`, height: `${height}px` }"
      >
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { inject, ref, watch, type Ref } from 'vue'
import { Sounds } from '../sounds'
import type { BottomSheetProps } from './BottomSheet.types'

const props = withDefaults(defineProps<BottomSheetProps>(), {
  height: 112,
  variant: 'default',
})

// Stage scale from the play layout; 1 outside the game runtime
const playScale = inject<Ref<number>>('playScale', ref(1))

watch(() => props.open, (open) => {
  // Slide-in cue only — the sheet NEVER auto-speaks (the scene's own
  // feedback owns the audio moment)
  if (open) Sounds.play('whoosh')
})
</script>

<style>
/* Unscoped (teleported to <body>), names prefixed sp-sheet- per the style
   isolation rule. */

.sp-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  border-top: 3px solid var(--ink);
  /* Below the modals (overlay 100 / card 200): exit confirmation and the
     end-of-workshop summary must cover the sheet */
  z-index: 95;
  transform: translateY(105%);
  /* height and background also animate: the strip resizes and re-tints when
     its content swaps (knowledge card ↔ completion ↔ teacher panel) */
  transition: transform 480ms cubic-bezier(0.34, 1.2, 0.64, 1), height 300ms ease, background 300ms ease;
}

.sp-sheet.show {
  transform: translateY(0);
}

/* Celebration tint: GREEN — the universal standard for success/positive
   completion. Background transitions so a knowledge→completion swap reads
   as a change of THING (the knowledge card stays white). */
.sp-sheet-celebrate {
  background: var(--green-tint);
}

/* Logical 1280px row scaled like the play stage so the content's lateral
   padding matches the top HUD (24px at stage scale) */
.sp-sheet-stage {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 1280px;
  padding: 0 24px;
  transform-origin: bottom center;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  font-family: var(--font-body);
  color: var(--ink);
  transition: height 300ms ease;
}
</style>
