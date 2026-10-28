<template>
  <!-- Opciones grandes, para el pulgar: un grupo de radio con la cara de las tarjetas del kit. -->
  <fieldset>
    <legend class="field-label">{{ label }}</legend>
    <div class="grid gap-3" :style="{ gridTemplateColumns: `repeat(${opciones.length}, minmax(0, 1fr))` }" role="radiogroup">
      <button
        v-for="op in opciones"
        :key="op.value"
        type="button"
        role="radio"
        class="select-card !px-7 py-4 [&_.selected-mark]:right-2 [&_.selected-mark]:top-2"
        :aria-checked="modelValue === op.value"
        :aria-pressed="modelValue === op.value"
        @click="$emit('update:modelValue', op.value)"
      >
        <span class="selected-mark"><UiIcon name="check" /></span>
        <span class="font-black" :style="{ fontSize: 'var(--text-body)' }">{{ op.label }}</span>
      </button>
    </div>
  </fieldset>
</template>

<script setup lang="ts" generic="T extends string">
defineProps<{
  label: string
  opciones: { value: T, label: string }[]
  modelValue?: T
}>()

defineEmits<{ 'update:modelValue': [value: T] }>()
</script>
