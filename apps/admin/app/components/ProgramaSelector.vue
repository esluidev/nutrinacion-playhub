<template>
  <!-- Si la jornada o el taller es parte de un programa (tarea 021): opcional. Un desplegable con «Sin programa» y los
       que no han terminado (y el ya elegido, aunque haya terminado). Los programas se crean en su sección, nunca desde
       otro formulario (tarea 023). Debajo, sus fechas: lo que se programa tiene que caer en ellas (lo exige la base). -->
  <div>
    <UiSelect
      :model-value="programaId ?? 'ninguno'"
      :options="opciones"
      :label="t('programs.field')"
      @update:model-value="(v) => programaId = typeof v === 'number' ? v : null"
    />
    <p class="field-help">{{ elegido ? t('programs.fieldDates', { desde: fechaCorta(elegido.fecha_inicio, locale), hasta: fechaCorta(elegido.fecha_fin, locale) }) : t('programs.fieldHintSection') }}</p>
  </div>
</template>

<script setup lang="ts">
const programaId = defineModel<number | null>({ required: true })

const { t, locale } = useT()
const { programas, getPrograma } = useProgramas()

const elegido = computed(() => getPrograma(programaId.value))
const opciones = computed(() => {
  const hoy = hoyLocal()
  const vigentes = programas.value.filter(p => p.fecha_fin >= hoy || p.id === programaId.value)
  return [
    { value: 'ninguno', label: t('programs.none'), pinned: true },
    ...vigentes.map(p => ({ value: p.id, label: p.nombre })),
  ]
})
</script>
