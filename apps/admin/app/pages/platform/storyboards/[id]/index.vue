<template>
  <div v-if="sb">
    <UiPageHeader :title="loc(sb.titulo)" :description="sb.slug">
      <template #actions>
        <!-- El runner vive en Studio: el link se arma con configuracion.studio_url. Sin esa
             clave (o en demo) el botón no aparece — un "Probar" que no abre nada es peor. -->
        <a v-if="urlRunner" :href="urlRunner" target="_blank" rel="noopener" class="btn btn-outline btn-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 3 20 12 6 21V3z" /></svg>
          {{ t('platform.sbs.test') }}
        </a>
        <UiButton @click="navigateTo(`/platform/storyboards/${sb.id}/editar`)">
          <UiIcon name="edit" class="w-4 h-4" />
          {{ t('common.edit') }}
        </UiButton>
      </template>
    </UiPageHeader>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- Lo editorial (solo lectura acá; se cambia en Editar) -->
      <div class="card p-6 lg:col-span-2">
        <div class="flex items-center gap-2 mb-4">
          <h3 class="section-title">{{ t('platform.sbs.information') }}</h3>
          <UiBadge :variant="estadoVariant(sb.estado)" dot>{{ t('sbState.' + sb.estado) }}</UiBadge>
          <UiBadge v-if="sb.organizaciones" variant="purple">{{ sb.organizaciones.nombre }}</UiBadge>
          <UiBadge v-else variant="gray">{{ t('platform.sbs.standard') }}</UiBadge>
        </div>
        <div class="space-y-5">
          <div v-for="campo in camposEditoriales" :key="campo.label">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">{{ campo.label }}</p>
            <p :class="['text-sm leading-relaxed', campo.valor ? 'text-gray-600' : 'text-gray-300']">
              {{ campo.valor || t('platform.sbs.emptyField') }}
            </p>
          </div>
          <div class="flex flex-wrap gap-x-8 gap-y-2 pt-1">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{{ t('platform.sbs.fDuration') }}</p>
              <p class="text-sm font-bold text-gray-800">{{ sb.duracion_min ? `${sb.duracion_min} min` : '—' }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{{ t('platform.sbs.fCountries') }}</p>
              <p class="text-sm font-bold text-gray-800">{{ sb.paises?.length ? sb.paises.join(', ') : t('platform.orgDetail.global') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Lo build-owned: se resincroniza repegando la metadata en Editar -->
      <div class="card p-0">
        <div class="px-5 pt-5 pb-3">
          <h3 class="section-title">{{ t('platform.sbs.fromBuildShort') }}</h3>
          <p class="text-xs text-gray-400 mt-0.5">{{ t('platform.sbs.fromBuildDesc') }}</p>
        </div>
        <dl class="px-5 pb-3 divide-y divide-gray-100">
          <div v-for="d in datosDelBuild" :key="d.label" class="flex items-baseline justify-between gap-2 py-2.5">
            <dt class="text-xs text-gray-400 shrink-0">{{ d.label }}</dt>
            <dd class="text-[13px] font-bold text-gray-800 font-mono truncate" :title="d.valor">{{ d.valor }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <!-- Escenas: la guía pedagógica se escribe por escena -->
    <UiDataTable
      :columns="columnasEscenas"
      :rows="sb.escenas"
      :row-key="(e) => e.id"
      :empty-text="t('platform.sbs.noScenes')"
      clickable
      @row-click="(e) => navigateTo(`/platform/storyboards/${sb!.id}/escenas/${e.id}`)"
    >
      <template #cell-orden="{ row }">
        <span class="text-xs font-display font-semibold text-gray-400">{{ row.orden }}</span>
      </template>
      <template #cell-escena="{ row }">
        <p class="font-extrabold text-gray-800">{{ loc(row.titulo) }}</p>
        <p class="text-[12.5px] text-gray-400 font-mono">scenes/{{ row.folder }}/</p>
      </template>
      <template #cell-guia="{ row }">
        <span class="inline-flex items-center gap-2">
          <span :class="['w-2 h-2 rounded-full shrink-0', dotGuia(row)]" />
          <span class="text-[13px] text-gray-500 font-semibold">{{ t('platform.sbs.guideProgress', { n: avanceGuia(row) }) }}</span>
        </span>
      </template>
      <template #cell-acciones="{ row }">
        <div class="flex items-center justify-end gap-1.5">
          <NuxtLink :to="`/platform/storyboards/${sb!.id}/escenas/${row.id}`" class="btn btn-outline btn-sm" @click.stop>
            {{ t('platform.sbs.editGuide') }}
          </NuxtLink>
          <a
            v-if="urlRunner"
            :href="`${urlRunner}&start=${row.orden - 1}`"
            target="_blank"
            rel="noopener"
            class="btn btn-ghost btn-sm !px-2"
            :title="t('platform.sbs.testScene')"
            @click.stop
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 3 20 12 6 21V3z" /></svg>
          </a>
        </div>
      </template>
    </UiDataTable>
  </div>

  <div v-else-if="!cargando" class="card p-12 text-center">
    <p class="text-gray-500 font-semibold mb-1">{{ t('platform.sbs.notFound') }}</p>
    <UiButton variant="outline" size="sm" class="mt-3" @click="navigateTo('/platform/storyboards')">
      {{ t('platform.orgDetail.back') }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import type { EscenaFila, StoryboardDetalle } from '~/composables/usePlatformStoryboards'
import { seccionesGuia } from '~/composables/usePlatformStoryboards'
import type { Localized } from '~/utils/types'

definePageMeta({ layout: 'dashboard', titleKey: 'platform.sbs.title', descKey: 'platform.sbs.desc' })

const { t, locale } = useT()
const route = useRoute()
const { getStoryboard, getStudioUrl } = usePlatformStoryboards()

const sb = ref<StoryboardDetalle | null>(null)
const cargando = ref(true)
const studioUrl = ref<string | null>(null)

function loc(valor: Localized | null | undefined): string {
  if (!valor) return ''
  return valor[locale.value] ?? valor.es ?? Object.values(valor).find(v => !!v) ?? ''
}

onMounted(async () => {
  const id = Number(route.params.id)
  ;[sb.value, studioUrl.value] = await Promise.all([
    Number.isFinite(id) ? getStoryboard(id) : Promise.resolve(null),
    getStudioUrl(),
  ])
  cargando.value = false
})

// /play/<tipo-slug>/<slug>?lang=es — el tipo viaja como código (ACTIVIDAD_FISICA) y la ruta
// del runner usa minúscula-guion.
const urlRunner = computed(() => {
  if (!studioUrl.value || !sb.value?.tipo) return null
  const tipoSlug = sb.value.tipo.codigo.toLowerCase().replace(/_/g, '-')
  return `${studioUrl.value}/play/${tipoSlug}/${sb.value.slug}?lang=es`
})

const camposEditoriales = computed(() => {
  if (!sb.value) return []
  return [
    { label: t('platform.sbs.fDescription'), valor: loc(sb.value.descripcion) },
    { label: t('platform.sbs.fObjective'), valor: loc(sb.value.objetivo) },
    { label: t('platform.sbs.fBibliography'), valor: loc(sb.value.bibliografia) },
  ]
})

function nombreIdioma(codigo: string): string {
  const etiqueta = t('lang.' + codigo)
  return etiqueta === 'lang.' + codigo ? codigo.toUpperCase() : etiqueta
}

const datosDelBuild = computed(() => {
  if (!sb.value) return []
  return [
    { label: t('platform.sbs.colType'), valor: sb.value.tipo?.codigo ?? '—' },
    { label: t('platform.sbs.fCategory'), valor: sb.value.categoria?.codigo ?? '—' },
    { label: t('platform.sbs.fAudience'), valor: sb.value.audiencia?.codigo ?? '—' },
    { label: t('platform.sbs.fScenes'), valor: String(sb.value.numero_escenas) },
    { label: t('platform.sbs.fLanguages'), valor: (sb.value.idiomas ?? []).map(nombreIdioma).join(' · ') },
    { label: t('platform.sbs.fKey'), valor: sb.value.clave },
  ]
})

const columnasEscenas = computed(() => [
  { key: 'orden', label: '#' },
  { key: 'escena', label: t('platform.sbs.colScene') },
  { key: 'guia', label: t('platform.sbs.colGuide') },
  { key: 'acciones', label: '', align: 'right' as const },
])

// Avance de la guía en ESPAÑOL (el idioma base del contenido): secciones con texto de las 7.
function avanceGuia(escena: EscenaFila): number {
  return seccionesGuia.filter(s => !!escena[s]?.es?.trim()).length
}

// `mecanica` se llena cuando el juego está listo: la guía se considera completa con las
// otras 6 (misma regla que usaba Studio).
function dotGuia(escena: EscenaFila): string {
  const sinMecanica = seccionesGuia.filter(s => s !== 'mecanica' && !!escena[s]?.es?.trim()).length
  if (sinMecanica >= 6) return 'bg-brand-primary-500'
  return avanceGuia(escena) > 0 ? 'bg-amber-400' : 'bg-gray-200'
}

function estadoVariant(estado: string) {
  switch (estado) {
    case 'PUBLICADO': return 'green' as const
    case 'EN_REVISION': return 'amber' as const
    case 'ARCHIVADO': return 'coral' as const
    default: return 'gray' as const
  }
}
</script>
