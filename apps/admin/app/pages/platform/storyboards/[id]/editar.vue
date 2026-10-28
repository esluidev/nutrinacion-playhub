<template>
  <div v-if="sb" class="mx-auto max-w-3xl">
    <UiPageHeader :title="t('platform.sbs.editTitle')" :description="loc(sb.titulo)" />

    <div class="space-y-6">
      <!-- ── Publicación: la decide Player (decisión 006); aquí solo se ve ──── -->
      <UiCard>
        <h3 class="ui-title mb-1">{{ t('platform.sbs.publicationTitle') }}</h3>
        <p class="ui-text mb-4">{{ t('platform.sbs.publicationFromPlayer') }}</p>
        <dl class="grid grid-cols-1 gap-3 text-body sm:grid-cols-3">
          <div>
            <dt class="field-label">{{ t('platform.sbs.fState') }}</dt>
            <dd><UiBadge :tone="uiPublicationTone(sb.estado_publicacion)">{{ t(`sbState.${sb.estado_publicacion}`) }}</UiBadge></dd>
          </div>
          <div>
            <dt class="field-label">{{ t('platform.sbs.fOwnership') }}</dt>
            <dd class="font-semibold text-muted">{{ propiedad }}</dd>
          </div>
          <div>
            <dt class="field-label">{{ t('platform.sbs.fCountries') }}</dt>
            <dd class="font-semibold text-muted">{{ paisesTexto }}</dd>
          </div>
        </dl>
      </UiCard>

      <!-- ── La cabecera de la guía del educador ────────────────────────────── -->
      <UiCard v-if="sb.guia">
        <h3 class="ui-title mb-1">{{ t('platform.sbs.guideHeaderTitle') }}</h3>
        <p class="ui-text mb-4">{{ t('platform.sbs.guideHeaderDesc') }}</p>

        <!-- Una pestaña por idioma del contenido (del JSON): no se inventan idiomas. -->
        <div v-if="idiomas.length > 1" class="ui-tabs ui-tabs-fit mb-4" role="group" :aria-label="t('platform.sbs.fLanguages')">
          <button
            v-for="l in idiomas"
            :key="l"
            type="button"
            class="ui-tab"
            :aria-pressed="l === idiomaActivo"
            @click="idiomaActivo = l"
          >
            {{ l.toUpperCase() }}
          </button>
        </div>

        <div class="space-y-4">
          <UiInput id="version-guia" v-model="version" :label="t('platform.sbs.fGuideVersion')" placeholder="1.0" />
          <UiTextarea v-model="descripcion[idiomaActivo]" :label="t('platform.sbs.fDescription')" :placeholder="t('platform.sbs.fDescriptionPh')" :rows="3" />
          <UiTextarea v-model="objetivo[idiomaActivo]" :label="t('platform.sbs.fObjective')" :placeholder="t('platform.sbs.fObjectivePh')" :rows="2" />
          <UiTextarea v-model="publico[idiomaActivo]" :label="t('platform.sbs.fPublic')" :placeholder="t('platform.sbs.fPublicPh')" :rows="2" />
          <!-- Un personalizado dice para quién es y a qué está adaptado. -->
          <div v-if="sb.organizacion_id">
            <UiTextarea v-model="adaptadoA[idiomaActivo]" :label="t('platform.sbs.fAdaptedTo')" :placeholder="t('platform.sbs.fAdaptedToPh')" :rows="2" />
            <p class="field-help">{{ t('platform.sbs.fAdaptedToHelp') }}</p>
          </div>
        </div>
      </UiCard>

      <div class="flex justify-end gap-2">
        <UiButton tone="neutral" @click="navigateTo(`/platform/storyboards/${sb.id}`)">{{ t('common.cancel') }}</UiButton>
        <UiButton :loading="guardando" @click="guardar">{{ t('common.save') }}</UiButton>
      </div>
    </div>
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
// Editar la cabecera de la guía de un storyboard. La metadata (título, categoría, idiomas, escenas)
// es del JSON y la registra Player; la publicación (estado, países y organización) también la
// decide Player (decisión 006). Aquí se ven, pero no se tocan.
import { uiPublicationTone } from '@playhub/ui/app/utils/ui-tones'
import type { StoryboardDetalle } from '~/composables/usePlatformStoryboards'
import type { Localized } from '~/utils/types'

