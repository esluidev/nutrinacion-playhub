<template>
  <!-- Full-screen game runtime — no sidebar or header. The whole viewport is
       canvas-colored (the letterbox never shows) and the 1280×800 logical
       stage scales to fit, exactly like ruleta-frijoles v2.
       Position is DETERMINISTIC: translate+scale computed together in
       updateScale (origin top-left). Flex-centering an unscaled 1280×800 box
       clipped it inconsistently whenever the viewport was smaller than the
       stage (resize, sheet open on 16:10 screens). -->
  <div class="play-layout">
    <div class="play-stage" :style="{ transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})` }">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
// Fixed logical viewport: games are designed at width=1280 — NEVER
// device-width (anti-zoom rule #1 of the StoryPlay spec). Educators'
// WebView sets the same when embedding.
useHead({
  meta: [
    { name: 'viewport', content: 'width=1280, initial-scale=1.0' },
  ],
})

const STAGE_W = 1280
const STAGE_H = 800
// Entry breathing room: with no sheet open the stage renders a touch smaller
// than a full fit, so scenes don't feel oversized on load. The BottomSheet
// rescale (updateScale, below) is deliberately EXEMPT — it must fit the reduced
// area exactly, unchanged.
const BASE_ZOOM = 0.96

const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)

// Modals live OUTSIDE the stage (spec §3): scenes Teleport them to <body>
// and scale their own modal-stage with this value
provide('playScale', scale)

// Logical height (stage px) the BottomSheet occupies while open. The runner
// sets it so the stage rescales and recenters in the REMAINING area — the
// sheet must never sit on top of playable scene content.
const sheetInset = ref(0)
provide('playSheetInset', sheetInset)

function updateScale() {
  if (!import.meta.client) return
  const sx = window.innerWidth / STAGE_W
  // The open sheet extends the logical canvas (+3 unscaled px for its ink
  // top border): stage + sheet always fit whole
  const available = window.innerHeight - (sheetInset.value ? 3 : 0)
  const sy = available / (STAGE_H + sheetInset.value)
  // Math.min: the game always fits whole (letterbox, never cropped)
  const fit = Math.min(sx, sy)
  // No sheet → shrink a hair for breathing room. Sheet open → use the exact fit
  // so the sheet's rescale stays untouched.
  const s = sheetInset.value ? fit : fit * BASE_ZOOM
  scale.value = s
  // Real px the sheet occupies at the bottom (scaled content + 3px ink border)
  const sheetPx = sheetInset.value ? sheetInset.value * s + 3 : 0
  // Center the SCALED stage in the remaining area — no flex involved, so the
  // position is exact even when the unscaled box exceeds the viewport
  offsetX.value = (window.innerWidth - STAGE_W * s) / 2
  offsetY.value = (window.innerHeight - sheetPx - STAGE_H * s) / 2
}

watch(sheetInset, updateScale)

const route = useRoute()

function exitPlay() {
  const { category, id } = route.params
  if (category && id) {
    return navigateTo(`/storyboards/${category}/${id}`)
  }
  return navigateTo('/storyboards')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') exitPlay()
}

// Touch blockers that CSS can't cover:
// - gesturestart/change: iOS Safari pinch-zoom ignores touch-action
// - contextmenu: long-press menu on Android (iOS handled by touch-callout)
// - dblclick: residual double-click selection/zoom on some WebViews
const preventDefault = (e: Event) => e.preventDefault()

// Chromium delivers trackpad pinch AND smart zoom (two-finger double tap,
// reads as a "right double click") as ctrl+wheel — the last page-zoom
// vector the game can block (anti-zoom rule #1)
function onWheel(e: WheelEvent) {
  if (e.ctrlKey) e.preventDefault()
}

onMounted(() => {
  updateScale()
  window.addEventListener('resize', updateScale, { passive: true })
  window.addEventListener('orientationchange', updateScale, { passive: true })
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('gesturestart', preventDefault)
  document.addEventListener('gesturechange', preventDefault)
  document.addEventListener('contextmenu', preventDefault)
  document.addEventListener('dblclick', preventDefault)
  window.addEventListener('wheel', onWheel, { passive: false })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScale)
  window.removeEventListener('orientationchange', updateScale)
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('gesturestart', preventDefault)
  document.removeEventListener('gesturechange', preventDefault)
  document.removeEventListener('contextmenu', preventDefault)
  document.removeEventListener('dblclick', preventDefault)
  window.removeEventListener('wheel', onWheel)
})
</script>
