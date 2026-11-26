<template>
  <!-- Un número del grupo (asistentes, niñas, niños, dispositivos): un campo ancho con el teclado numérico, sin botones
       de menos y más ni las flechas del navegador (Luis, 2026-11-26: «saturan el UI»). Sin valor (undefined), el campo
       queda vacío hasta que se escribe uno: así un cero no pasa por respuesta. `opcional` lo dice junto a la etiqueta,
       como los campos del kit; `sugerido` es el número que se guardaría si se deja vacío (las niñas o los niños que
       resultan del total), en gris. -->
  <div>
    <label :for="id" class="field-label">
      {{ label }}
      <span v-if="opcional" class="font-semibold text-muted">{{ labels.optional }}</span>
    </label>
    <input
      :id="id"
      :value="modelValue ?? ''"
      type="number"
      inputmode="numeric"
      min="0"
      class="field numero w-40 text-center font-black tabular-nums"
      :style="{ fontSize: 'var(--text-title)' }"
      :placeholder="sugerido == null ? undefined : String(sugerido)"
      :aria-invalid="invalido || undefined"
      @input="alEscribir(($event.target as HTMLInputElement).value)"
    >
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string, modelValue: number | undefined | null, invalido?: boolean, opcional?: boolean, sugerido?: number | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: number | undefined] }>()
const id = useId()
const labels = useUiLabels()
// Borrar el número lo deja vacío; lo demás, un entero desde cero.
function alEscribir(valor: string) {
  emit('update:modelValue', valor === '' ? undefined : Math.max(0, Math.floor(Number(valor)) || 0))
}
</script>

<style scoped>
/* Sin las flechas del navegador en un campo de número. */
.numero { appearance: textfield; -moz-appearance: textfield; }
.numero::-webkit-inner-spin-button, .numero::-webkit-outer-spin-button { appearance: none; margin: 0; }
</style>
