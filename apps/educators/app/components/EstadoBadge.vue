<template>
  <UiBadge :tone="UI_SESSION_TONES[estado]" dot>{{ t(`estado.${estado}`) }}</UiBadge>
</template>

<script setup lang="ts">
import { UI_SESSION_TONES } from '@playhub/ui/app/utils/ui-tones'
import type { EstadoTaller } from '~/utils/talleres'

// El mismo estado se ve igual en Admin y Educators (UI_SESSION_TONES): hoy en sol, próximo en
// cielo, sin completar y cancelado en coral, completado en lima.
defineProps<{ estado: EstadoTaller }>()
const { t } = useT()
</script>
