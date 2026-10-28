<template>
  <!-- Selector de fecha del botón de calendario (como el de la app original): un mes, los días con
       taller marcados y hoy en sol. Elegir un día lleva el calendario a esa semana o ese mes. -->
  <div class="ui-panel w-[min(22rem,calc(100vw-2rem))] p-3 shadow-float" role="dialog" :aria-label="t('calendario.elegir')">
    <div class="mb-2 flex items-center justify-between gap-2">
      <UiButton variant="ghost" icon="chevron-left" icon-only :label="t('calendario.anterior')" @click="mes = moverRango(mes, 'mes', -1)" />
      <p class="text-subtitle font-black first-letter:uppercase">{{ textoDelRango(mes, 'mes', locale) }}</p>
      <UiButton variant="ghost" icon="chevron-right" icon-only :label="t('calendario.siguiente')" @click="mes = moverRango(mes, 'mes', 1)" />
    </div>
    <div class="grid grid-cols-7 gap-1 text-center">
      <span v-for="d in cabeceraSemana(locale)" :key="d" class="eyebrow py-1">{{ d.charAt(0) }}</span>
      <template v-for="semana in cuadriculaDelMes(mes)" :key="semana[0]!.iso">
        <button
          v-for="dia in semana"
          :key="dia.iso"
          type="button"
          :class="['ui-day relative mx-auto', !dia.delMes && 'is-outside']"
          :aria-current="dia.iso === hoy ? 'date' : undefined"
          :aria-pressed="dia.iso === fecha"
          :aria-label="fechaLarga(dia.iso, locale)"
          @click="$emit('elegir', dia.iso)"
        >
          {{ aFecha(dia.iso).getDate() }}
          <span v-if="conTalleres.has(dia.iso)" class="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-muted" />
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { aFecha, cabeceraSemana, cuadriculaDelMes, moverRango, textoDelRango } from '~/utils/calendario'
import { isoDia } from '~/utils/talleres'

const props = defineProps<{ fecha: string, conTalleres: Set<string> }>()
defineEmits<{ elegir: [iso: string] }>()

const { t, locale } = useT()
const hoy = isoDia(new Date())
const mes = ref(props.fecha)
</script>
