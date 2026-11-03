<template>
  <!-- Mes de la app original: lunes a domingo, cada día con sus talleres (punto del color del área y
       título). En tableta y escritorio ocupa el alto disponible y nunca lo pasa: si un día tiene más
       talleres de los que caben, muestra el primero y «+N más». En el teléfono solo caben los
       puntos; tocar un día lo abre en la vista Día. -->
  <div class="ui-panel overflow-hidden md:flex md:min-h-0 md:flex-1 md:flex-col">
    <div class="grid shrink-0 grid-cols-7 border-b border-line">
      <span v-for="(d, i) in cabeceraSemana(locale)" :key="d" :class="['eyebrow py-2.5 text-center', i < 6 && 'border-r border-line']">{{ d }}</span>
    </div>
    <div class="md:flex md:min-h-0 md:flex-1 md:flex-col">
      <div v-for="semana in cuadriculaDelMes(fecha)" :key="semana[0]!.iso" class="grid grid-cols-7 border-b border-line last:border-b-0 md:min-h-0 md:flex-1">
        <div
          v-for="(dia, i) in semana"
          :key="dia.iso"
          :data-tone="dia.iso === hoy ? 'sun' : undefined"
          :class="[
            'min-h-20 min-w-0 cursor-pointer overflow-hidden p-1.5 md:min-h-0 md:p-2',
            i < 6 && 'border-r border-line',
            dia.iso === hoy ? 'bg-(--tone-wash)' : !dia.delMes && 'bg-canvas',
          ]"
          @click="$emit('verDia', dia.iso)"
        >
          <button
            type="button"
            :class="['ui-day ui-day-sm', !dia.delMes && 'is-outside']"
            :aria-current="dia.iso === hoy ? 'date' : undefined"
            :aria-label="fechaLarga(dia.iso, locale)"
            @click.stop="$emit('verDia', dia.iso)"
          >
            {{ aFecha(dia.iso).getDate() }}
          </button>
          <ul class="mt-1 flex flex-wrap gap-1 md:block md:space-y-1">
            <li v-for="(taller, n) in porDia[dia.iso] ?? []" :key="taller.id" :class="['min-w-0', n >= visibles(dia.iso) && 'md:hidden']">
              <!-- Un taller cancelado, en coral (UI_SESSION_TONES) en vez del color de su área. -->
              <button
                type="button"
                v-bind="estadoDe(taller) === 'cancelado' ? { 'data-tone': 'coral' } : { 'data-area': taller.storyboard.eje }"
                class="flex w-full items-center gap-1.5 rounded-chip text-left md:px-1 md:py-0.5 md:hover:bg-sunken"
                @click.stop="abrir(taller.id)"
              >
                <span class="size-2 shrink-0 rounded-full bg-(--tone-fill)" />
                <span class="sr-only md:not-sr-only md:truncate md:text-caption md:font-bold md:text-ink">
                  <span class="tabular-nums text-muted">{{ taller.horaInicio }}</span> {{ taller.storyboard.titulo }}
                  <span v-if="estadoDe(taller) === 'cancelado'" class="text-(--tone-strong)">· {{ t('estado.cancelado') }}</span>
                </span>
              </button>
            </li>
            <li v-if="ocultos(dia.iso)" class="hidden px-1 text-caption font-extrabold text-muted md:block">{{ t('calendario.mas', { n: ocultos(dia.iso) }) }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { aFecha, cabeceraSemana, cuadriculaDelMes } from '~/utils/calendario'
import { estadoDe, isoDia } from '~/utils/talleres'
import type { Taller } from '~/utils/talleres'

const props = defineProps<{ fecha: string, porDia: Record<string, Taller[]> }>()
defineEmits<{ verDia: [iso: string] }>()

const { t, locale } = useT()
const { abrir } = useTallerAbierto()
const hoy = isoDia(new Date())

// En una celda caben dos talleres; si hay más, el primero y «+N más».
const visibles = (iso: string) => ((props.porDia[iso]?.length ?? 0) > 2 ? 1 : 2)
const ocultos = (iso: string) => Math.max(0, (props.porDia[iso]?.length ?? 0) - visibles(iso))
</script>
