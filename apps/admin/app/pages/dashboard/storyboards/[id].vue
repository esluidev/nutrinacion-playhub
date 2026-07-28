<template>
  <div v-if="loading" class="card p-10 text-center text-sm text-gray-400">Cargando…</div>

  <div v-else-if="storyboard">
    <UiPageHeader :title="storyboard.title" :description="`${storyboard.category} · ${storyboard.targetAge} · ${storyboard.duration}`">
      <template #actions>
        <UiButton @click="navigateTo('/dashboard/workshops/new?storyboard=' + storyboard.id)">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          Usar en Taller
        </UiButton>
      </template>
    </UiPageHeader>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-[22px] items-start">
      <!-- Columna principal -->
      <div class="lg:col-span-2 space-y-[22px]">
        <!-- Descripción -->
        <div class="card p-[22px]">
          <h3 class="text-base font-display font-semibold text-brand-dark mb-2.5">Descripción</h3>
          <p class="text-sm text-gray-600 leading-[1.7]">{{ storyboard.description }}</p>
          <div v-if="storyboard.objective" class="mt-[18px] px-[18px] py-4 bg-brand-primary-50 rounded-[14px] border border-brand-primary-100">
            <p class="text-[10px] font-extrabold tracking-[0.1em] uppercase text-brand-primary-800 mb-2">Objetivo del taller</p>
            <!-- Guía escrita en Studio: texto enriquecido -->
            <div class="prose-guia text-[13.5px] text-gray-800 font-semibold leading-[1.65]" v-html="storyboard.objective" />
          </div>
        </div>

        <!-- Escenas -->
        <div class="card overflow-hidden">
          <div class="px-6 py-5 flex items-center gap-[9px] flex-wrap">
            <h3 class="text-base font-display font-semibold text-brand-dark">Escenas</h3>
            <span class="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-brand-primary-50 text-[11px] font-extrabold text-brand-primary-800 px-[7px]">
              {{ storyboard.scenes.length }}
            </span>
            <span class="ml-auto text-xs text-gray-400 font-semibold hidden sm:block">Se ejecutan en orden · cada escena incluye su juego y su guía</span>
          </div>

          <p v-if="!storyboard.scenes.length" class="px-6 pb-6 text-sm text-gray-400">
            Este storyboard aún no tiene escenas sincronizadas.
          </p>

          <div v-for="(scene, index) in storyboard.scenes" :key="scene.id" class="border-t border-gray-100">
            <!-- Fila de escena -->
            <button
              class="w-full text-left px-6 py-[15px] flex items-start gap-3.5 hover:bg-gray-50 transition-colors"
              @click="toggle(scene.id)"
            >
              <div class="w-[30px] h-[30px] rounded-[10px] bg-brand-primary-50 text-brand-primary-800 flex items-center justify-center font-display font-semibold text-sm shrink-0">
                {{ index + 1 }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[14.5px] font-extrabold text-gray-800">{{ scene.title }}</p>
                <p v-if="scene.description" class="text-[12.5px] text-gray-500 mt-1 leading-[1.55]">{{ scene.description }}</p>
              </div>
              <svg
                :class="['w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform duration-200', expandedSet.has(scene.id) ? 'rotate-180' : '']"
                fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            <!-- Guía pedagógica expandida (secciones reales de la escena) -->
            <div v-if="expandedSet.has(scene.id)" class="px-6 pb-5 pl-[68px]">
              <div class="bg-brand-tint border border-gray-100 rounded-[14px] px-5 py-[18px] flex flex-col gap-[15px]">
                <p class="text-[10px] font-extrabold tracking-[0.1em] uppercase text-brand-primary">Guía pedagógica de la escena</p>
                <p v-if="!tieneGuia(scene)" class="text-[13px] text-gray-400 font-semibold">La guía de esta escena aún no está escrita.</p>
                <div v-for="seccion in seccionesDe(scene)" :key="seccion.label">
                  <p class="text-[10px] font-extrabold tracking-[0.1em] uppercase text-gray-400 mb-1">{{ seccion.label }}</p>
                  <div class="prose-guia text-[13px] text-gray-700 font-semibold leading-[1.6]" v-html="seccion.html" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-[22px]">
        <!-- Contenido -->
        <div class="card p-[22px]">
          <h3 class="text-base font-display font-semibold text-brand-dark mb-4">Contenido</h3>
          <div class="flex flex-col gap-[13px]">
            <div class="flex items-center justify-between">
              <span class="text-[12.5px] text-gray-500 font-bold">Estado</span>
              <UiBadge variant="green" dot>Publicado</UiBadge>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[12.5px] text-gray-500 font-bold">Escenas</span>
              <span class="text-[13px] font-extrabold text-gray-800">{{ storyboard.scenes.length || storyboard.scenesCount }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[12.5px] text-gray-500 font-bold">Duración</span>
              <span class="text-[13px] font-extrabold text-gray-800">{{ storyboard.duration }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[12.5px] text-gray-500 font-bold">Plan</span>
              <span :class="['badge', storyboard.plan === 'Personalizado' ? 'badge-purple' : 'badge-green']">{{ storyboard.plan }}</span>
            </div>
          </div>
        </div>

        <!-- Clasificación -->
        <div class="card p-[22px]">
          <h3 class="text-base font-display font-semibold text-brand-dark mb-4">Clasificación</h3>
          <div class="flex flex-col gap-[13px]">
            <div class="flex items-center justify-between">
              <span class="text-[12.5px] text-gray-500 font-bold">Tipo</span>
              <span class="inline-flex items-center text-[11.5px] font-bold px-[11px] py-1 rounded-full bg-brand-primary-50 text-brand-primary-800">{{ storyboard.category }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[12.5px] text-gray-500 font-bold">Audiencia</span>
              <span class="text-[13px] font-extrabold text-gray-800">{{ storyboard.targetAge }}</span>
            </div>
          </div>
        </div>

        <!-- Bibliografía (guía del educador) -->
        <div v-if="storyboard.bibliografia" class="card p-[22px]">
          <h3 class="text-base font-display font-semibold text-brand-dark mb-4">Bibliografía</h3>
          <div class="prose-guia text-[13px] text-gray-600 font-semibold leading-[1.6]" v-html="storyboard.bibliografia" />
        </div>
      </div>
    </div>
  </div>

  <!-- Not Found -->
  <div v-else class="card p-16 flex flex-col items-center justify-center text-center">
    <div class="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
      <svg class="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
      </svg>
    </div>
    <h3 class="font-display font-semibold text-brand-dark text-lg mb-2">Storyboard no encontrado</h3>
    <p class="text-sm text-gray-400 max-w-sm leading-relaxed">
      El storyboard que buscas no existe o ya no está disponible para tu comunidad.
    </p>
    <UiButton variant="outline" size="sm" class="mt-5" @click="navigateTo('/dashboard/storyboards')">
      Volver a Storyboards
    </UiButton>
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

// Secciones de guía con contenido, en el orden del doc del educador.
function seccionesDe(scene: StoryboardScene) {
  return [
    { label: 'Objetivo', html: scene.objective },
    { label: 'Pedagogía', html: scene.pedagogia },
    { label: 'Psicología', html: scene.psicologia },
    { label: 'Sustento científico', html: scene.cientifico },
    { label: 'Consejos', html: scene.consejos },
    { label: 'Mecánica', html: scene.mecanica },
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
/* Texto enriquecido de la guía (viene de Studio): listas y párrafos legibles */
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
