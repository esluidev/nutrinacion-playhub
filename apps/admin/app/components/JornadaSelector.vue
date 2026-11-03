<template>
  <!-- Dónde se da el taller (asistente y «Cambiar jornada» del detalle): suelto o dentro de una
       jornada, con las pestañas del kit. Dentro de una jornada, se elige en un desplegable entre las
       que siguen en curso, o «Nueva jornada» la escribe en su diálogo (JornadaDialog): queda elegida
       y se crea al guardar el taller. La jornada nunca se escribe mezclada con el taller. -->
  <div>
    <UiTabs :model-value="pestana" :items="pestanas" :label="t('jornada.question')" fit @update:model-value="elegirPestana" />

    <div v-if="pestana === 'jornada'" class="mt-5">
      <div v-if="opciones.length" class="flex flex-wrap items-end gap-3">
        <UiSelect
          class="min-w-0 flex-1 basis-72"
          :model-value="valor"
          :options="opciones"
          :label="t('jornada.label')"
          :placeholder="t('jornada.pick')"
          @update:model-value="elegirJornada"
        />
        <UiButton v-if="eleccion.modo === 'nueva'" variant="outline" icon="pencil" @click="abrirDialogo">{{ t('jornada.editNueva') }}</UiButton>
        <UiButton v-else variant="outline" icon="plus" @click="abrirDialogo">{{ t('jornada.nueva') }}</UiButton>
      </div>
      <div v-else class="flex flex-wrap items-center gap-3">
        <p class="ui-text min-w-0 flex-1">{{ t('jornada.none') }}</p>
        <UiButton variant="outline" icon="plus" @click="abrirDialogo">{{ t('jornada.nueva') }}</UiButton>
      </div>

      <!-- La elegida: su lugar y sus días (los talleres los heredan) -->
      <p v-if="detalle" class="ui-caption mt-2 flex flex-wrap items-center gap-x-1.5">
        <UiIcon name="map-pin" class="size-3.5 shrink-0 text-subtle" />{{ detalle }}
      </p>
    </div>

    <JornadaDialog v-model:open="dialogo" :borrador="borrador" @listo="usarNueva" />
  </div>
</template>

<script setup lang="ts">
import type { DatosJornada, EleccionJornada, JornadaFila } from '~/composables/useJornadas'
import { datosJornadaVacios } from '~/composables/useJornadas'
import { jornadasEnCurso, rangoJornada } from '~/utils/jornadas'

const props = withDefaults(defineProps<{
  jornadas: JornadaFila[]
  // La fecha del taller, si ya la tiene: con ella arrancan los días de una jornada nueva.
  fecha?: string
}>(), { fecha: '' })
const eleccion = defineModel<EleccionJornada>({ required: true })

const { t, locale } = useT()

// Las que no han terminado y, si el taller ya va en una terminada, también esa (para verla elegida).
const lista = computed(() => {
  const enCurso = jornadasEnCurso(props.jornadas, hoyLocal())
  const elegida = props.jornadas.find(j => j.id === eleccion.value.jornadaId)
  return elegida && !enCurso.includes(elegida) ? [elegida, ...enCurso] : enCurso
})

const pestanas = computed(() => [
  { value: 'suelto', label: t('jornada.suelto') },
  { value: 'jornada', label: t('jornada.dentro') },
])
const pestana = computed(() => (eleccion.value.modo === 'suelto' ? 'suelto' : 'jornada'))

// Una nueva ya escrita (aún sin guardar) sigue en la lista para volver a ella.
const hayNueva = computed(() => !!eleccion.value.nueva.nombre.trim())
const opciones = computed(() => [
  ...(hayNueva.value ? [{ value: 'nueva', label: `${eleccion.value.nueva.nombre.trim()} ${t('jornada.nuevaMark')}` }] : []),
  ...lista.value.map(j => ({ value: j.id, label: j.nombre })),
])
const valor = computed(() => (eleccion.value.modo === 'nueva' ? 'nueva' : eleccion.value.jornadaId))

const detalle = computed(() => {
  const e = eleccion.value
  if (e.modo === 'nueva' && hayNueva.value) {
    const n = e.nueva
    return `${n.ubicacion} · ${rangoJornada({ fecha_inicio: n.fecha_inicio, fecha_fin: n.fecha_fin || n.fecha_inicio }, locale.value)} · ${t('jornada.nuevaCaption')}`
  }
  const j = lista.value.find(x => x.id === e.jornadaId)
  if (e.modo !== 'existente' || !j) return ''
  return `${j.ubicacion} · ${rangoJornada(j, locale.value)} · ${tCount(t, 'jornada.workshops', j.workshops[0]?.count ?? 0)}`
})

function elegirPestana(p: string) {
  const e = eleccion.value
  if (p === 'suelto') {
    e.modo = 'suelto'
    return
  }
  // Dentro de una jornada: la nueva si ya se escribió; si no, una en curso (la única, si solo hay una).
  if (hayNueva.value && !e.jornadaId) e.modo = 'nueva'
  else {
    e.modo = 'existente'
    if (!e.jornadaId && lista.value.length === 1) e.jornadaId = lista.value[0]!.id
  }
}

function elegirJornada(v: string | number | null) {
  const e = eleccion.value
  if (v === 'nueva') e.modo = 'nueva'
  else {
    e.modo = 'existente'
    e.jornadaId = typeof v === 'number' ? v : null
  }
}

// «Nueva jornada» (o editar la nueva): su diálogo, que arranca en el día del taller si ya lo tiene.
const dialogo = ref(false)
const borrador = ref<DatosJornada | null>(null)
function abrirDialogo() {
  borrador.value = eleccion.value.modo === 'nueva' ? { ...eleccion.value.nueva } : datosJornadaVacios(props.fecha)
  dialogo.value = true
}
function usarNueva(datos: DatosJornada) {
  eleccion.value.nueva = datos
  eleccion.value.modo = 'nueva'
}
</script>
