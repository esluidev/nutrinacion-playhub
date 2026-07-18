<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    v-html="markup"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  /** Primitive slug from usePrimitivesCatalog (icon key) */
  name: string
}>()

// Static stroke icons, one per primitive slug. Same line style as the
// chrome icons (sidebar). Dots/fills use currentColor.
const ICONS: Record<string, string> = {
  'wheel': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.2"/><path d="M12 9.8V3M13.9 13.1l5.9 3.4M10.1 13.1l-5.9 3.4"/>',
  'progress-ring': '<path d="M12 3a9 9 0 1 1-9 9"/><circle cx="12" cy="12" r="3.5"/>',
  'progress-halo': '<path d="M12 3a9 9 0 1 1-9 9"/><rect x="8.5" y="8.5" width="7" height="7" rx="2"/>',
  'progress-bar': '<rect x="3" y="9.25" width="18" height="5.5" rx="2.75"/><rect x="3" y="9.25" width="11" height="5.5" rx="2.75" fill="currentColor" stroke="none"/>',
  'dice': '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="8.8" cy="8.8" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.2" cy="8.8" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="8.8" cy="15.2" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.2" cy="15.2" r="1.2" fill="currentColor" stroke="none"/>',
  'score-counter': '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  'step-meter': '<rect x="3.5" y="13" width="4" height="7" rx="1"/><rect x="10" y="9" width="4" height="11" rx="1"/><rect x="16.5" y="4" width="4" height="16" rx="1"/>',
  'draggable': '<path d="M12 3v18M3 12h18"/><path d="m9 6 3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>',
  'drop-zone': '<rect x="3" y="9" width="18" height="12" rx="3" stroke-dasharray="4 3"/><path d="M12 3v8M9 8.5l3 3 3-3"/>',
  'reorder-list': '<path d="M10 6h11M10 12h11M10 18h11"/><path d="M5 4v16M3 6l2-2 2 2M3 18l2 2 2-2"/>',
  'tap-field': '<circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><path d="M8.46 8.46a5 5 0 0 1 7.08 0M5.64 5.64a9 9 0 0 1 12.72 0"/><path d="M12 14.5V21"/>',
  'scale': '<path d="M12 4v14M5 7h14M8 18h8"/><path d="M5 7l-2.6 5.5a2.9 2.9 0 0 0 5.2 0L5 7ZM19 7l-2.6 5.5a2.9 2.9 0 0 0 5.2 0L19 7Z"/>',
  'ruler': '<rect x="8.5" y="2.5" width="7" height="19" rx="1.5"/><path d="M8.5 7h3.5M8.5 11h3.5M8.5 15h3.5M8.5 19h3.5"/>',
  'thermometer': '<path d="M10 13.5V5a2 2 0 0 1 4 0v8.5a4.5 4.5 0 1 1-4 0Z"/><circle cx="12" cy="17.5" r="1.6" fill="currentColor" stroke="none"/>',
  'glucometer': '<path d="M12 3.5s5.5 6.2 5.5 10a5.5 5.5 0 0 1-11 0c0-3.8 5.5-10 5.5-10Z"/>',
  'pose-guide': '<circle cx="12" cy="5" r="2.5"/><path d="M12 7.5v6M12 9.5 7 7M12 9.5l5-2.5M12 13.5l-3.5 6M12 13.5l3.5 6"/>',
  'exercise-timer': '<circle cx="12" cy="13" r="8"/><path d="M12 13V8.5M10 2.5h4M12 2.5V5"/>',
  'breath-guide': '<circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="8.5" stroke-dasharray="3.5 3.5"/>',
}

const FALLBACK = '<circle cx="12" cy="12" r="9"/><path d="M9 12h6M12 9v6"/>'

const markup = computed(() => ICONS[props.name] ?? FALLBACK)
</script>
