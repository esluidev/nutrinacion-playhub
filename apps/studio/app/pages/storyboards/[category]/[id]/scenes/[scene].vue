<template>
  <div v-if="storyboard && scene" class="max-w-5xl mx-auto">
    <!-- Header: identidad de la escena + probar -->
    <UiCard :hover="false" class="mb-6">
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div class="min-w-0">
          <NuxtLink
            :to="`/storyboards/${storyboard.tipo}/${storyboard.id}`"
            class="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors mb-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
            {{ storyboard.title }}
          </NuxtLink>
          <div class="flex items-center gap-2 mb-3">
            <UiBadge variant="gray">Escena {{ sceneIndex + 1 }} de {{ storyboard.scenes.length }}</UiBadge>
            <UiBadge v-if="isImplemented" variant="green" dot>Juego implementado</UiBadge>
            <UiBadge v-else variant="yellow" dot>Juego sin implementar</UiBadge>
          </div>
          <h2 class="text-2xl font-display font-bold text-brand-dark">{{ scene.title }}</h2>
          <p class="text-xs text-gray-400 font-mono mt-2">
            content/storyboards/{{ storyboard.tipo }}/{{ storyboard.id }}/scenes/{{ scene.folder }}/
          </p>
        </div>
        <NuxtLink :to="playUrl" class="btn btn-primary btn-md shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 3 20 12 6 21V3z" />
          </svg>
          Probar Escena
        </NuxtLink>
      </div>
    </UiCard>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <!-- ═══════════ Guía pedagógica de la escena (storyboard_escenas) ═══════════ -->
      <UiCard :padding="false" :hover="false" class="lg:col-span-2">
        <template #header>
          <div>
            <h3 class="section-title">Guía pedagógica</h3>
            <p class="text-xs text-gray-400 mt-0.5">
              El documento que el educador estudia para impartir esta escena · por idioma ·
              texto enriquecido pegado del doc con sus preguntas y listas embebidas
            </p>
          </div>
        </template>

        <div class="p-6">
          <div class="flex gap-1 border-b border-gray-100 mb-4">
            <button
              v-for="l in buildLangs"
              :key="l"
              type="button"
              :class="['relative px-3.5 py-2 text-sm font-semibold -mb-px border-b-2 transition-colors',
                       activeLang === l ? 'border-brand-primary text-brand-dark' : 'border-transparent text-gray-400 hover:text-gray-600']"
              @click="activeLang = l"
            >
              {{ l.toUpperCase() }}
              <span v-if="!langComplete(l)" class="absolute top-1.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
            </button>
          </div>

          <div class="space-y-5">
            <div v-for="s in SECTIONS" :key="s.key" class="space-y-1.5">
              <label class="block text-sm font-semibold text-gray-700">{{ s.label }}</label>
              <textarea
                v-model="form[s.key][activeLang]"
                :rows="s.rows"
                class="input !h-auto py-2.5 leading-relaxed resize-y"
                :placeholder="`${s.label} en ${activeLang.toUpperCase()}`"
              />
              <p class="text-xs text-gray-400">{{ s.hint }}</p>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-between gap-4">
            <p class="text-xs text-gray-400">Representación · se persiste al conectar Supabase.</p>
            <div class="flex gap-2">
              <UiButton variant="outline" size="sm" :disabled="!dirty" @click="cancel">Cancelar</UiButton>
              <UiButton variant="primary" size="sm" :disabled="!dirty" @click="save">Guardar guía</UiButton>
            </div>
          </div>
        </template>
      </UiCard>

      <!-- Navegación entre escenas, con avance de guía por escena. Sticky:
           acompaña al form largo de la guía (el header mide h-16). -->
      <UiCard :hover="false" class="lg:sticky lg:top-20">
        <h3 class="section-title mb-3">Escenas del Storyboard</h3>
        <div class="space-y-1">
          <NuxtLink
            v-for="(s, i) in storyboard.scenes"
            :key="s.folder"
            :to="`/storyboards/${storyboard.tipo}/${storyboard.id}/scenes/${s.folder}`"
            :class="[
              'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all',
              s.folder === scene.folder
                ? 'bg-brand-purple-50 text-brand-purple-700 font-semibold'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700',
            ]"
          >
            <span class="w-5 text-center font-display text-xs">{{ i + 1 }}</span>
            <span class="truncate flex-1">{{ s.title }}</span>
            <span
              :class="['w-2 h-2 rounded-full shrink-0', guideDot(s)]"
              :title="guideTitle(s)"
            />
          </NuxtLink>
        </div>
        <p class="text-xs text-gray-400 mt-3 px-3">
          <span class="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" /> guía completa ·
          <span class="inline-block w-2 h-2 rounded-full bg-amber-400 mx-1" /> parcial ·
          <span class="inline-block w-2 h-2 rounded-full bg-gray-200 mx-1" /> sin guía
        </p>
      </UiCard>
    </div>
  </div>

  <!-- No encontrada -->
  <UiCard v-else class="text-center py-12">
    <p class="text-gray-500 font-semibold mb-1">Escena no encontrada</p>
    <UiButton variant="outline" size="sm" @click="navigateTo('/storyboards')">Volver a Storyboards</UiButton>
  </UiCard>
</template>

