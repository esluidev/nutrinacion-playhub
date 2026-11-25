<template>
  <!-- La comunidad de un lugar (o de varios, al agruparlos): ninguna, una de las que ya hay o una
       nueva, que se escribe aquí y se crea al guardar. Es opcional: solo agrupa lugares para el
       reporte por territorio. -->
  <div class="grid grid-cols-1 gap-4">
    <UiSelect
      :model-value="valor"
      :options="opciones"
      :label="t('places.fCommunity')"
      @update:model-value="elegir"
    />
    <UiInput
      v-if="valor === 'nueva'"
      id="comunidad-nueva"
      v-model="eleccion.nueva"
      :label="t('places.fCommunityNew')"
      :placeholder="t('places.fCommunityNewPh')"
      required
    />
    <p class="field-help -mt-2">{{ t('places.fCommunityHint') }}</p>
  </div>
</template>

<script setup lang="ts">
import type { EleccionComunidad } from '~/composables/useLugares'

const eleccion = defineModel<EleccionComunidad>({ required: true })

const { t } = useT()
const { comunidades } = useLugares()

// «Nueva comunidad» elegida (aunque aún no se haya escrito el nombre). Si quien usa el campo lo
// reinicia (otro diálogo que se abre), se vuelve a leer de lo que trae.
const nuevaAbierta = ref(!!eleccion.value.nueva)
let propio = false
watch(eleccion, (e) => {
  if (!propio) nuevaAbierta.value = !!e.nueva
  propio = false
})

const opciones = computed(() => [
  { value: 'ninguna', label: t('places.noCommunity') },
  ...comunidades.value.map(c => ({ value: c.id, label: c.nombre })),
  { value: 'nueva', label: t('places.newCommunity') },
])
const valor = computed(() => (nuevaAbierta.value ? 'nueva' : eleccion.value.comunidadId ?? 'ninguna'))

function elegir(v: string | number | null) {
  propio = true
  if (v === 'nueva') {
    nuevaAbierta.value = true
    eleccion.value = { comunidadId: null, nueva: eleccion.value.nueva }
    return
  }
  nuevaAbierta.value = false
  eleccion.value = { comunidadId: typeof v === 'number' ? v : null, nueva: '' }
}
</script>
