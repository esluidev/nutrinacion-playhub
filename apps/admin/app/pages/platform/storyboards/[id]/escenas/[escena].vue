<template>
  <div v-if="sb && escena" class="max-w-3xl mx-auto">
    <UiPageHeader
      :title="`${escena.orden} · ${loc(escena.titulo)}`"
      :description="`${loc(sb.titulo)} · scenes/${escena.folder}/`"
    >
      <template #actions>
        <a v-if="urlRunner" :href="urlRunner" target="_blank" rel="noopener" class="btn btn-outline btn-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 3 20 12 6 21V3z" /></svg>
          {{ t('platform.sbs.testScene') }}
        </a>
      </template>
    </UiPageHeader>

    <div class="card p-6">
      <div class="flex items-center justify-between gap-3 mb-1">
        <h3 class="section-title">{{ t('platform.sbs.guideTitle') }}</h3>
        <!-- Navegación entre escenas sin volver al detalle: la guía se escribe en tandas. -->
        <div class="flex items-center gap-1.5">
          <NuxtLink
            v-if="escenaAnterior"
            :to="`/platform/storyboards/${sb.id}/escenas/${escenaAnterior.id}`"
            class="btn btn-ghost btn-sm !px-2"
            :title="loc(escenaAnterior.titulo)"
          >←</NuxtLink>
          <span class="text-xs text-gray-400 font-semibold">{{ escena.orden }}/{{ sb.escenas.length }}</span>
          <NuxtLink
            v-if="escenaSiguiente"
            :to="`/platform/storyboards/${sb.id}/escenas/${escenaSiguiente.id}`"
            class="btn btn-ghost btn-sm !px-2"
            :title="loc(escenaSiguiente.titulo)"
          >→</NuxtLink>
        </div>
      </div>
      <p class="text-[13px] text-gray-500 mb-4">{{ t('platform.sbs.guideDesc') }}</p>

      <div v-if="idiomas.length > 1" class="flex items-center gap-1.5 mb-5">
        <button
          v-for="l in idiomas"
          :key="l"
          type="button"
          :class="['chip', l === idiomaActivo ? 'chip-active' : 'chip-inactive']"
          @click="idiomaActivo = l"
        >
          {{ l.toUpperCase() }}
        </button>
      </div>

      <div class="space-y-5">
        <div v-for="seccion in secciones" :key="seccion.key">
          <label class="block text-[13px] font-bold text-gray-700 mb-0.5">{{ seccion.label }}</label>
          <p class="text-xs text-gray-400 mb-1.5">{{ seccion.hint }}</p>
          <textarea
            v-model="guia[seccion.key][idiomaActivo]"
            class="input !h-28 !py-2.5"
          />
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
        <UiButton variant="outline" @click="navigateTo(`/platform/storyboards/${sb.id}`)">{{ t('common.cancel') }}</UiButton>
        <UiButton :loading="guardando" @click="guardar">{{ t('common.save') }}</UiButton>
      </div>
    </div>
  </div>

  <div v-else-if="!cargando" class="card p-12 text-center">
    <p class="text-gray-500 font-semibold mb-1">{{ t('platform.sbs.sceneNotFound') }}</p>
    <UiButton variant="outline" size="sm" class="mt-3" @click="navigateTo('/platform/storyboards')">
      {{ t('platform.orgDetail.back') }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import type { EscenaFila, SeccionGuia, StoryboardDetalle } from '~/composables/usePlatformStoryboards'
import { seccionesGuia } from '~/composables/usePlatformStoryboards'
import type { Localized } from '~/utils/types'

definePageMeta({ layout: 'dashboard', titleKey: 'platform.sbs.guideTitle', descKey: 'platform.sbs.desc' })

const { t, locale } = useT()
const route = useRoute()
const { getStoryboard, actualizarGuia, getStudioUrl } = usePlatformStoryboards()
const { toast } = useToast()

const sb = ref<StoryboardDetalle | null>(null)
const cargando = ref(true)
const studioUrl = ref<string | null>(null)

function loc(valor: Localized | null | undefined): string {
  if (!valor) return ''
  return valor[locale.value] ?? valor.es ?? Object.values(valor).find(v => !!v) ?? ''
}

const escena = computed<EscenaFila | null>(() => {
  const escenaId = Number(route.params.escena)
  return sb.value?.escenas.find(e => e.id === escenaId) ?? null
})

const idiomas = computed(() => (sb.value?.idiomas?.length ? sb.value.idiomas : ['es']))
const idiomaActivo = ref('es')

// Las 7 secciones editables, siempre como objeto por idioma (columnas jsonb).
const guia = reactive<Record<SeccionGuia, Localized>>({
  descripcion: {}, objetivo: {}, pedagogia: {}, psicologia: {}, cientifico: {}, consejos: {}, mecanica: {},
})

// La ruta cambia sin desmontar la página al navegar entre escenas (← →): resembrar siempre.
watch(escena, (fila) => {
  if (!fila) return
  for (const s of seccionesGuia) {
    for (const l of idiomas.value) {
      guia[s][l] = fila[s]?.[l] ?? ''
    }
  }
}, { immediate: true })

onMounted(async () => {
  const id = Number(route.params.id)
  ;[sb.value, studioUrl.value] = await Promise.all([
    Number.isFinite(id) ? getStoryboard(id) : Promise.resolve(null),
    getStudioUrl(),
  ])
  cargando.value = false
  idiomaActivo.value = idiomas.value[0] ?? 'es'
})

const indice = computed(() => sb.value?.escenas.findIndex(e => e.id === escena.value?.id) ?? -1)
const escenaAnterior = computed(() => (indice.value > 0 ? sb.value!.escenas[indice.value - 1] : null))
const escenaSiguiente = computed(() =>
  (indice.value >= 0 && indice.value < (sb.value?.escenas.length ?? 0) - 1 ? sb.value!.escenas[indice.value + 1] : null))

const urlRunner = computed(() => {
  if (!studioUrl.value || !sb.value?.tipo || !escena.value) return null
  const tipoSlug = sb.value.tipo.codigo.toLowerCase().replace(/_/g, '-')
  return `${studioUrl.value}/play/${tipoSlug}/${sb.value.slug}?lang=es&start=${escena.value.orden - 1}`
})

const secciones = computed(() => seccionesGuia.map(key => ({
  key,
  label: t(`platform.sbs.g_${key}`),
  hint: t(`platform.sbs.g_${key}Hint`),
})))

const guardando = ref(false)

function recortar(campo: Localized): Localized | null {
  const salida: Localized = {}
  for (const l of idiomas.value) {
    const v = campo[l]?.trim()
    if (v) salida[l] = v
  }
  return Object.keys(salida).length ? salida : null
}

async function guardar() {
  if (!escena.value) return
  guardando.value = true
  const payload = Object.fromEntries(
    seccionesGuia.map(s => [s, recortar(guia[s])]),
  ) as Partial<Record<SeccionGuia, Localized | null>>
  const { error } = await actualizarGuia(escena.value.id, payload)
  guardando.value = false
  if (error) {
    toast.error(error)
    return
  }
  // Reflejar lo guardado en la copia local: el detalle y el avance quedan al día al volver.
  Object.assign(escena.value, payload)
  toast.success(t('platform.sbs.guideSaved'))
}
</script>
