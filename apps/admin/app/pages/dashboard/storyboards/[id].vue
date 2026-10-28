<template>
  <div v-if="loading" class="ui-panel ui-text p-10 text-center">Cargando…</div>

  <!-- La vista lleva el tono del área de su tipo (data-area): números de escena, objetivo y etiqueta -->
  <div v-else-if="storyboard" v-bind="tinte">
    <UiPageHeader :title="storyboard.title" :description="`${storyboard.category} · ${storyboard.targetAge} · ${storyboard.duration}`">
      <template #actions>
        <UiButton icon="calendar" @click="navigateTo('/dashboard/workshops/new?storyboard=' + storyboard.id)">
          Usar en Taller
        </UiButton>
      </template>
    </UiPageHeader>

    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <!-- Columna principal -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Descripción -->
        <section class="ui-panel p-6">
          <h3 class="ui-title mb-3">Descripción</h3>
          <p class="ui-text">{{ storyboard.description }}</p>
          <div v-if="storyboard.objective" class="mt-5 rounded-control border border-(--tone-tint-edge) bg-(--tone-wash) px-5 py-4">
            <p class="eyebrow mb-2 text-(--tone-strong)">Objetivo del taller</p>
            <!-- Guía escrita en Player: texto enriquecido -->
            <div class="prose-guia text-body font-semibold leading-relaxed text-ink" v-html="storyboard.objective" />
          </div>
        </section>

        <!-- Escenas -->
        <section class="ui-panel overflow-hidden">
          <div class="ui-panel-header flex-wrap justify-start gap-2">
            <h3 class="ui-title">Escenas</h3>
            <span class="filter-count">{{ storyboard.scenes.length }}</span>
            <span class="ui-caption ml-auto hidden sm:block">Se ejecutan en orden · cada escena incluye su juego y su guía</span>
          </div>

          <p v-if="!storyboard.scenes.length" class="ui-text px-6 py-6">
            Este storyboard aún no tiene escenas sincronizadas.
          </p>

          <div class="divide-y divide-line">
            <div v-for="(scene, index) in storyboard.scenes" :key="scene.id">
              <!-- Fila de escena -->
              <button
                type="button"
                class="flex w-full items-start gap-3 px-6 py-4 text-left transition-colors hover:bg-canvas"
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
                <UiIcon name="chevron-down" :class="['mt-1 size-4 shrink-0 text-subtle transition-transform duration-200', expandedSet.has(scene.id) ? 'rotate-180' : '']" />
              </button>

              <!-- Guía pedagógica expandida (secciones reales de la escena) -->
              <div v-if="expandedSet.has(scene.id)" class="px-6 pb-5 pl-16">
                <div class="flex flex-col gap-4 rounded-control border border-line bg-canvas px-5 py-4">
                  <p class="eyebrow text-(--tone-strong)">Guía pedagógica de la escena</p>
                  <p v-if="!tieneGuia(scene)" class="ui-text">La guía de esta escena aún no está escrita.</p>
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
          <h3 class="ui-title mb-4">Contenido</h3>
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-caption font-bold text-muted">Estado</span>
              <!-- Publicado = vigente: lima -->
              <UiBadge tone="lime" dot>Publicado</UiBadge>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-caption font-bold text-muted">Escenas</span>
              <span class="text-body font-extrabold text-ink">{{ storyboard.scenes.length || storyboard.scenesCount }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-caption font-bold text-muted">Duración</span>
              <span class="text-body font-extrabold text-ink">{{ storyboard.duration }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-caption font-bold text-muted">Plan</span>
              <UiBadge :tone="TONO_PERTENENCIA[storyboard.pertenencia]">{{ storyboard.pertenencia }}</UiBadge>
            </div>
          </div>
        </section>

        <!-- Clasificación -->
        <section class="ui-panel p-6">
          <h3 class="ui-title mb-4">Clasificación</h3>
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-caption font-bold text-muted">Categoría</span>
              <span class="badge" v-bind="tinte">{{ storyboard.category }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-caption font-bold text-muted">Edición</span>
              <span class="text-body font-extrabold text-ink">{{ storyboard.targetAge }}</span>
            </div>
          </div>
        </section>

        <!-- Público: la edición, con las palabras de la organización -->
        <section v-if="storyboard.publico" class="ui-panel p-6">
          <h3 class="ui-title mb-4">Público</h3>
          <p class="ui-text">{{ storyboard.publico }}</p>
        </section>
      </div>
    </div>
  </div>

  <!-- Not Found -->
  <div v-else class="ui-panel">
    <UiEmptyState
      icon="alert"
      title="Storyboard no encontrado"
      text="El storyboard que buscas no existe o ya no está disponible para tu comunidad."
    >
      <UiButton variant="outline" size="sm" @click="navigateTo('/dashboard/storyboards')">
        Volver a Storyboards
      </UiButton>
    </UiEmptyState>
  </div>
</template>

<script setup lang="ts">
import type { Storyboard, StoryboardScene } from '~/composables/useStoryboards'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const { fetchDetalle } = useStoryboards()

const storyboard = ref<Storyboard | null>(null)
const loading = ref(true)

onMounted(async () => {
  storyboard.value = await fetchDetalle(Number(route.params.id))
  loading.value = false
})

// Pertenencia sin estado: público es el catálogo base (neutro); personalizado, informativo (cielo).
const TONO_PERTENENCIA = { 'Público': 'neutral', 'Personalizado': 'sky' } as const

// El tipo del storyboard es su área educativa. El composable solo trae el nombre traducido,
// así que el área se reconoce por nombre (es/en); un tipo desconocido queda neutro.
const tinte = computed(() => uiAreaAttrs(storyboard.value?.area))

// Secciones de guía con contenido, en el orden de la plantilla de la guía.
function seccionesDe(scene: StoryboardScene) {
  return [
    { label: 'Objetivo', html: scene.objective },
    { label: 'Pedagogía', html: scene.pedagogia },
    { label: 'Preguntas e interacciones sugeridas', html: scene.preguntas },
    { label: 'Psicología', html: scene.psicologia },
    { label: 'Científico', html: scene.cientifico },
    { label: 'Lo que esta escena no hace', html: scene.noHace },
    { label: 'Consejos', html: scene.consejos },
    { label: 'Mecánica', html: scene.mecanica },
    { label: 'Material', html: scene.material },
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
