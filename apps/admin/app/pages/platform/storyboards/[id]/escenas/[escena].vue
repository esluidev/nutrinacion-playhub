<template>
  <div v-if="sb && escena" class="mx-auto max-w-3xl">
    <UiPageHeader
      :title="`${escena.orden} · ${loc(escena.titulo)}`"
      :description="`${loc(sb.titulo)} · scenes/${escena.carpeta}/`"
    >
      <template #actions>
        <!-- Probar es secundario: la acción de esta vista es guardar la guía. -->
        <UiButton v-if="urlRunner" tone="neutral" icon="play" :href="urlRunner" target="_blank" rel="noopener">
          {{ t('platform.sbs.testScene') }}
        </UiButton>
      </template>
    </UiPageHeader>

    <UiCard>
      <div class="mb-1 flex items-center justify-between gap-3">
        <h3 class="ui-title">{{ t('platform.sbs.guideTitle') }}</h3>
        <!-- Navegación entre escenas sin volver al detalle: la guía se escribe en tandas. -->
        <div class="ui-group">
          <NuxtLink
            v-if="escenaAnterior"
            :to="`/platform/storyboards/${sb.id}/escenas/${escenaAnterior.id}`"
            class="ui-group-item"
            :title="loc(escenaAnterior.titulo)"
            :aria-label="loc(escenaAnterior.titulo)"
          >
            <UiIcon name="chevron-left" />
          </NuxtLink>
          <span class="ui-group-label">{{ escena.orden }}/{{ sb.escenas.length }}</span>
          <NuxtLink
            v-if="escenaSiguiente"
            :to="`/platform/storyboards/${sb.id}/escenas/${escenaSiguiente.id}`"
            class="ui-group-item"
            :title="loc(escenaSiguiente.titulo)"
            :aria-label="loc(escenaSiguiente.titulo)"
          >
            <UiIcon name="chevron-right" />
          </NuxtLink>
        </div>
      </div>
      <p class="ui-text mb-4">{{ t('platform.sbs.guideDesc') }}</p>

      <UiTabs
        v-if="idiomas.length > 1"
        v-model="idiomaActivo"
        :items="pestanasIdioma"
        :label="t('platform.sbs.fLanguages')"
        fit
        class="mb-5"
      />

      <div class="space-y-5">
        <UiTextarea
          v-for="seccion in secciones"
          :key="seccion.key"
          v-model="guia[seccion.key][idiomaActivo]"
          :label="seccion.label"
          :hint="seccion.hint"
        />
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton tone="neutral" @click="navigateTo(`/platform/storyboards/${sb.id}`)">{{ t('common.cancel') }}</UiButton>
          <UiButton :loading="guardando" @click="guardar">{{ t('common.save') }}</UiButton>
        </div>
      </template>
    </UiCard>
  </div>

  <UiCard v-else-if="!cargando">
    <UiEmptyState icon="search" :title="t('platform.sbs.sceneNotFound')">
      <UiButton tone="neutral" size="sm" @click="navigateTo('/platform/storyboards')">
        {{ t('platform.orgDetail.back') }}
      </UiButton>
    </UiEmptyState>
  </UiCard>
</template>

<script setup lang="ts">
import type { EscenaFila, SeccionGuia, StoryboardDetalle } from '~/composables/usePlatformStoryboards'
import { runnerUrl } from '@playhub/ui/app/utils/runner-contract'
import { carpetaDeCategoria, seccionesGuia } from '~/composables/usePlatformStoryboards'
import type { Localized } from '~/utils/types'

definePageMeta({ layout: 'dashboard', titleKey: 'platform.sbs.guideTitle', descKey: 'platform.sbs.desc' })

const { t, locale } = useT()
const route = useRoute()
const { getStoryboard, actualizarGuia, getPlayerUrl } = usePlatformStoryboards()
const { toast } = useToast()

const sb = ref<StoryboardDetalle | null>(null)
const cargando = ref(true)
const playerUrl = ref<string | null>(null)

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
const pestanasIdioma = computed(() => idiomas.value.map(l => ({ value: l, label: l.toUpperCase() })))

// Las 12 secciones de la plantilla de la guía, siempre como objeto por idioma (columnas jsonb).
const guia = reactive(Object.fromEntries(seccionesGuia.map(s => [s, {}])) as Record<SeccionGuia, Localized>)

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
  ;[sb.value, playerUrl.value] = await Promise.all([
    Number.isFinite(id) ? getStoryboard(id) : Promise.resolve(null),
    getPlayerUrl(),
  ])
  cargando.value = false
  idiomaActivo.value = idiomas.value[0] ?? 'es'
})

const indice = computed(() => sb.value?.escenas.findIndex(e => e.id === escena.value?.id) ?? -1)
const escenaAnterior = computed(() => (indice.value > 0 ? sb.value!.escenas[indice.value - 1] : null))
const escenaSiguiente = computed(() =>
  (indice.value >= 0 && indice.value < (sb.value?.escenas.length ?? 0) - 1 ? sb.value!.escenas[indice.value + 1] : null))

// El runner abre en esta escena por su carpeta (`?escena=`, docs/runner.md).
const urlRunner = computed(() => {
  if (!playerUrl.value || !sb.value || !escena.value) return null
  return runnerUrl(playerUrl.value, {
    eje: carpetaDeCategoria(sb.value.categoria), slug: sb.value.slug, modo: 'educator', idioma: sb.value.idiomas[0], escena: escena.value.carpeta,
  })
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
