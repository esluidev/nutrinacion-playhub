<template>
  <div v-if="sb">
    <UiPageHeader :title="loc(sb.titulo)" :description="sb.slug">
      <template #actions>
        <!-- El runner vive en Player: el enlace se arma con la URL de Player de `configuraciones`. Sin esa
             clave (o en demo) el botón no aparece — un "Probar" que no abre nada es peor. -->
        <UiButton v-if="urlRunner" tone="neutral" icon="play" :href="urlRunner" target="_blank" rel="noopener">
          {{ t('platform.sbs.test') }}
        </UiButton>
        <!-- Aquí solo se ve (decisión 013): el storyboard, su publicación y su guía se cambian en Player. -->
        <UiButton v-if="urlEnPlayer" tone="neutral" icon="external" :href="urlEnPlayer" target="_blank" rel="noopener">
          {{ t('platform.sbs.editInPlayer') }}
        </UiButton>
      </template>
    </UiPageHeader>

    <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- La cabecera de la guía y la publicación: se escriben en Player. -->
      <div class="ui-panel p-6 lg:col-span-2">
        <div class="mb-4 flex flex-wrap items-center gap-2">
          <h3 class="ui-title">{{ t('platform.sbs.information') }}</h3>
          <UiBadge :tone="uiPublicationTone(sb.estado_publicacion)" dot>{{ t('sbState.' + sb.estado_publicacion) }}</UiBadge>
          <UiBadge v-if="sb.organizaciones" :tone="uiToneFor(sb.organizaciones.nombre)">{{ sb.organizaciones.nombre }}</UiBadge>
          <UiBadge v-else tone="neutral">{{ t('platform.sbs.standard') }}</UiBadge>
        </div>
        <div class="space-y-5">
          <div v-for="campo in camposEditoriales" :key="campo.label">
            <p class="eyebrow mb-1.5">{{ campo.label }}</p>
            <p :class="['ui-text', !campo.valor && 'text-disabled']">
              {{ campo.valor || t('platform.sbs.emptyField') }}
            </p>
          </div>
          <div class="flex flex-wrap gap-x-8 gap-y-2 pt-1">
            <div>
              <p class="eyebrow mb-1">{{ t('platform.sbs.fDuration') }}</p>
              <p class="text-body font-extrabold text-ink">{{ sb.duracion_min ? `${sb.duracion_min} min` : '—' }}</p>
            </div>
            <div>
              <p class="eyebrow mb-1">{{ t('platform.sbs.fCountries') }}</p>
              <p class="text-body font-extrabold text-ink">{{ sb.paises_disponibles.length ? sb.paises_disponibles.join(', ') : t('platform.sbs.noCountries') }}</p>
            </div>
            <!-- La app del hogar (tarea 022): se decide en Player, como el resto de la publicación. -->
            <div>
              <p class="eyebrow mb-1">{{ t('platform.sbs.fHome') }}</p>
              <p class="text-body font-extrabold text-ink">{{ sb.publicado_hogar ? t('platform.sbs.homeYes') : t('platform.sbs.homeNo') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Lo que viene del JSON del storyboard: lo registra Player. -->
      <div class="ui-panel">
        <div class="px-5 pb-3 pt-5">
          <h3 class="ui-title">{{ t('platform.sbs.fromBuildShort') }}</h3>
          <p class="ui-caption mt-0.5">{{ t('platform.sbs.fromBuildDesc') }}</p>
        </div>
        <dl class="divide-y divide-line px-5 pb-3">
          <div v-for="d in datosDelBuild" :key="d.label" class="flex items-baseline justify-between gap-2 py-2.5">
            <dt class="ui-caption shrink-0">{{ d.label }}</dt>
            <dd class="truncate font-mono text-body font-extrabold text-ink" :title="d.valor">{{ d.valor }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <!-- Escenas: toda la fila abre su guía, para leerla; probar una escena es secundario (neutro),
         como el «Probar» del encabezado. -->
    <section class="ui-panel overflow-hidden">
      <div class="ui-panel-header">
        <h3 class="ui-title">{{ t('platform.sbs.fScenes') }}</h3>
      </div>
      <p v-if="!sb.escenas.length" class="ui-text px-6 py-14 text-center">{{ t('platform.sbs.noScenes') }}</p>
      <ol v-else class="divide-y divide-line">
        <li
          v-for="escena in sb.escenas"
          :key="escena.id"
          class="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3.5 transition-colors hover:bg-canvas"
          @click="navigateTo(`/platform/storyboards/${sb!.clave}/escenas/${escena.carpeta}`)"
        >
          <!-- El número lleva el tono del área del storyboard, como su portada en el catálogo. -->
          <span class="ui-symbol ui-symbol-sm" v-bind="tinte" aria-hidden="true">{{ escena.orden }}</span>
          <div class="min-w-0 flex-1">
            <p class="truncate font-extrabold text-ink">{{ loc(escena.titulo) }}</p>
            <p class="truncate font-mono text-caption text-muted">scenes/{{ escena.carpeta }}/</p>
          </div>
          <UiBadge :tone="tonoGuia(escena)" dot class="shrink-0" :title="t('platform.sbs.colGuide')">
            {{ t('platform.sbs.guideProgress', { n: avanceGuia(escena) }) }}
          </UiBadge>
          <div class="flex shrink-0 items-center gap-1.5">
            <UiButton
              v-if="urlRunner"
              tone="neutral"
              size="sm"
              icon="play"
              icon-only
              :label="t('platform.sbs.testScene')"
              :title="t('platform.sbs.testScene')"
              :href="urlEscena(escena.carpeta) ?? undefined"
              target="_blank"
              rel="noopener"
              @click.stop
            />
          </div>
        </li>
      </ol>
    </section>
  </div>

  <UiCard v-else-if="!cargando">
    <UiEmptyState icon="search" :title="t('platform.sbs.notFound')">
      <UiButton tone="neutral" size="sm" @click="navigateTo('/platform/storyboards')">
        {{ t('platform.orgDetail.back') }}
      </UiButton>
    </UiEmptyState>
  </UiCard>
</template>

<script setup lang="ts">
import type { EscenaFila, StoryboardDetalle } from '~/composables/usePlatformStoryboards'
import { runnerUrl } from '@playhub/ui/app/utils/runner-contract'
import { seccionesGuia, urlGestionEnPlayer } from '~/composables/usePlatformStoryboards'
import type { Localized } from '~/utils/types'

definePageMeta({ layout: 'dashboard', titleKey: 'platform.sbs.title', descKey: 'platform.sbs.desc' })

const { t, locale } = useT()
const route = useRoute()
const { getStoryboard, getPlayerUrl } = usePlatformStoryboards()

const sb = ref<StoryboardDetalle | null>(null)
const cargando = ref(true)
const playerUrl = ref<string | null>(null)

function loc(valor: Localized | null | undefined): string {
  if (!valor) return ''
  return valor[locale.value] ?? valor.es ?? Object.values(valor).find(v => !!v) ?? ''
}

onMounted(async () => {
  ;[sb.value, playerUrl.value] = await Promise.all([
    getStoryboard(String(route.params.clave)),
    getPlayerUrl(),
  ])
  cargando.value = false
})

// El runner de Player en modo educador, por la clave del storyboard (docs/runner.md).
const urlRunner = computed(() => urlEscena())
// Donde se cambia: su detalle en la gestión de Player.
const urlEnPlayer = computed(() => (playerUrl.value && sb.value
  ? urlGestionEnPlayer(playerUrl.value, sb.value.clave)
  : null))
function urlEscena(escena?: string): string | null {
  if (!playerUrl.value || !sb.value) return null
  return runnerUrl(playerUrl.value, {
    clave: sb.value.clave, modo: 'educator', idioma: sb.value.idiomas[0], escena,
  })
}

const camposEditoriales = computed(() => {
  if (!sb.value) return []
  return [
    { label: t('platform.sbs.fDescription'), valor: loc(sb.value.guia?.descripcion) },
    { label: t('platform.sbs.fObjective'), valor: loc(sb.value.guia?.objetivo) },
    { label: t('platform.sbs.fPublic'), valor: loc(sb.value.guia?.publico) },
    ...(sb.value.organizacion_id ? [{ label: t('platform.sbs.fAdaptedTo'), valor: loc(sb.value.guia?.adaptado_a) }] : []),
    { label: t('platform.sbs.fGuideVersion'), valor: sb.value.guia?.version ?? '' },
  ]
})

function nombreIdioma(codigo: string): string {
  const etiqueta = t('lang.' + codigo)
  return etiqueta === 'lang.' + codigo ? codigo.toUpperCase() : etiqueta
}

const datosDelBuild = computed(() => {
  if (!sb.value) return []
  return [
    { label: t('platform.sbs.colType'), valor: t('catalogo.categoria.' + sb.value.categoria) },
    { label: t('platform.sbs.fCategory'), valor: sb.value.subcategoria ? t('catalogo.subcategoria.' + sb.value.subcategoria) : '—' },
    { label: t('platform.sbs.fAudience'), valor: t('catalogo.edicion.' + sb.value.edicion) },
    { label: t('platform.sbs.fHealthFocus'), valor: sb.value.enfoques_salud.map(e => t('catalogo.enfoque.' + e)).join(' · ') || '—' },
    { label: t('platform.sbs.fScenes'), valor: String(sb.value.numero_escenas) },
    { label: t('platform.sbs.fLanguages'), valor: (sb.value.idiomas ?? []).map(nombreIdioma).join(' · ') },
    { label: t('platform.sbs.fBuildVersion'), valor: sb.value.version_build ?? '—' },
    { label: t('platform.sbs.fKey'), valor: sb.value.clave },
  ]
})

// El área educativa del storyboard (ALIMENTACION → alimentacion): `data-area` la tiñe; sin área, neutro.
const tinte = computed<Record<string, string>>(() => uiAreaAttrs(uiAreaOf(sb.value?.categoria)))

// Avance de la guía en ESPAÑOL (el idioma base del contenido): secciones con texto de las 12.
function avanceGuia(escena: EscenaFila): number {
  return seccionesGuia.filter(s => !!escena[s]?.es?.trim()).length
}

// Mecánica y material se completan cuando el juego está implementado (plantilla de la guía):
// la guía está completa con las otras 10. Completa en lima, empezada en sol (pendiente), sin
// empezar en neutro.
const SECCIONES_DEL_JUEGO = ['mecanica', 'material']
function tonoGuia(escena: EscenaFila) {
  const escritas = seccionesGuia.filter(s => !SECCIONES_DEL_JUEGO.includes(s) && !!escena[s]?.es?.trim()).length
  if (escritas >= seccionesGuia.length - SECCIONES_DEL_JUEGO.length) return 'lime' as const
  return avanceGuia(escena) > 0 ? 'sun' as const : 'neutral' as const
}

</script>
