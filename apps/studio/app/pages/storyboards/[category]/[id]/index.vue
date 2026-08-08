<template>
  <div v-if="sb">
    <!-- ═══════════ Alert informativo (sobre el header, sin acción) ═══════════ -->
    <div
      v-if="regStatus === 'desactualizado'"
      class="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 mb-4"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
      <p class="text-sm text-amber-800 min-w-0">
        <span class="font-semibold">El build cambió respecto a lo registrado.</span>
        <span v-for="(d, i) in resultado.diferencias" :key="d" class="font-medium">{{ i ? ' · ' : ' ' }}{{ d }}</span>
        <span class="text-amber-600"> — se resincroniza desde admin.</span>
      </p>
    </div>
    <div
      v-else-if="regStatus === 'sin_registrar'"
      class="flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 mb-4"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
      <p class="text-sm text-blue-800 min-w-0">
        <span class="font-semibold">Compilado, sin registrar.</span>
        Copiá la metadata y registralo desde Platform, en la app de admin.
      </p>
    </div>

    <!-- ═══════════ Header: identidad + estado + acciones ═══════════ -->
    <UiCard :hover="false" class="mb-6">
      <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2.5">
            <span :class="['w-3 h-3 rounded-md shrink-0', sb.coverColor]" />
            <h2 class="text-2xl font-display font-bold text-brand-dark truncate leading-tight">{{ sb.title }}</h2>
            <!-- Estado de publicación REAL, leído de Supabase por `clave`. -->
            <UiBadge v-if="regStatus === 'sin_registrar'" variant="gray" dot>Sin registrar</UiBadge>
            <UiBadge v-else :variant="varianteBadgePublicacion(fila?.estado)" dot>
              {{ etiquetaPublicacion(fila?.estado) }}
            </UiBadge>
          </div>
          <p class="text-xs text-gray-400 font-mono mt-1">{{ category }}/{{ id }}</p>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <NuxtLink :to="playUrl()" class="btn btn-primary btn-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 3 20 12 6 21V3z" /></svg>
            Probar
          </NuxtLink>
          <!-- Studio no escribe en Supabase: produce la metadata del build y una persona
               la pega en admin/Platform, que hace el alta a mano (tarea 030). -->
          <button
            class="btn btn-outline btn-md"
            :title="errorCopia || 'Copia el JSON de registro para pegarlo en admin'"
            @click="copiarMetadata"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" /></svg>
            {{ etiquetaCopia }}
          </button>
        </div>
      </div>
    </UiCard>

    <!-- ═══════════ Información (solo lectura) + Clasificación/Build ═══════════
         Sin items-start: ambas cards de la fila estiran a la MISMA altura,
         independiente del contenido de cada una. -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <UiCard :padding="false" :hover="false" class="lg:col-span-2">
        <template #header>
          <div>
            <h3 class="section-title">Información</h3>
            <p class="text-xs text-gray-400 mt-0.5">Contenido y guía general · se administran en admin</p>
          </div>
        </template>
        <div class="p-6 space-y-5">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Descripción</p>
            <p class="text-sm text-gray-600 leading-relaxed">{{ descripcion || '—' }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Objetivo</p>
            <p class="text-sm leading-relaxed text-gray-300">Se escribe en admin.</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Bibliografía</p>
            <p class="text-sm leading-relaxed text-gray-300">Se escribe en admin.</p>
          </div>
        </div>
      </UiCard>

      <!-- Solo lo que declara el storyboard.json. El catálogo (duración, propiedad,
           países, estado) es de la base y se administra en admin. -->
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
            <p class="text-xs text-gray-400 mt-0.5">Estructura del build (solo lectura) · la guía pedagógica se escribe en admin</p>
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
                <p class="font-semibold text-brand-dark truncate">{{ scene.title }}</p>
                <p class="text-xs text-gray-400 font-mono truncate">scenes/{{ scene.folder }}/</p>
              </td>
              <td class="px-3 py-3">
                <UiBadge v-if="scene.loader" variant="green" dot>Implementado</UiBadge>
                <UiBadge v-else variant="yellow" dot>Pendiente</UiBadge>
              </td>
              <td class="px-5 py-3">
                <div class="flex items-center justify-end">
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
// Detalle de storyboard = VISTA DE SOLO LECTURA. Studio diseña y prueba; toda la
// administración (alta, estado, guía pedagógica por escena, países, duración)
// vive en admin/Platform a nivel superadmin (tarea 030). Acá solo se mira el
// build, se prueba el runner y se copia la metadata para registrarlo allá.
// ─────────────────────────────────────────────────────────────────────────────
import { etiquetaPublicacion, varianteBadgePublicacion } from '~/utils/registroEstado'
import { tr } from '~/types/i18n'

const route = useRoute()
const { getStoryboard } = useStoryboards()

const category = computed(() => String(route.params.category))
const id = computed(() => String(route.params.id))

const sb = computed(() => {
  const row = getStoryboard(id.value)
  return row && row.tipo === category.value ? row : undefined
})

// Build (fuente de verdad compilada): metadatos + escenas con su loader.
const runner = useStoryboardRunner(category.value, id.value, 'es')
const build = runner.definition
const buildScenes = runner.scenes

// ── Metadata de registro ──────────────────────────────────────────────────────
// El JSON build-owned con la forma de las tablas de Supabase. Se copia acá y se pega en
// admin/Platform; Studio nunca escribe en la base.
const { metadataDe, metadataComoJson } = useStoryboardMetadata()

// ── Estado REAL en Supabase (solo lectura) ────────────────────────────────────
const registro = useRegistroRemoto()
onMounted(() => registro.cargar())

const fila = computed(() => (sb.value ? registro.filaDe(sb.value.clave) : null))
const resultado = computed(() => {
  const meta = metadataDe(id.value)
  return meta ? registro.estadoDe(meta) : { estado: 'sin_registrar' as const, diferencias: [] }
})
const regStatus = computed(() => resultado.value.estado)

// Descripción, objetivo y bibliografía son editoriales: viven en la base.
const descripcion = computed(() => (fila.value?.descripcion ? tr(fila.value.descripcion, 'es') : ''))
const copiado = ref(false)
const errorCopia = ref('')
let temporizadorCopia: ReturnType<typeof setTimeout> | undefined

const etiquetaCopia = computed(() => {
  if (errorCopia.value) return 'No se pudo copiar'
  return copiado.value ? 'Copiado' : 'Copiar metadata'
})

async function copiarMetadata() {
  const json = metadataComoJson(id.value)
  if (!json) return
  try {
    await navigator.clipboard.writeText(json)
    errorCopia.value = ''
    copiado.value = true
  }
  catch {
    // El portapapeles exige contexto seguro (https o localhost). Si falla, decirlo:
    // que el botón se quede mudo es peor que el error.
    errorCopia.value = 'El navegador bloqueó el portapapeles (requiere https o localhost)'
    copiado.value = false
  }
  clearTimeout(temporizadorCopia)
  temporizadorCopia = setTimeout(() => {
    copiado.value = false
    errorCopia.value = ''
  }, 2500)
}

onBeforeUnmount(() => clearTimeout(temporizadorCopia))

// ── Probar ────────────────────────────────────────────────────────────────────
function playUrl(start?: number) {
  const base = `/play/${category.value}/${id.value}?lang=es`
  return start !== undefined ? `${base}&start=${start}` : base
}
</script>
