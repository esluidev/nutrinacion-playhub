<template>
  <!-- Los botones de un taller en su momento (`accionesDe`), con el verbo de lo que hacen: «Ensayar» antes de su día (el
       runner sin el grupo: no queda anotado), «Ejecutar» el día del taller (con el grupo: empieza de verdad, con los
       dispositivos y el reporte al final) y «Reportar» después. Con `principal`, el primero va en lima: la acción
       principal de la vista; los demás, en contorno. Uno cancelado o ya reportado no tiene botones. -->
  <UiButton
    v-for="(accion, i) in acciones"
    :key="accion"
    :to="RUTAS[accion](taller.id)"
    :variant="principal && i === 0 ? 'primary' : 'outline'"
    :icon="ICONOS[accion]"
  >{{ t(`taller.${accion}`) }}</UiButton>
</template>

<script setup lang="ts">
import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'
import { accionesDe } from '~/utils/talleres'
import type { Accion, Taller } from '~/utils/talleres'

const props = defineProps<{ taller: Taller, principal?: boolean }>()

const { t } = useT()
const ICONOS: Record<Accion, UiIconName> = { ejecutar: 'play', ensayar: 'clapperboard', reportar: 'clipboard' }
// El runner, con su modo en inglés como el del dispositivo (`?mode=device`): `live` para ejecutar, `rehearsal` para
// ensayar; el reporte, aparte.
const RUTAS: Record<Accion, (id: string) => string> = {
  ejecutar: id => `/workshops/${id}/play?mode=live`,
  ensayar: id => `/workshops/${id}/play?mode=rehearsal`,
  reportar: id => `/workshops/${id}/report`,
}
const acciones = computed(() => accionesDe(props.taller))
</script>
