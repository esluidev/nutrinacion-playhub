<template>
  <!-- «¿Es parte de una jornada?» al programar un taller (asistente y detalle del taller): suelto,
       una jornada en curso (las que no han terminado, con su lugar, sus días y cuántos talleres
       tiene) o una nueva, que se escribe aquí y se crea al guardar el taller. Elección única con
       las tarjetas seleccionables del kit, en cielo (selección). -->
  <div>
    <p class="field-label">{{ t('jornada.question') }}</p>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3" role="group" :aria-label="t('jornada.question')">
      <button
        v-for="op in opciones"
        :key="op.value"
        type="button"
        data-tone="sky"
        class="select-card items-start justify-start gap-1 px-4 py-3 pr-10 text-left"
        :aria-pressed="eleccion.modo === op.value"
        :disabled="op.disabled"
        @click="elegirModo(op.value)"
      >
        <span class="selected-mark"><UiIcon name="check" /></span>
        <span class="text-body font-extrabold text-ink">{{ op.label }}</span>
        <span class="ui-caption">{{ op.desc }}</span>
      </button>
    </div>

    <!-- Una jornada en curso: la lista para elegir -->
    <div v-if="eleccion.modo === 'existente'" class="mt-4">
      <p class="field-label">{{ t('jornada.pick') }}</p>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          v-for="j in lista"
          :key="j.id"
          type="button"
          data-tone="sky"
          class="select-card items-start justify-start gap-1 px-4 py-3 pr-10 text-left"
          :aria-pressed="eleccion.jornadaId === j.id"
          @click="eleccion.jornadaId = j.id"
        >
          <span class="selected-mark"><UiIcon name="check" /></span>
          <span class="flex min-w-0 items-center gap-2">
            <UiIcon name="calendar" class="size-4 shrink-0 text-subtle" />
            <span class="truncate text-body font-extrabold text-ink">{{ j.nombre }}</span>
          </span>
          <span class="flex min-w-0 items-center gap-2 text-caption font-semibold text-muted">
            <UiIcon name="map-pin" class="size-3.5 shrink-0 text-subtle" />
            <span class="truncate">{{ j.ubicacion }}</span>
          </span>
          <span class="ui-caption">{{ rangoJornada(j, locale) }} · {{ tCount(t, 'jornada.workshops', j.workshops[0]?.count ?? 0) }}</span>
        </button>
      </div>
    </div>

    <!-- Una nueva: sus datos, aquí mismo -->
    <JornadaCampos v-else-if="eleccion.modo === 'nueva'" :id="`${id}-nueva`" v-model="eleccion.nueva" class="mt-4" />
  </div>
</template>

<script setup lang="ts">
import type { EleccionJornada, JornadaFila, ModoJornada } from '~/composables/useJornadas'
import { jornadasEnCurso } from '~/utils/jornadas'

const props = withDefaults(defineProps<{
  jornadas: JornadaFila[]
  // La fecha del taller: con ella arrancan los días de una jornada nueva.
  fecha?: string
  id?: string
}>(), { fecha: '', id: 'jornada-selector' })
const eleccion = defineModel<EleccionJornada>({ required: true })

const { t, locale } = useT()

// Las que no han terminado y, si el taller ya va en una terminada, también esa (para verla elegida).
const lista = computed(() => {
  const enCurso = jornadasEnCurso(props.jornadas, hoyLocal())
  const elegida = props.jornadas.find(j => j.id === eleccion.value.jornadaId)
  return elegida && !enCurso.includes(elegida) ? [elegida, ...enCurso] : enCurso
})

const opciones = computed(() => [
  { value: 'suelto' as const, label: t('jornada.suelto'), desc: t('jornada.sueltoDesc'), disabled: false },
  {
    value: 'existente' as const,
    label: t('jornada.existente'),
    desc: lista.value.length ? tCount(t, 'jornada.existenteDesc', lista.value.length) : t('jornada.existenteNone'),
    disabled: !lista.value.length,
  },
  { value: 'nueva' as const, label: t('jornada.nueva'), desc: t('jornada.nuevaDesc'), disabled: false },
])

function elegirModo(modo: ModoJornada) {
  const e = eleccion.value
  e.modo = modo
  // Con una sola en curso, ya queda elegida.
  if (modo === 'existente' && !e.jornadaId && lista.value.length === 1) e.jornadaId = lista.value[0]!.id
  // Una nueva arranca en el día del taller.
  if (modo === 'nueva' && !e.nueva.fecha_inicio && props.fecha) {
    e.nueva.fecha_inicio = props.fecha
    e.nueva.fecha_fin = props.fecha
  }
}
</script>
