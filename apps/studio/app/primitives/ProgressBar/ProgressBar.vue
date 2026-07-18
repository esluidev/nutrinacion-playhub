<template>
  <div :class="['progress-bar', `progress-bar-${color}`, `size-${size}`]">
    <div class="progress-bar-fill" :style="{ width: `${current * 100}%` }" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { useProgressBar } from './useProgressBar'
import type { ProgressBarColor, ProgressBarSize } from './ProgressBar.types'

interface Props {
  color?: ProgressBarColor
  size?: ProgressBarSize
  initial?: number
}

const props = withDefaults(defineProps<Props>(), {
  color: 'green',
  size: 'md',
  initial: 0,
})

const { current, setProgress, animate, destroy } = useProgressBar({ initial: props.initial })

onBeforeUnmount(destroy)

defineExpose({
  setProgress,
  animate,
  current: () => current.value,
})
</script>

<style scoped>
/* Visual ported verbatim from the StoryPlay DS (.progress-bar block).
   Horizontal bar with a Duolingo-style glossy strip on top of the fill. */
.progress-bar {
  position: relative;
  width: 100%;
  max-width: 360px;
  height: 22px;
  background: var(--paper-deep);
  border-radius: 999px;
  overflow: hidden;
  --bar-color: var(--accent-green);
}

.progress-bar.progress-bar-red { --bar-color: var(--accent-red); }
.progress-bar.progress-bar-blue { --bar-color: var(--accent-blue); }
.progress-bar.progress-bar-green { --bar-color: var(--accent-green); }
.progress-bar.progress-bar-yellow { --bar-color: var(--accent-yellow); }

.progress-bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--bar-color);
  border-radius: 999px;
  transition: width 500ms cubic-bezier(0.25, 0.8, 0.4, 1);
  overflow: hidden;
}

/* Glossy strip: a horizontal white line in the upper third of the fill */
.progress-bar-fill::after {
  content: "";
  position: absolute;
  top: 7px;
  left: 14px;
  right: 14px;
  height: 5px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 999px;
  pointer-events: none;
}

.progress-bar.size-sm { height: 16px; }
.progress-bar.size-sm .progress-bar-fill::after { top: 5px; height: 4px; left: 10px; right: 10px; }
.progress-bar.size-md { height: 22px; }
.progress-bar.size-lg { height: 30px; }
.progress-bar.size-lg .progress-bar-fill::after { top: 10px; height: 7px; left: 18px; right: 18px; }
</style>
