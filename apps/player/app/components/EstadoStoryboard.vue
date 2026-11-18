<template>
  <!-- El estado de un storyboard en una celda: sin registrar, o su estado de publicación. «Desactualizado»
       solo aparece cuando hace falta: el JSON cambió desde el último registro (se actualiza en el detalle). -->
  <div class="flex flex-wrap items-center gap-1.5">
    <UiBadge v-if="base === 'sin_registrar' || !publicacion" :tone="ESTADO_CATALOGO.sin_registrar.tone" dot :title="ESTADO_CATALOGO.sin_registrar.desc">
      {{ ESTADO_CATALOGO.sin_registrar.label }}
    </UiBadge>
    <template v-else>
      <UiBadge :tone="uiPublicationTone(publicacion)" dot :title="ESTADO_PUBLICACION[publicacion].desc">
        {{ ESTADO_PUBLICACION[publicacion].label }}
      </UiBadge>
      <UiBadge v-if="base === 'desactualizado'" :tone="ESTADO_CATALOGO.desactualizado.tone" dot :title="ESTADO_CATALOGO.desactualizado.desc">
        {{ ESTADO_CATALOGO.desactualizado.label }}
      </UiBadge>
    </template>
  </div>
</template>

<script setup lang="ts">
import { uiPublicationTone } from '@playhub/ui/app/utils/ui-tones'
import { ESTADO_CATALOGO, ESTADO_PUBLICACION } from '~/utils/catalogoResumen'
import type { EstadoPublicacion } from '~/utils/catalogoResumen'
import type { EstadoCatalogo } from '~/utils/storyboardMetadata'

defineProps<{ base: EstadoCatalogo, publicacion: EstadoPublicacion | null }>()
</script>
