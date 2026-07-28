<template>
  <!-- Hub: solo se ve cuando hay AMBIGÜEDAD real (varios destinos y ninguno guardado). Quien
       tiene un solo destino nunca pasa por aquí; quien ya eligió antes, tampoco. -->
  <div class="max-w-2xl mx-auto py-10">
    <h1 class="text-2xl font-display font-bold text-brand-dark">{{ t('ctx.hubTitle') }}</h1>
    <p class="text-sm text-gray-500 mt-1 mb-6">{{ t('ctx.hubDesc') }}</p>

    <div class="space-y-2">
      <button
        v-for="d in destinos"
        :key="`${d.tipo}-${d.orgId ?? 0}-${d.comunidadId ?? 0}`"
        class="w-full flex items-center gap-3 card p-4 hover:border-brand-primary/40 hover:bg-brand-primary/[0.02] transition-colors text-left"
        @click="irA(d)"
      >
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm"
          :class="d.tipo === 'platform' ? 'bg-brand-purple/10 text-brand-purple' : 'bg-brand-primary/10 text-brand-primary-600'"
        >
          {{ d.etiqueta.charAt(0).toUpperCase() }}
        </div>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-brand-dark truncate">{{ d.etiqueta }}</p>
          <p class="text-xs text-gray-400 truncate">{{ subtitulo(d) }}</p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-300 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Destino } from '~/composables/useContexto'

definePageMeta({ layout: 'dashboard', titleKey: 'ctx.hubTitle' })

const { t } = useT()
const { destinos, irA } = useContexto()

function subtitulo(d: Destino) {
  if (d.tipo === 'platform') return t('ctx.operator')
  if (d.tipo === 'organizacion') return t('ctx.org')
  return d.contexto ?? ''
}
</script>
