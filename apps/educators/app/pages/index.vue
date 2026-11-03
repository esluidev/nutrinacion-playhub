<template>
  <!-- Mis talleres: lo que la organización le asignó. El educador no planea; lo mira por día (la vista
       principal: hoy, con el siguiente en grande), por semana o por mes, con la barra de fechas de la
       app original. Ocupa el mismo ancho que la cabecera. -->
  <div class="flex flex-col md:min-h-0 md:flex-1">
    <UiPageHeader :title="t('talleres.saludo', { nombre: educador?.nombre ?? '' })" />
    <CalendarioBarra :con-talleres="conTalleres" />
    <UiAlert v-if="error" tone="warning" :title="t('talleres.error')" class="mb-4">
      <UiButton class="mt-3" variant="outline" icon="retry" @click="cargar">{{ t('talleres.reintentar') }}</UiButton>
    </UiAlert>
    <div v-if="cargando" class="grid place-items-center py-16 md:flex-1"><UiSpinner /></div>
    <template v-else>
      <VistaDia v-if="vista === 'dia'" :fecha="fecha" :talleres="talleres" />
      <VistaSemana v-else-if="vista === 'semana'" :dias="diasDeSemana(fecha)" :por-dia="porDia" />
      <VistaMes v-else :fecha="fecha" :por-dia="porDia" @ver-dia="verDia" />
    </template>
    <TallerAcciones :taller="abierto ? taller(abierto) : undefined" @close="cerrar" />
  </div>
</template>

<script setup lang="ts">
import { diasDeSemana } from '~/utils/calendario'
import { talleresPorDia } from '~/utils/talleres'

const { t } = useT()
const { educador } = useSesion()
const { talleres, taller, cargando, error, cargar } = useTalleres()
const { abierto, cerrar } = useTallerAbierto()
// Al salir hacia el taller, su preparación o el cierre, la ventana no debe reabrirse al volver.
onBeforeUnmount(cerrar)
const { fecha, vista, irA } = useCalendario()

// Al volver se piden otra vez, sin tapar lo que ya se ve: así aparece lo que Admin asignó, movió o
// canceló mientras tanto.
onMounted(() => {
  if (!cargando.value) void cargar()
})

const porDia = computed(() => talleresPorDia(talleres.value))
const conTalleres = computed(() => new Set(Object.keys(porDia.value)))

function verDia(iso: string) {
  irA(iso)
  vista.value = 'dia'
}

useHead({ title: computed(() => t('nav.talleres')) })
</script>
