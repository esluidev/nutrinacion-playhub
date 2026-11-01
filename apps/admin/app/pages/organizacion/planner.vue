<template>
  <!-- El planificador: los talleres y sus jornadas (decisión 011). La semana con sus bandas y el
       mes con sus marcas; al pulsar una se abre su panel, desde donde se edita o se borra. Una
       jornada se crea o se elige al programar un taller, no aquí. `?jornada=<id>` abre su panel. -->
  <div>
    <PlannerToolbar />
    <PlannerKanban v-if="activeView === 'kanban'" @abrir-jornada="abierta = $event" />
    <PlannerCalendarGrid v-else @abrir-jornada="abierta = $event" />

    <JornadaPanel :jornada="jornadaAbierta" @close="abierta = null" @editar="editar" />
    <JornadaDialog v-model:open="dialogo" :jornada="editando" @saved="abierta = $event" />
  </div>
</template>

<script setup lang="ts">
import type { JornadaFila } from '~/composables/useJornadas'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const { activeView, getJornada, jornadas, refreshJornadas } = usePlanner()

// Panel abierto (por id: sobrevive al refresco de la lista) y diálogo de edición.
const abierta = ref<number | null>(null)
const dialogo = ref(false)
const editando = ref<JornadaFila | null>(null)

const jornadaAbierta = computed(() => (abierta.value ? getJornada(abierta.value) : null))

function editar() {
  editando.value = jornadaAbierta.value
  abierta.value = null
  dialogo.value = true
}

// Las jornadas cambian fuera de aquí (se crean o se amplían al programar un taller, y la base
// borra la que se queda sin talleres): al entrar se vuelven a pedir.
onMounted(() => {
  refreshJornadas()
})

// Entrando con `?jornada=<id>`: su panel, cuando la lista llegue.
const pedida = Number(route.query.jornada ?? 0)
if (pedida) {
  watch(jornadas, (lista) => {
    if (lista.some(j => j.id === pedida)) abierta.value = pedida
  }, { immediate: true })
}
</script>
