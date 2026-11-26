<template>
  <!-- El mes, de lunes a domingo, en un card con su rango y para moverse. Cada día con sus talleres: en pantallas
       anchas, la hora y el título (dos, o uno y «+N más»); en el teléfono, un punto por taller. El punto va en el tono
       de su sesión, como la ficha de la hora. Tocar un día lo elige (en cielo) y debajo, en su card, salen sus talleres
       con la misma fila de la vista Día, que abre su ficha. Hoy en sol. -->
  <div class="space-y-6">
    <section class="ui-panel overflow-hidden">
      <CalendarioRango />
      <div class="grid grid-cols-7 border-b border-line">
        <span v-for="(d, i) in cabeceraSemana(locale)" :key="d" :class="['eyebrow py-2.5 text-center', i < 6 && 'border-r border-line']">{{ d }}</span>
      </div>
      <div v-for="semana in cuadriculaDelMes(fecha)" :key="semana[0]!.iso" class="grid grid-cols-7 border-b border-line last:border-b-0">
        <button
          v-for="(dia, i) in semana"
          :key="dia.iso"
          type="button"
          :data-tone="dia.iso === elegido ? 'sky' : dia.iso === hoy ? 'sun' : undefined"
          :class="[
            'flex min-h-16 min-w-0 flex-col items-start gap-1 overflow-hidden p-1.5 text-left transition-colors md:min-h-24 md:p-2',
            i < 6 && 'border-r border-line',
            dia.iso === elegido || dia.iso === hoy ? 'bg-(--tone-wash)' : dia.delMes ? 'hover:bg-canvas' : 'bg-canvas',
          ]"
          :aria-pressed="dia.iso === elegido"
          :aria-label="fechaLarga(dia.iso, locale)"
          @click="elegido = dia.iso"
        >
          <span
            :class="['ui-day ui-day-sm', !dia.delMes && 'is-outside']"
            :aria-current="dia.iso === hoy ? 'date' : undefined"
            :aria-pressed="dia.iso === elegido"
          >{{ Number(dia.iso.slice(8)) }}</span>
          <ul class="flex w-full min-w-0 flex-wrap gap-1 md:block md:space-y-0.5">
            <li
              v-for="(taller, n) in porDia[dia.iso] ?? []"
              :key="taller.id"
              :data-tone="UI_SESSION_TONES[estadoDe(taller)]"
              :class="['flex min-w-0 items-center gap-1.5', n >= visibles(dia.iso) && 'md:hidden']"
            >
              <span class="size-2 shrink-0 rounded-full bg-(--tone-fill)" />
              <span class="sr-only md:not-sr-only md:truncate md:text-caption md:font-bold md:text-ink">
                <span class="tabular-nums text-muted">{{ taller.horaInicio }}</span> {{ taller.titulo }}
              </span>
            </li>
            <li v-if="ocultos(dia.iso)" class="hidden px-0.5 text-caption font-extrabold text-muted md:block">{{ t('calendario.mas', { n: ocultos(dia.iso) }) }}</li>
          </ul>
        </button>
      </div>
    </section>

    <section class="ui-panel overflow-hidden">
      <div class="ui-panel-header">
        <h2 class="ui-title flex items-center gap-2.5">{{ tituloDelDia }}<span v-if="delElegido.length" class="filter-count">{{ delElegido.length }}</span></h2>
      </div>
      <div v-if="delElegido.length" class="divide-y divide-line">
        <TallerFila v-for="taller in delElegido" :key="taller.id" :taller="taller" :obvio="obvioDel(elegido)" />
      </div>
      <p v-else class="ui-panel-body ui-text">{{ t('talleres.vacioDia') }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { UI_SESSION_TONES } from '@playhub/ui/app/utils/ui-tones'
import { cabeceraSemana, cuadriculaDelMes, diaDelMes } from '~/utils/calendario'
import { fechaLarga } from '~/utils/fechas'
import { estadoDe, isoDia, obvioDelDia } from '~/utils/talleres'
import type { Taller } from '~/utils/talleres'

const props = defineProps<{ porDia: Record<string, Taller[]> }>()

const { t, locale } = useT()
const { fecha } = useCalendario()
const hoy = isoDia(new Date())

// El día elegido se conserva al ir y volver de un taller; al cambiar de mes, hoy si es de ese mes, si no el primer día
// con talleres o el día 1.
const elegido = useState('calendario-dia', () => '')
watch(fecha, (iso) => {
  if (!elegido.value.startsWith(iso.slice(0, 7))) elegido.value = diaDelMes(iso, new Set(Object.keys(props.porDia)), hoy)
}, { immediate: true })
const delElegido = computed(() => props.porDia[elegido.value] ?? [])
const tituloDelDia = computed(() => {
  const texto = fechaLarga(elegido.value, locale.value)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
})
// Lo que ya dice el día (hoy o próximo) no se repite en cada fila.
const obvioDel = (iso: string) => obvioDelDia(iso, hoy)

// En una celda caben dos talleres; si hay más, el primero y «+N más».
const visibles = (iso: string) => ((props.porDia[iso]?.length ?? 0) > 2 ? 1 : 2)
const ocultos = (iso: string) => Math.max(0, (props.porDia[iso]?.length ?? 0) - visibles(iso))
</script>
