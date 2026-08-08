<template>
  <div v-if="sb" class="max-w-3xl mx-auto">
    <UiPageHeader :title="t('platform.sbs.editTitle')" :description="loc(sb.titulo)" />

    <div class="space-y-6">
      <!-- ── Lo editorial ─────────────────────────────────────────────────── -->
      <div class="card p-6">
        <h3 class="section-title mb-1">{{ t('platform.sbs.step2') }}</h3>
        <p class="text-[13px] text-gray-500 mb-4">{{ t('platform.sbs.step2Desc') }}</p>

        <div v-if="idiomas.length > 1" class="flex items-center gap-1.5 mb-4">
          <button
            v-for="l in idiomas"
            :key="l"
            type="button"
            :class="['chip', l === idiomaActivo ? 'chip-active' : 'chip-inactive']"
            @click="idiomaActivo = l"
          >
            {{ l.toUpperCase() }}
            <span v-if="!titulo[l]?.trim()" class="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </button>
        </div>

        <div class="space-y-4">
          <UiInput v-model="titulo[idiomaActivo]" :label="t('platform.sbs.fTitle')" required />
          <div>
            <label class="block text-[13px] font-bold text-gray-700 mb-1.5">{{ t('platform.sbs.fDescription') }}</label>
            <textarea v-model="descripcion[idiomaActivo]" class="input !h-24 !py-2.5" />
          </div>
          <div>
            <label class="block text-[13px] font-bold text-gray-700 mb-1.5">{{ t('platform.sbs.fObjective') }}</label>
            <textarea v-model="objetivo[idiomaActivo]" class="input !h-24 !py-2.5" />
          </div>
          <div>
            <label class="block text-[13px] font-bold text-gray-700 mb-1.5">{{ t('platform.sbs.fBibliography') }}</label>
            <textarea v-model="bibliografia[idiomaActivo]" class="input !h-20 !py-2.5" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="block text-sm font-semibold text-gray-700">{{ t('platform.sbs.fState') }}</label>
              <UiSelect v-model="estado" :options="estadoOpciones" size="md" />
            </div>
            <UiInput id="duracion" v-model="duracionMin" type="number" :label="t('platform.sbs.fDuration')" min="5" max="180" />
          </div>

          <div class="space-y-1.5">
            <label class="block text-sm font-semibold text-gray-700">{{ t('platform.sbs.fOwnership') }}</label>
            <UiSelect v-model="organizacionId" :options="orgOpciones" size="md" />
            <p class="text-xs text-gray-400">{{ t('platform.sbs.fOwnershipHelp') }}</p>
          </div>

          <div class="space-y-1.5">
            <label class="block text-sm font-semibold text-gray-700">{{ t('platform.sbs.fCountries') }}</label>
            <p class="text-xs text-gray-400 mb-1">{{ t('platform.sbs.fCountriesHelp') }}</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="pais in paisesCatalogo"
                :key="pais.codigo"
                type="button"
                :class="['chip', paises.includes(pais.codigo) ? 'chip-active' : 'chip-inactive']"
                @click="togglePais(pais.codigo)"
              >
                <span class="mr-1">{{ pais.bandera }}</span>{{ pais.nombre?.es ?? pais.codigo }}
              </button>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
          <UiButton variant="outline" @click="navigateTo(`/platform/storyboards/${sb.id}`)">{{ t('common.cancel') }}</UiButton>
          <UiButton :disabled="!puedeGuardar" :loading="guardando" @click="guardar">{{ t('common.save') }}</UiButton>
        </div>
      </div>

      <!-- ── Resincronizar con el build ───────────────────────────────────────
           El caso: Studio agregó un idioma o una escena y este registro quedó viejo.
           Se repega la metadata; solo cambia lo build-owned, las guías escritas quedan. -->
      <div class="card p-6">
        <h3 class="section-title mb-1">{{ t('platform.sbs.syncTitle') }}</h3>
        <p class="text-[13px] text-gray-500 mb-4">{{ t('platform.sbs.syncDesc') }}</p>

        <textarea
          v-model="textoMetadata"
          class="input !h-32 !py-3 font-mono !text-[12.5px] leading-relaxed"
          :placeholder="t('platform.sbs.metadataPh')"
          spellcheck="false"
          @input="invalidarSync"
        />

        <div class="flex items-center gap-3 mt-3 flex-wrap">
          <UiButton variant="outline" size="sm" :disabled="!textoMetadata.trim()" @click="validarSync">
            {{ t('platform.sbs.validate') }}
          </UiButton>
          <p v-if="errorSync" class="text-[13px] font-semibold text-red-600">{{ errorSync }}</p>
          <template v-else-if="metaSync">
            <p v-if="cambiosSync.length" class="text-[13px] font-semibold text-amber-600">
              {{ cambiosSync.join(' · ') }}
            </p>
            <p v-else class="text-[13px] font-semibold text-gray-400">{{ t('platform.sbs.syncNoChanges') }}</p>
          </template>
        </div>

        <div v-if="metaSync && cambiosSync.length" class="flex justify-end mt-4 pt-4 border-t border-gray-100">
          <UiButton :loading="sincronizando" @click="sincronizar">{{ t('platform.sbs.syncBtn') }}</UiButton>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="!cargando" class="card p-12 text-center">
    <p class="text-gray-500 font-semibold mb-1">{{ t('platform.sbs.notFound') }}</p>
    <UiButton variant="outline" size="sm" class="mt-3" @click="navigateTo('/platform/storyboards')">
      {{ t('platform.orgDetail.back') }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import { parsearMetadata } from '~/utils/metadataStoryboard'
import type { StoryboardMetadata } from '~/utils/metadataStoryboard'
import type { StoryboardDetalle } from '~/composables/usePlatformStoryboards'
import type { Localized } from '~/utils/types'

definePageMeta({ layout: 'dashboard', titleKey: 'platform.sbs.editTitle', descKey: 'platform.sbs.desc' })

const { t, locale } = useT()
const route = useRoute()
const { getStoryboard, actualizarEditorial, sincronizarBuild } = usePlatformStoryboards()
const { listPaises, listOrganizacionesSimple } = usePlatform()
const { toast } = useToast()

const sb = ref<StoryboardDetalle | null>(null)
const cargando = ref(true)

function loc(valor: Localized | null | undefined): string {
  if (!valor) return ''
  return valor[locale.value] ?? valor.es ?? Object.values(valor).find(v => !!v) ?? ''
}

// ── Formulario editorial, sembrado de la fila ─────────────────────────────────
const idiomas = ref<string[]>(['es'])
const idiomaActivo = ref('es')
const titulo = reactive<Localized>({})
const descripcion = reactive<Localized>({})
const objetivo = reactive<Localized>({})
const bibliografia = reactive<Localized>({})
const estado = ref('BORRADOR')
const duracionMin = ref('')
const organizacionId = ref<number | ''>('')
const paises = ref<string[]>([])
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
  idiomas.value = fila.idiomas?.length ? [...fila.idiomas] : ['es']
  idiomaActivo.value = idiomas.value[0] ?? 'es'
  for (const l of idiomas.value) {
    titulo[l] = fila.titulo?.[l] ?? ''
    descripcion[l] = fila.descripcion?.[l] ?? ''
    objetivo[l] = fila.objetivo?.[l] ?? ''
    bibliografia[l] = fila.bibliografia?.[l] ?? ''
  }
  estado.value = fila.estado
  duracionMin.value = fila.duracion_min ? String(fila.duracion_min) : ''
  organizacionId.value = fila.organizacion_id ?? ''
  paises.value = [...(fila.paises ?? [])]
})

