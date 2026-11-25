<template>
  <!-- Número con botones grandes de menos y más: más fácil que un teclado numérico en el aula. Sin
       valor (undefined), el campo queda vacío hasta que se elige uno: así un cero no pasa por
       respuesta. -->
  <div>
    <label :for="id" class="field-label">{{ label }}</label>
    <div class="flex items-center gap-3">
      <UiButton tone="neutral" icon="minus" icon-only :label="`${label} −1`" :disabled="!modelValue" @click="$emit('update:modelValue', Math.max(0, (modelValue ?? 0) - 1))" />
      <input
        :id="id"
        :value="modelValue ?? ''"
        type="number"
        inputmode="numeric"
        min="0"
        class="field w-24 text-center font-black tabular-nums"
        :style="{ fontSize: 'var(--text-title)' }"
        :aria-invalid="invalido || undefined"
        @input="alEscribir(($event.target as HTMLInputElement).value)"
      >
      <UiButton tone="neutral" icon="plus" icon-only :label="`${label} +1`" @click="$emit('update:modelValue', (modelValue ?? 0) + 1)" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string, modelValue: number | undefined, invalido?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: number | undefined] }>()
const id = useId()
// Borrar el número lo deja vacío; lo demás, un entero desde cero.
function alEscribir(valor: string) {
  emit('update:modelValue', valor === '' ? undefined : Math.max(0, Math.floor(Number(valor)) || 0))
}
</script>
