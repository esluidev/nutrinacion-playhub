<template>
  <!-- Los datos de una jornada: nombre, lugar (sus talleres lo heredan), los días (desde/hasta; uno
       solo si no se dice hasta cuándo) y una descripción. Los usan la «Nueva jornada» del
       JornadaSelector y la edición desde su panel (JornadaDialog). -->
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <UiInput :id="`${id}-nombre`" v-model="datos.nombre" :label="t('planner.jName')" :placeholder="t('planner.jNamePh')" required />
    <UiInput :id="`${id}-lugar`" v-model="datos.ubicacion" :label="t('planner.jLocation')" :placeholder="t('planner.jLocationPh')" :hint="t('planner.jLocationHint')" required />
    <UiInput :id="`${id}-desde`" v-model="datos.fecha_inicio" type="date" :label="t('planner.jFrom')" required />
    <UiInput :id="`${id}-hasta`" v-model="datos.fecha_fin" type="date" :label="t('planner.jTo')" :min="datos.fecha_inicio || undefined" :hint="t('planner.jToHint')" />
    <UiTextarea :id="`${id}-descripcion`" v-model="datos.descripcion" class="sm:col-span-2" :label="t('planner.jDescription')" optional :rows="2" />
  </div>
</template>

<script setup lang="ts">
import type { DatosJornada } from '~/composables/useJornadas'

withDefaults(defineProps<{ id?: string }>(), { id: 'jornada' })
const datos = defineModel<DatosJornada>({ required: true })

const { t } = useT()
</script>
