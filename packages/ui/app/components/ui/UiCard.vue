<template>
  <div :class="['ui-panel', hover && 'ui-panel-interactive']">
    <div v-if="$slots.header" class="ui-panel-header">
      <slot name="header" />
    </div>
    <div :class="padding && 'ui-panel-body'">
      <slot />
    </div>
    <div v-if="$slots.footer" class="ui-panel-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Panel blanco con base en relieve. `hover` lo levanta al pasar el puntero: úsalo solo
// cuando toda la tarjeta es clicable.
withDefaults(defineProps<{
  hover?: boolean
  padding?: boolean
}>(), {
  hover: false,
  padding: true,
})
</script>
