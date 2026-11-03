<template>
  <div v-if="loading" class="ui-panel ui-text p-10 text-center">{{ t('common.loading') }}</div>

  <!-- La vista lleva el tono del área de su tipo (data-area): números de escena, objetivo y etiqueta -->
  <div v-else-if="storyboard" v-bind="tinte">
    <UiPageHeader :title="storyboard.title" :description="`${storyboard.category} · ${storyboard.targetAge} · ${storyboard.duration}`">
      <template #actions>
        <UiButton icon="calendar" @click="navigateTo('/organizacion/workshops/new?storyboard=' + storyboard.id)">
          {{ t('storyboards.useInWorkshop') }}
        </UiButton>
      </template>
    </UiPageHeader>

    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <!-- Columna principal -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Vista previa: el storyboard en el runner de Player en modo `preview` (docs/runner.md): solo
             el escenario, como lo ve el grupo, sin los controles del taller (salir, tiempo, puntos,
             ajustes, guía). Conduce Admin, al pie: la escena, reiniciar, anterior y siguiente.
             «Pantalla Completa» pone el panel entero, con esos controles, a pantalla completa. -->
        <section
          v-if="urlVista"
          ref="vista"
          :class="['ui-panel scroll-mt-20 overflow-hidden', pantallaCompleta && 'flex flex-col']"
        >
          <div class="ui-panel-header">
            <div class="min-w-0">
              <h3 class="ui-title">{{ t('storyboards.preview') }}</h3>
              <p class="ui-caption mt-0.5">{{ t('storyboards.previewText') }}</p>
            </div>
            <UiButton tone="neutral" size="sm" :icon="pantallaCompleta ? 'compress' : 'expand'" @click="alternarPantallaCompleta">
              {{ pantallaCompleta ? t('storyboards.exitFullScreen') : t('storyboards.fullScreen') }}
            </UiButton>
          </div>
          <div :class="pantallaCompleta ? 'min-h-0 flex-1' : 'aspect-video'">
            <UiRunner ref="runner" :src="urlVista" :title="storyboard.title" @ready="(e) => total = e.escenas" @scene="(e) => actual = e.indice" />
          </div>
          <!-- El pie en blanco, como la cabecera: el gris es el escenario del runner -->
          <div class="ui-panel-footer flex flex-wrap items-center gap-3">
            <p class="min-w-0 flex-1 truncate text-body font-bold text-muted">
              <template v-if="total">
                <span class="font-extrabold text-ink">{{ t('storyboards.sceneOf', { n: actual + 1, total }) }}</span><span v-if="tituloActual"> · {{ tituloActual }}</span>
              </template>
            </p>
            <UiButton tone="neutral" icon="retry" :disabled="!total" @click="runner?.reiniciar()">{{ t('storyboards.restartScene') }}</UiButton>
            <UiButton variant="outline" icon="arrow-left" :disabled="!total || actual === 0" @click="runner?.ir(actual - 1)">{{ t('common.previous') }}</UiButton>
            <UiButton variant="outline" icon-right="arrow-right" :disabled="!total || actual >= total - 1" @click="runner?.ir(actual + 1)">{{ t('common.next') }}</UiButton>
          </div>
        </section>

        <!-- Descripción -->
        <section class="ui-panel p-6">
          <h3 class="ui-title mb-3">{{ t('storyboards.description') }}</h3>
          <p class="ui-text">{{ storyboard.description }}</p>
          <div v-if="storyboard.objective" class="mt-5 rounded-control border border-(--tone-tint-edge) bg-(--tone-wash) px-5 py-4">
            <p class="eyebrow mb-2 text-(--tone-strong)">{{ t('storyboards.objective') }}</p>
            <!-- Guía escrita en Player: texto enriquecido -->
            <div class="prose-guia text-body font-semibold leading-relaxed text-ink" v-html="storyboard.objective" />
          </div>
        </section>

        <!-- Escenas -->
        <section class="ui-panel overflow-hidden">
          <div class="ui-panel-header flex-wrap justify-start gap-2">
            <h3 class="ui-title">{{ t('storyboards.scenesTitle') }}</h3>
            <span class="filter-count">{{ storyboard.scenes.length }}</span>
            <span class="ui-caption ml-auto hidden sm:block">{{ t('storyboards.scenesHelp') }}</span>
          </div>

          <p v-if="!storyboard.scenes.length" class="ui-text px-6 py-6">
            {{ t('storyboards.noScenes') }}
          </p>

          <div class="divide-y divide-line">
            <div v-for="(scene, index) in storyboard.scenes" :key="scene.id">
              <!-- Fila de escena: abre su guía; «Ver escena» la pone en la vista previa -->
              <div class="flex items-start">
                <button
                  type="button"
                  class="flex min-w-0 flex-1 items-start gap-3 py-4 pl-6 text-left transition-colors hover:bg-canvas"
                  @click="toggle(scene.id)"
                >
                  <span class="ui-symbol ui-symbol-sm">{{ index + 1 }}</span>
                  <div class="min-w-0 flex-1">
                    <p class="text-body font-extrabold text-ink">
                      {{ scene.title }}<span v-if="scene.subtitle" class="font-semibold text-muted">: {{ scene.subtitle }}</span>
                    </p>
                    <p v-if="scene.verb" class="eyebrow mt-1">{{ scene.verb }}</p>
                    <p v-if="scene.description" class="ui-caption mt-1">{{ scene.description }}</p>
                  </div>
                  <UiIcon name="chevron-down" :class="['mr-3 mt-1 size-4 shrink-0 text-subtle transition-transform duration-200', expandedSet.has(scene.id) ? 'rotate-180' : '']" />
                </button>
                <UiButton
                  v-if="urlVista && scene.carpeta"
                  tone="neutral"
                  size="sm"
                  icon="play"
                  icon-only
                  class="my-3 mr-6"
                  :label="t('storyboards.viewScene')"
                  :title="t('storyboards.viewScene')"
                  @click="verEscena(scene.carpeta)"
                />
              </div>

              <!-- Guía pedagógica expandida (secciones reales de la escena) -->
              <div v-if="expandedSet.has(scene.id)" class="px-6 pb-5 pl-16">
                <div class="flex flex-col gap-4 rounded-control border border-line bg-canvas px-5 py-4">
                  <p class="eyebrow text-(--tone-strong)">{{ t('storyboards.guide') }}</p>
                  <p v-if="!tieneGuia(scene)" class="ui-text">{{ t('storyboards.noGuide') }}</p>
                  <div v-for="seccion in seccionesDe(scene)" :key="seccion.label">
                    <p class="eyebrow mb-1">{{ seccion.label }}</p>
                    <div class="prose-guia ui-text" v-html="seccion.html" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Contenido -->
        <section class="ui-panel p-6">
          <h3 class="ui-title mb-4">{{ t('storyboards.content') }}</h3>
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-caption font-bold text-muted">{{ t('storyboards.state') }}</span>
              <!-- Publicado = vigente: lima -->
              <UiBadge tone="lime" dot>{{ t('sbState.PUBLICADO') }}</UiBadge>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-caption font-bold text-muted">{{ t('storyboards.scenesTitle') }}</span>
              <span class="text-body font-extrabold text-ink">{{ storyboard.scenes.length || storyboard.scenesCount }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-caption font-bold text-muted">{{ t('storyboards.duration') }}</span>
              <span class="text-body font-extrabold text-ink">{{ storyboard.duration }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-caption font-bold text-muted">{{ t('storyboards.ownership') }}</span>
              <UiBadge :tone="TONO_PERTENENCIA[storyboard.pertenencia]">{{ t(`storyboards.${storyboard.pertenencia}`) }}</UiBadge>
            </div>
          </div>
        </section>

        <!-- Clasificación -->
        <section class="ui-panel p-6">
          <h3 class="ui-title mb-4">{{ t('storyboards.classification') }}</h3>
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-caption font-bold text-muted">{{ t('storyboards.category') }}</span>
              <span class="badge" v-bind="tinte">{{ storyboard.category }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-caption font-bold text-muted">{{ t('storyboards.edition') }}</span>
              <span class="text-body font-extrabold text-ink">{{ storyboard.targetAge }}</span>
            </div>
          </div>
        </section>

        <!-- Público: la edición, con las palabras de la organización -->
        <section v-if="storyboard.publico" class="ui-panel p-6">
          <h3 class="ui-title mb-4">{{ t('storyboards.audience') }}</h3>
          <p class="ui-text">{{ storyboard.publico }}</p>
        </section>
      </div>
    </div>
  </div>

  <!-- Not Found -->
  <div v-else class="ui-panel">
    <UiEmptyState
      icon="alert"
      :title="t('storyboards.notFound')"
      :text="t('storyboards.notFoundText')"
    >
      <UiButton variant="outline" size="sm" @click="navigateTo('/organizacion/storyboards')">
        {{ t('storyboards.backToList') }}
      </UiButton>
    </UiEmptyState>
  </div>
</template>

<script setup lang="ts">
import { runnerUrl } from '@playhub/ui/app/utils/runner-contract'
import UiRunner from '@playhub/ui/app/components/ui/UiRunner.vue'
import { urlDePlayer } from '~/composables/useStoryboards'
import type { Storyboard, StoryboardScene } from '~/composables/useStoryboards'

definePageMeta({ layout: 'dashboard' })

const { t, locale } = useT()
const route = useRoute()
const { fetchDetalle } = useStoryboards()

const storyboard = ref<Storyboard | null>(null)
const loading = ref(true)

const playerUrl = ref<string | null>(null)

onMounted(async () => {
  ;[storyboard.value, playerUrl.value] = await Promise.all([fetchDetalle(Number(route.params.id)), urlDePlayer()])
  loading.value = false
})

// La vista previa: el runner en modo `preview`, en el idioma de la interfaz si el storyboard lo
// tiene; si no, en el primero de los suyos. Sin URL de Player (demo) o sin área, no se muestra.
// Admin conduce: el runner dice cuántas escenas tiene (`listo`) y en cuál está (`escena`).
const vista = ref<HTMLElement | null>(null)
const runner = ref<InstanceType<typeof UiRunner> | null>(null)
const total = ref(0)
const actual = ref(0)
const urlVista = computed(() => {
  const sb = storyboard.value
  if (!playerUrl.value || !sb?.area) return null
  const idioma = sb.languages.includes(locale.value) ? locale.value : sb.languages[0]
  return runnerUrl(playerUrl.value, { eje: sb.area, slug: sb.slug, modo: 'preview', idioma })
})
const tituloActual = computed(() => storyboard.value?.scenes[actual.value]?.title ?? '')

function verEscena(carpeta: string) {
  runner.value?.ir(carpeta)
  vista.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Pantalla completa: el panel entero, con los controles de Admin.
const pantallaCompleta = ref(false)
function alternarPantallaCompleta() {
  if (document.fullscreenElement) void document.exitFullscreen()
  else void vista.value?.requestFullscreen()
}
const alCambiarPantalla = () => (pantallaCompleta.value = document.fullscreenElement === vista.value)
onMounted(() => document.addEventListener('fullscreenchange', alCambiarPantalla))
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', alCambiarPantalla))

// Pertenencia sin estado: público es el catálogo base (neutro); personalizado, informativo (cielo).
const TONO_PERTENENCIA = { publico: 'neutral', personalizado: 'sky' } as const

// El tipo del storyboard es su área educativa: tiñe la vista con data-area.
const tinte = computed(() => uiAreaAttrs(storyboard.value?.area))

// Secciones de guía con contenido, en el orden de la plantilla de la guía (los títulos, los de Platform).
function seccionesDe(scene: StoryboardScene) {
  return [
    { label: t('platform.sbs.g_objetivo'), html: scene.objective },
    { label: t('platform.sbs.g_pedagogia'), html: scene.pedagogia },
    { label: t('platform.sbs.g_preguntas'), html: scene.preguntas },
    { label: t('platform.sbs.g_psicologia'), html: scene.psicologia },
    { label: t('platform.sbs.g_cientifico'), html: scene.cientifico },
    { label: t('platform.sbs.g_no_hace'), html: scene.noHace },
    { label: t('platform.sbs.g_consejos'), html: scene.consejos },
    { label: t('platform.sbs.g_mecanica'), html: scene.mecanica },
    { label: t('platform.sbs.g_material'), html: scene.material },
  ].filter(s => !!s.html)
}

function tieneGuia(scene: StoryboardScene) {
  return seccionesDe(scene).length > 0
}

// Estado del acordeón (Set reactivo)
const expandedSet = reactive(new Set<number>())

function toggle(sceneId: number) {
  if (expandedSet.has(sceneId)) {
    expandedSet.delete(sceneId)
  }
  else {
    expandedSet.add(sceneId)
  }
}
</script>

<style scoped>
/* Texto enriquecido de la guía (viene de Player): listas y párrafos legibles */
.prose-guia :deep(ul),
.prose-guia :deep(ol) {
  padding-left: 1.1em;
  list-style: disc;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.prose-guia :deep(ol) {
  list-style: decimal;
}
.prose-guia :deep(p + p) {
  margin-top: 6px;
}
</style>