definePageMeta({ layout: 'dashboard', titleKey: 'platform.sbs.editTitle', descKey: 'platform.sbs.desc' })

const { t, locale } = useT()
const route = useRoute()
const { getStoryboard, actualizarCabeceraGuia } = usePlatformStoryboards()
const { listPaises, listOrganizacionesSimple } = usePlatform()
const { toast } = useToast()

const sb = ref<StoryboardDetalle | null>(null)
const cargando = ref(true)

function loc(valor: Localized | null | undefined): string {
  if (!valor) return ''
  return valor[locale.value] ?? valor.es ?? Object.values(valor).find(v => !!v) ?? ''
}

// ── Formulario, sembrado de la fila ───────────────────────────────────────────
const idiomas = ref<string[]>(['es'])
const idiomaActivo = ref('es')
const version = ref('')
const descripcion = reactive<Localized>({})
const objetivo = reactive<Localized>({})
const publico = reactive<Localized>({})
const adaptadoA = reactive<Localized>({})
const guardando = ref(false)

const orgs = ref<{ id: number, nombre: string }[]>([])
const paisesCatalogo = ref<{ codigo: string, nombre: Localized, bandera: string | null }[]>([])

onMounted(async () => {
  const id = Number(route.params.id)
  ;[sb.value, orgs.value, paisesCatalogo.value] = await Promise.all([
    Number.isFinite(id) ? getStoryboard(id) : Promise.resolve(null),
    listOrganizacionesSimple(),
    listPaises(),
  ])
  cargando.value = false
  if (!sb.value) return

  const fila = sb.value
  idiomas.value = fila.idiomas.length ? [...fila.idiomas] : ['es']
  idiomaActivo.value = idiomas.value[0] ?? 'es'
  version.value = fila.guia?.version ?? ''
  for (const l of idiomas.value) {
    descripcion[l] = fila.guia?.descripcion?.[l] ?? ''
    objetivo[l] = fila.guia?.objetivo?.[l] ?? ''
    publico[l] = fila.guia?.publico?.[l] ?? ''
    adaptadoA[l] = fila.guia?.adaptado_a?.[l] ?? ''
  }
})

const propiedad = computed(() => {
  if (!sb.value?.organizacion_id) return t('platform.sbs.standard')
  return orgs.value.find(o => o.id === sb.value!.organizacion_id)?.nombre ?? '—'
})
const paisesTexto = computed(() => {
  const codigos = sb.value?.paises_disponibles ?? []
  if (!codigos.length) return t('platform.sbs.noCountries')
  return codigos.map(c => paisesCatalogo.value.find(p => p.codigo === c)?.nombre?.[locale.value] ?? c).join(', ')
})

// Solo los idiomas del contenido, sin cadenas en blanco; un campo vacío se guarda como null.
function opcional(campo: Localized): Localized | null {
  const salida: Localized = {}
  for (const l of idiomas.value) {
    const v = campo[l]?.trim()
    if (v) salida[l] = v
  }
  return Object.keys(salida).length ? salida : null
}

async function guardar() {
  if (!sb.value?.guia) return
  guardando.value = true
  const { error } = await actualizarCabeceraGuia(sb.value.guia.id, {
    version: version.value.trim() || null,
    descripcion: opcional(descripcion),
    objetivo: opcional(objetivo),
    publico: opcional(publico),
    adaptado_a: sb.value.organizacion_id ? opcional(adaptadoA) : null,
  })
  guardando.value = false
  if (error) {
    toast.error(error)
    return
  }
  toast.success(t('platform.sbs.saved'))
  navigateTo(`/platform/storyboards/${sb.value.id}`)
}
</script>