<script setup lang="ts">
// ─────────────────────────────────────────────────────────────────────────────
// Detalle de escena = EDITOR DE GUÍA PEDAGÓGICA (tarea 018, decisión cerrada:
// la guía se autora en Studio y vive en Supabase para que Educators la lea).
// Una sección por campo de storyboard_escenas, 1:1 con el doc del educador;
// las preguntas/listas van EMBEBIDAS dentro de su sección, no en campos aparte.
// La parte GENERAL de la guía (título/descripción/objetivo/público) vive en el
// detalle del storyboard. Escritura sobre el store mock; Supabase al conectar.
// ─────────────────────────────────────────────────────────────────────────────
import type { SceneGuide, StoryboardScene } from '~/types/storyboard'

const route = useRoute()
const { getStoryboard, updateSceneGuide, sceneGuideProgress } = useStoryboards()

const storyboard = computed(() => {
  const sb = getStoryboard(String(route.params.id))
  return sb && sb.tipo === String(route.params.category) ? sb : undefined
})

const sceneIndex = computed(() =>
  storyboard.value?.scenes.findIndex(s => s.folder === String(route.params.scene)) ?? -1)

const scene = computed(() =>
  sceneIndex.value >= 0 ? storyboard.value?.scenes[sceneIndex.value] : undefined)

// Build: idiomas del contenido + si la escena tiene juego (scene.vue) compilado.
const runner = computed(() =>
  storyboard.value ? useStoryboardRunner(storyboard.value.tipo, storyboard.value.id, 'es') : null)
const buildLangs = computed<string[]>(() => runner.value?.definition?.languages ?? ['es'])
const isImplemented = computed(() =>
  !!runner.value?.scenes.find(s => s.folder === scene.value?.folder)?.loader)

const playUrl = computed(() => {
  if (!storyboard.value) return '#'
  return `/play/${storyboard.value.tipo}/${storyboard.value.id}?lang=es&start=${sceneIndex.value}`
})

// ── Secciones de la guía (orden del doc del educador) ─────────────────────────
const SECTIONS: { key: keyof SceneGuide, label: string, hint: string, rows: number }[] = [
  { key: 'descripcion', label: 'Descripción', hint: 'Qué pasa en la escena y cómo guiarla frente al grupo.', rows: 4 },
  { key: 'objetivo', label: 'Objetivo', hint: 'Qué logra el educador con esta escena.', rows: 3 },
  { key: 'pedagogia', label: 'Pedagogía', hint: 'Prosa + «Preguntas e interacciones sugeridas» embebidas.', rows: 5 },
  { key: 'psicologia', label: 'Psicología', hint: 'Prosa + «Preguntas de conexión emocional» embebidas.', rows: 5 },
  { key: 'cientifico', label: 'Científico', hint: 'Prosa + «Información de refuerzo» embebida.', rows: 5 },
  { key: 'consejos', label: 'Consejos', hint: 'Lista de consejos para impartir la escena.', rows: 4 },
  { key: 'mecanica', label: 'Mecánica del Juego', hint: 'Se completa cuando el juego de la escena está listo.', rows: 3 },
]

const activeLang = ref('es')

type GuideForm = Record<keyof SceneGuide, Record<string, string>>
const form = reactive<GuideForm>({
  descripcion: {}, objetivo: {}, pedagogia: {}, psicologia: {},
  cientifico: {}, consejos: {}, mecanica: {},
})

function seedForm() {
  for (const s of SECTIONS) {
    const values: Record<string, string> = {}
    for (const l of buildLangs.value) values[l] = scene.value?.guia?.[s.key]?.[l] ?? ''
    form[s.key] = values
  }
  activeLang.value = buildLangs.value.includes(activeLang.value) ? activeLang.value : (buildLangs.value[0] ?? 'es')
}
seedForm()
const pristine = ref(JSON.stringify(form))
const dirty = computed(() => JSON.stringify(form) !== pristine.value)

// La sidebar navega entre escenas reusando esta página: re-sembrar al cambiar.
watch(() => route.params.scene, () => {
  seedForm()
  pristine.value = JSON.stringify(form)
})

function langComplete(l: string) {
  return SECTIONS.every(s => s.key === 'mecanica' || form[s.key][l]?.trim())
}

function save() {
  if (!dirty.value || !storyboard.value || !scene.value) return
  const guia: SceneGuide = {}
  for (const s of SECTIONS) {
    const values = Object.fromEntries(Object.entries(form[s.key]).filter(([, v]) => v.trim()))
    if (Object.keys(values).length) guia[s.key] = values
  }
  updateSceneGuide(storyboard.value.id, scene.value.folder, guia)
  pristine.value = JSON.stringify(form)
}

function cancel() {
  seedForm()
  pristine.value = JSON.stringify(form)
}

// ── Avance de guía por escena (dot en la navegación) ──────────────────────────
function guideDot(s: StoryboardScene) {
  const p = sceneGuideProgress(s.folder === scene.value?.folder ? liveGuide() : s.guia, 'es')
  if (p.complete) return 'bg-green-500'
  return p.filled > 0 ? 'bg-amber-400' : 'bg-gray-200'
}
function guideTitle(s: StoryboardScene) {
  const p = sceneGuideProgress(s.folder === scene.value?.folder ? liveGuide() : s.guia, 'es')
  return `Guía ES: ${p.filled}/${p.total} secciones`
}
// La escena abierta refleja el form en vivo (incluye lo aún no guardado).
function liveGuide(): SceneGuide {
  const g: SceneGuide = {}
  for (const s of SECTIONS) g[s.key] = form[s.key]
  return g
}
</script>