const estadoOpciones = computed(() => [
  { value: 'BORRADOR', label: t('sbState.BORRADOR') },
  { value: 'EN_REVISION', label: t('sbState.EN_REVISION') },
  { value: 'PUBLICADO', label: t('sbState.PUBLICADO') },
  { value: 'ARCHIVADO', label: t('sbState.ARCHIVADO') },
])
const orgOpciones = computed(() => [
  { value: '', label: t('platform.sbs.standard') },
  ...orgs.value.map(o => ({ value: o.id, label: o.nombre })),
])

function togglePais(codigo: string) {
  paises.value = paises.value.includes(codigo)
    ? paises.value.filter(c => c !== codigo)
    : [...paises.value, codigo]
}

const puedeGuardar = computed(() =>
  !!sb.value && idiomas.value.every(l => !!titulo[l]?.trim()) && !guardando.value)

function recortar(campo: Localized): Localized {
  const salida: Localized = {}
  for (const l of idiomas.value) {
    const v = campo[l]?.trim()
    if (v) salida[l] = v
  }
  return salida
}

async function guardar() {
  if (!sb.value || !puedeGuardar.value) return
  guardando.value = true
  const obj = recortar(objetivo)
  const bib = recortar(bibliografia)
  const { error } = await actualizarEditorial(sb.value.id, {
    titulo: recortar(titulo),
    descripcion: recortar(descripcion),
    objetivo: Object.keys(obj).length ? obj : null,
    bibliografia: Object.keys(bib).length ? bib : null,
    estado: estado.value,
    duracion_min: duracionMin.value ? Number(duracionMin.value) : null,
    portada: sb.value.portada,
    paises: paises.value,
    organizacion_id: organizacionId.value === '' ? null : Number(organizacionId.value),
  })
  guardando.value = false
  if (error) {
    toast.error(error)
    return
  }
  toast.success(t('platform.sbs.saved'))
  navigateTo(`/platform/storyboards/${sb.value.id}`)
}

