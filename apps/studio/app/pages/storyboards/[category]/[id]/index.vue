<template>
  <div v-if="sb">
    <!-- ═══════════ Alert informativo (sobre el header, sin acción) ═══════════ -->
    <div
      v-if="regStatus === 'desincronizado'"
      class="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 mb-4"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
      <p class="text-sm text-amber-800 min-w-0">
        <span class="font-semibold">El build cambió respecto al catálogo registrado.</span>
        Sin reflejar:
        <span v-for="(it, i) in drift.items" :key="it.label" class="font-medium">{{ i ? ' · ' : ' ' }}{{ it.label }}</span>
        <span class="text-amber-600"> — se reconcilia al guardar en Editar.</span>
      </p>
    </div>
    <div
      v-else-if="!isRegistered"
      class="flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 mb-4"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
      <p class="text-sm text-blue-800 min-w-0">
        <span class="font-semibold">Compilado, sin registrar.</span>
        Creá el registro desde Editar para gestionarlo en el catálogo de admin.
      </p>
    </div>

    <!-- ═══════════ Header: identidad + estado + acciones ═══════════ -->
    <UiCard :hover="false" class="mb-6">
      <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2.5">
            <span :class="['w-3 h-3 rounded-md shrink-0', sb.coverColor]" />
            <h2 class="text-2xl font-display font-bold text-brand-dark truncate leading-tight">{{ sb.title }}</h2>
          </div>
          <p class="text-xs text-gray-400 font-mono mt-1">{{ category }}/{{ id }}</p>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <NuxtLink :to="playUrl()" class="btn btn-primary btn-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 3 20 12 6 21V3z" /></svg>
            Probar
          </NuxtLink>
          <NuxtLink :to="`/storyboards/${category}/${id}/edit`" class="btn btn-outline btn-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.862 4.487Z" /></svg>
            Editar
          </NuxtLink>
          <div v-if="isRegistered" class="relative">
            <button class="btn btn-outline btn-md !px-2.5" title="Más acciones" @click="moreOpen = !moreOpen">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" /></svg>
            </button>
            <div v-if="moreOpen" class="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl border border-gray-200 shadow-lg py-1.5 z-50">
              <button class="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors" @click="askRemove">
                Quitar del catálogo de admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </UiCard>

    <div v-if="moreOpen" class="fixed inset-0 z-40" @click="moreOpen = false" />

    <!-- ═══════════ Información (solo lectura) + Clasificación/Build ═══════════
         Sin items-start: ambas cards de la fila estiran a la MISMA altura,
         independiente del contenido de cada una. -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <UiCard :padding="false" :hover="false" class="lg:col-span-2">
        <template #header>
          <div>
            <h3 class="section-title">Información</h3>
            <p class="text-xs text-gray-400 mt-0.5">Contenido y guía general del storyboard · se edita en Editar</p>
          </div>
        </template>
        <div class="p-6 space-y-5">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Descripción</p>
            <p class="text-sm text-gray-600 leading-relaxed">{{ sb.description || '—' }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Objetivo</p>
            <p :class="['text-sm leading-relaxed', sb.objetivo?.es ? 'text-gray-600' : 'text-gray-300']">
              {{ sb.objetivo?.es || 'Sin objetivo — completar en Editar.' }}
            </p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Bibliografía</p>
            <p :class="['text-sm leading-relaxed', sb.bibliografia?.es ? 'text-gray-600' : 'text-gray-300']">
              {{ sb.bibliografia?.es || 'Sin bibliografía — completar en Editar.' }}
            </p>
          </div>
        </div>
      </UiCard>

      <!-- Solo lo que declara el storyboard.json — nada inventado: el catálogo
           (duración, propiedad, países, estado) se muestra cuando exista de
           verdad en Supabase; mientras tanto se edita en Editar. -->
      <UiCard :padding="false" :hover="false">
        <template #header>
          <div>
            <h3 class="section-title">Build</h3>
            <p class="text-xs text-gray-400 mt-0.5">storyboard.json · solo lectura</p>
          </div>
        </template>
        <!-- Valores CRUDOS del json (codigos estables), sin interpretar: los
             labels legibles salen de los catálogos de Supabase al conectar. -->
        <dl class="px-5 py-2 divide-y divide-gray-50">
          <div class="flex items-center justify-between gap-2 py-2.5">
            <dt class="text-xs text-gray-400">Audiencia</dt>
            <dd class="text-sm font-semibold text-brand-dark font-mono">{{ build?.audience ?? '—' }}</dd>
          </div>
          <div class="flex items-center justify-between gap-2 py-2.5">
            <dt class="text-xs text-gray-400">Tipo</dt>
            <dd class="text-sm font-semibold text-brand-dark font-mono">{{ build?.type ?? '—' }}</dd>
          </div>
          <div class="flex items-center justify-between gap-2 py-2.5">
            <dt class="text-xs text-gray-400">Categoría</dt>
            <dd class="text-sm font-semibold text-brand-dark font-mono">{{ build?.category ?? '—' }}</dd>
          </div>
          <div class="flex items-center justify-between gap-2 py-2.5">
            <dt class="text-xs text-gray-400">Escenas</dt>
            <dd class="text-sm font-semibold text-brand-dark">{{ buildScenes.length }}</dd>
          </div>
          <div class="flex items-center justify-between gap-2 py-2.5">
            <dt class="text-xs text-gray-400">Idiomas del contenido</dt>
            <dd class="text-sm font-semibold text-brand-dark uppercase">{{ (build?.languages ?? ['es']).join(' · ') }}</dd>
          </div>
          <div class="flex items-center justify-between gap-2 py-2.5">
            <dt class="text-xs text-gray-400 shrink-0">Clave</dt>
            <dd class="text-xs text-gray-500 font-mono truncate" :title="build?.key">{{ build?.key }}</dd>
          </div>
        </dl>
      </UiCard>
    </div>

    <!-- ═══════════ Escenas: tabla administrativa ═══════════ -->
    <UiCard :padding="false" :hover="false">
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="section-title">Escenas</h3>
            <p class="text-xs text-gray-400 mt-0.5">Estructura del build (solo lectura) · la guía pedagógica se edita por escena</p>
          </div>
          <span class="badge badge-gray">{{ buildScenes.length }}</span>
        </div>
      </template>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-100">
              <th class="px-5 py-3 w-10 font-semibold">#</th>
              <th class="px-3 py-3 font-semibold">Escena</th>
              <th class="px-3 py-3 font-semibold">Juego</th>
              <th class="px-3 py-3 font-semibold">Guía pedagógica</th>
              <th class="px-5 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr
              v-for="(scene, index) in buildScenes"
              :key="scene.folder"
              class="group hover:bg-gray-50/60 transition-colors"
            >
              <td class="px-5 py-3 text-xs font-display font-semibold text-gray-400">{{ index + 1 }}</td>
              <td class="px-3 py-3 min-w-0">
                <NuxtLink :to="sceneUrl(scene.folder)" class="block">
                  <p class="font-semibold text-brand-dark truncate">{{ scene.title }}</p>
                  <p class="text-xs text-gray-400 font-mono truncate">scenes/{{ scene.folder }}/</p>
                </NuxtLink>
              </td>
              <td class="px-3 py-3">
                <UiBadge v-if="scene.loader" variant="green" dot>Implementado</UiBadge>
                <UiBadge v-else variant="yellow" dot>Pendiente</UiBadge>
              </td>
              <td class="px-3 py-3">
                <span class="inline-flex items-center gap-2">
                  <span :class="['w-2 h-2 rounded-full shrink-0', guideDot(scene.folder)]" />
                  <span class="text-xs text-gray-500">{{ guideProgressFor(scene.folder).filled }}/{{ guideProgressFor(scene.folder).total }} secciones (ES)</span>
                </span>
              </td>
              <td class="px-5 py-3">
                <div class="flex items-center justify-end gap-2">
                  <NuxtLink :to="sceneUrl(scene.folder)" class="btn btn-outline btn-sm">Editar guía</NuxtLink>
                  <NuxtLink :to="playUrl(index)" class="btn btn-ghost btn-sm !px-2" title="Probar esta escena">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 3 20 12 6 21V3z" /></svg>
                  </NuxtLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <!-- Confirmación destructiva -->
    <div v-if="confirmRemove" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/30" @click="confirmRemove = false" />
      <div class="relative bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-display font-bold text-brand-dark">¿Quitar del catálogo de admin?</h3>
        <p class="text-sm text-gray-500 mt-2">
          «{{ sb.title }}» dejará de estar disponible en la app de admin. El build compilado no se toca.
          (Archivar vs. borrar la fila se decide al conectar Supabase.)
        </p>
        <div class="flex justify-end gap-2 mt-6">
          <UiButton variant="outline" size="sm" @click="confirmRemove = false">Cancelar</UiButton>
          <UiButton variant="danger" size="sm" @click="removeFromCatalog">Quitar del catálogo</UiButton>
        </div>
      </div>
    </div>
  </div>

  <!-- No encontrado -->
  <UiCard v-else class="text-center py-12">
    <p class="text-gray-500 font-semibold mb-1">Storyboard no encontrado</p>
    <p class="text-sm text-gray-400 mb-4">No existe <span class="font-mono">{{ category }}/{{ id }}</span></p>
    <UiButton variant="outline" size="sm" @click="navigateTo('/storyboards')">Volver a Storyboards</UiButton>
  </UiCard>
</template>

<script setup lang="ts">
// ─────────────────────────────────────────────────────────────────────────────
// Detalle de storyboard = VISTA administrativa de SOLO LECTURA: muestra el
// catálogo (fila `storyboards` representada en el store) + metadatos del build,
// y la tabla de escenas con acceso al editor de guía de cada una. La edición
// del catálogo vive en su propia página (./edit), como un admin común.
// ─────────────────────────────────────────────────────────────────────────────
const route = useRoute()
const {
  getStoryboard,
  updateCatalog,
  storyboardDrift,
  sceneGuideProgress,
} = useStoryboards()

const category = computed(() => String(route.params.category))
const id = computed(() => String(route.params.id))

// Fila VIVA del store (refleja lo guardado en Editar y en los editores de guía).
const sb = computed(() => {
  const row = getStoryboard(id.value)
  return row && row.tipo === category.value ? row : undefined
})

// Build (fuente de verdad compilada): metadatos + escenas con su loader.
const runner = useStoryboardRunner(category.value, id.value, 'es')
const build = runner.definition
const buildScenes = runner.scenes

// borrador = compilado pero aún sin registrar (semilla de la representación 003).
const isRegistered = computed(() => !!sb.value && sb.value.status !== 'borrador')
const drift = computed(() => storyboardDrift(id.value))
const regStatus = computed<'no_registrado' | 'sincronizado' | 'desincronizado'>(() => {
  if (!isRegistered.value) return 'no_registrado'
  return drift.value.has ? 'desincronizado' : 'sincronizado'
})

// ── Acciones ──────────────────────────────────────────────────────────────────
const moreOpen = ref(false)
const confirmRemove = ref(false)
function askRemove() {
  moreOpen.value = false
  confirmRemove.value = true
}
function removeFromCatalog() {
  // Representación: sin registro = status 'borrador' (la fila real se archiva o
  // borra al conectar Supabase, según se decida).
  updateCatalog(id.value, { status: 'borrador' })
  confirmRemove.value = false
}

function playUrl(start?: number) {
  const base = `/play/${category.value}/${id.value}?lang=es`
  return start !== undefined ? `${base}&start=${start}` : base
}
function sceneUrl(folder: string) {
  return `/storyboards/${category.value}/${id.value}/scenes/${folder}`
}

// ── Guía por escena: avance leído del store vivo ──────────────────────────────
function guideProgressFor(folder: string) {
  const live = sb.value?.scenes.find(s => s.folder === folder)
  return sceneGuideProgress(live?.guia, 'es')
}
function guideDot(folder: string) {
  const p = guideProgressFor(folder)
  if (p.complete) return 'bg-green-500'
  return p.filled > 0 ? 'bg-amber-400' : 'bg-gray-200'
}
</script>
