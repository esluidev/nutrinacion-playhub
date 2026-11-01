<template>
  <!-- Los países donde opera una organización: elección múltiple con los filtros del kit (pulsado =
       noche, estructura) y la bandera de cada uno. Al menos uno: deciden qué storyboards estándar
       tiene disponibles (decisión 011). -->
  <div role="group" :aria-labelledby="uid">
    <p :id="uid" class="field-label">{{ label }}</p>
    <p v-if="hint" class="ui-caption mb-3">{{ hint }}</p>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="p in paises"
        :key="p.codigo"
        type="button"
        class="filter filter-sm"
        :aria-pressed="modelValue.includes(p.codigo)"
        @click="toggle(p.codigo)"
      >
        <span v-if="p.bandera">{{ p.bandera }}</span>{{ p.nombre?.[locale] ?? p.nombre?.es ?? p.codigo }}
      </button>
    </div>
    <p v-if="error" class="field-error mt-2">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string[]
  label: string
  hint?: string
  error?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const uid = useId()
const { locale } = useT()
const { paises, cargar } = usePaises()
onMounted(cargar)

function toggle(codigo: string) {
  const arr = props.modelValue.includes(codigo)
    ? props.modelValue.filter(c => c !== codigo)
    : [...props.modelValue, codigo]
  emit('update:modelValue', arr)
}
</script>