// ── Resincronización con el build ─────────────────────────────────────────────
const textoMetadata = ref('')
const metaSync = ref<StoryboardMetadata | null>(null)
const errorSync = ref('')
const sincronizando = ref(false)

function invalidarSync() {
  if (metaSync.value || errorSync.value) {
    metaSync.value = null
    errorSync.value = ''
  }
}

function validarSync() {
  const { meta, error } = parsearMetadata(textoMetadata.value)
  if (!meta) {
    errorSync.value = error ?? ''
    metaSync.value = null
    return
  }
  // La misma regla que aplica sincronizarBuild, pero avisada ANTES de mostrar el diff.
  if (sb.value && meta.clave !== sb.value.clave) {
    errorSync.value = t('platform.sbs.syncWrongKey')
    metaSync.value = null
    return
  }
  errorSync.value = ''
  metaSync.value = meta
}

const mismos = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join(',') === [...b].sort().join(',')

// El resumen de qué va a cambiar: si está vacío, no hay nada que sincronizar.
const cambiosSync = computed(() => {
  const m = metaSync.value
  const fila = sb.value
  if (!m || !fila) return []
  const cambios: string[] = []
  if (!mismos(m.idiomas, fila.idiomas ?? [])) {
    cambios.push(t('platform.sbs.syncLangs', { de: (fila.idiomas ?? []).join('·').toUpperCase() || '—', a: m.idiomas.join('·').toUpperCase() }))
  }
  if (m.numero_escenas !== fila.numero_escenas) {
    cambios.push(t('platform.sbs.syncScenes', { de: fila.numero_escenas, a: m.numero_escenas }))
  }
  if (m.tipo_codigo !== (fila.tipo?.codigo ?? null)) cambios.push(`${t('platform.sbs.colType')} → ${m.tipo_codigo}`)
  if ((m.categoria_codigo ?? null) !== (fila.categoria?.codigo ?? null)) cambios.push(`${t('platform.sbs.fCategory')} → ${m.categoria_codigo ?? '—'}`)
  if (m.audiencia_codigo !== (fila.audiencia?.codigo ?? null)) cambios.push(`${t('platform.sbs.fAudience')} → ${m.audiencia_codigo}`)
  // Cambios de escenas por folder (renombres de título no se listan: se aplican igual).
  const foldersFila = new Set(sb.value?.escenas.map(e => e.folder) ?? [])
  const nuevas = m.escenas.filter(e => !foldersFila.has(e.folder)).length
  const quitadas = [...foldersFila].filter(f => !m.escenas.some(e => e.folder === f)).length
  if (nuevas) cambios.push(t('platform.sbs.syncNewScenes', { n: nuevas }))
  if (quitadas) cambios.push(t('platform.sbs.syncRemovedScenes', { n: quitadas }))
  return cambios
})

async function sincronizar() {
  if (!sb.value || !metaSync.value) return
  sincronizando.value = true
  const { error } = await sincronizarBuild(sb.value.id, sb.value.clave, metaSync.value)
  sincronizando.value = false
  if (error) {
    toast.error(error)
    return
  }
  toast.success(t('platform.sbs.synced'))
  navigateTo(`/platform/storyboards/${sb.value.id}`)
}
</script>
