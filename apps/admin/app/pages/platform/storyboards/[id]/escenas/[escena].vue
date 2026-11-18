<template>
  <div v-if="sb && escena" class="mx-auto max-w-3xl">
    <UiPageHeader
      :title="`${escena.orden} · ${loc(escena.titulo)}`"
      :description="`${loc(sb.titulo)} · scenes/${escena.carpeta}/`"
    >
      <template #actions>
        <UiButton v-if="urlRunner" tone="neutral" icon="play" :href="urlRunner" target="_blank" rel="noopener">
          {{ t('platform.sbs.testScene') }}
        </UiButton>
        <!-- Aquí solo se lee (decisión 013): la guía se escribe en Player. -->
        <UiButton v-if="urlEnPlayer" tone="neutral" icon="external" :href="urlEnPlayer" target="_blank" rel="noopener">
          {{ t('platform.sbs.editInPlayer') }}
        </UiButton>
      </template>
    </UiPageHeader>

    <UiCard>
      <div class="mb-1 flex items-center justify-between gap-3">
        <h3 class="ui-title">{{ t('platform.sbs.guideTitle') }}</h3>
        <!-- Navegación entre escenas sin volver al detalle. -->
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
        <div v-for="seccion in secciones" :key="seccion.key">
          <p class="eyebrow mb-1.5">{{ seccion.label }}</p>
          <p :class="['ui-text whitespace-pre-line', !seccion.texto && 'text-disabled']">
            {{ seccion.texto || t('platform.sbs.emptyField') }}
          </p>
        </div>
      </div>
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
// La guía de una escena, para leerla: las doce secciones de la plantilla en el idioma elegido. Se
// escribe en Player (decisión 013); «Editar en Player» lleva a esa misma escena allí.
import type { EscenaFila, StoryboardDetalle } from '~/composables/usePlatformStoryboards'
import { runnerUrl } from '@playhub/ui/app/utils/runner-contract'
import { carpetaDeCategoria, seccionesGuia, urlGestionEnPlayer } from '~/composables/usePlatformStoryboards'
import type { Localized } from '~/utils/types'

definePageMeta({ layout: 'dashboard', titleKey: 'platform.sbs.guideTitle', descKey: 'platform.sbs.desc' })

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

const escena = computed<EscenaFila | null>(() => {
  const escenaId = Number(route.params.escena)
  return sb.value?.escenas.find(e => e.id === escenaId) ?? null
})

const idiomas = computed(() => (sb.value?.idiomas?.length ? sb.value.idiomas : ['es']))
const idiomaActivo = ref('es')
const pestanasIdioma = computed(() => idiomas.value.map(l => ({ value: l, label: l.toUpperCase() })))

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
const urlEnPlayer = computed(() => (playerUrl.value && sb.value && escena.value
  ? urlGestionEnPlayer(playerUrl.value, sb.value.categoria, sb.value.slug, escena.value.carpeta)
  : null))

// Las 12 secciones de la plantilla de la guía, con lo escrito en el idioma elegido.
const secciones = computed(() => seccionesGuia.map(key => ({
  key,
  label: t(`platform.sbs.g_${key}`),
  texto: escena.value?.[key]?.[idiomaActivo.value]?.trim() ?? '',
})))
</script>
