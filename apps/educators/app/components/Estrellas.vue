<template>
  <!-- Calificación general de la app original: cinco estrellas grandes, para el pulgar. -->
  <fieldset>
    <legend class="field-label">{{ label }}</legend>
    <div class="flex gap-1" role="radiogroup" data-tone="sun">
      <button
        v-for="n in 5"
        :key="n"
        type="button"
        role="radio"
        class="flex size-12 items-center justify-center rounded-(--ph-radius) transition-transform active:scale-90"
        :aria-checked="modelValue === n"
        :aria-label="etiqueta(n)"
        @click="$emit('update:modelValue', n)"
      >
        <UiIcon :name="n <= (modelValue ?? 0) ? 'star-solid' : 'star'" :class="['size-8', n <= (modelValue ?? 0) ? 'text-(--tone-fill)' : 'text-disabled']" />
      </button>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
defineProps<{ label: string, modelValue?: number, etiqueta: (n: number) => string }>()
defineEmits<{ 'update:modelValue': [value: number] }>()
</script>
