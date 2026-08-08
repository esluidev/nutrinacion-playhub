<template>
  <!-- El formulario no ocupa todo el ancho, así que el encabezado va DENTRO del mismo
       contenedor centrado: si queda fuera, el título se alinea a la página y las tarjetas
       al centro, y se ven descolgados uno del otro. -->
  <div class="max-w-3xl mx-auto">
    <UiPageHeader :title="t('platform.sbs.newTitle')" :description="t('platform.sbs.newDesc')" />

    <div class="space-y-6">
      <!-- ── Paso 1: la metadata que produce Studio ───────────────────────── -->
      <UiCard>
        <h3 class="section-title mb-1">{{ t('platform.sbs.step1') }}</h3>
        <p class="text-[13px] text-gray-500 mb-4">{{ t('platform.sbs.step1Desc') }}</p>

        <textarea
          v-model="textoMetadata"
          class="input !h-44 !py-3 font-mono !text-[12.5px] leading-relaxed"
          :placeholder="t('platform.sbs.metadataPh')"
          spellcheck="false"
          @input="invalidar"
        />

        <div class="flex items-center gap-3 mt-3">
          <UiButton variant="outline" size="sm" :disabled="!textoMetadata.trim()" @click="analizar">
            {{ t('platform.sbs.validate') }}
          </UiButton>
          <p v-if="errorMetadata" class="text-[13px] font-semibold text-red-600">{{ errorMetadata }}</p>
          <p v-else-if="meta" class="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-primary-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
            {{ t('platform.sbs.validated') }}
          </p>
        </div>

        <!-- Lo build-owned: se muestra para confirmar, nunca se edita a mano. -->
        <div v-if="meta" class="mt-4 rounded-field bg-brand-tint border border-gray-200 p-4">
          <p class="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-3">{{ t('platform.sbs.fromBuild') }}</p>
          <dl class="grid grid-cols-2 gap-x-6 gap-y-2.5">
            <!-- Las filas normales reparten etiqueta-izquierda / valor-derecha dentro de su
                 media columna. La fila ancha NO puede heredar ese `justify-between`: el valor
                 se iría al borde derecho de la tarjeta, al doble de distancia que los demás y
                 desconectado de su etiqueta. Ahí el valor va pegado a la etiqueta. -->
            <div
              v-for="d in datosDelBuild"
              :key="d.label"
              :class="['flex items-baseline', d.ancho ? 'col-span-2 gap-3' : 'justify-between gap-2']"
            >
              <dt class="text-[12.5px] text-gray-500">{{ d.label }}</dt>
              <dd class="text-[13px] font-bold text-gray-800 font-mono truncate" :title="d.valor">{{ d.valor }}</dd>
            </div>
          </dl>
        </div>
      </UiCard>

      <!-- ── Paso 2: lo editorial, que se escribe acá ──────────────────────── -->
      <UiCard v-if="meta">
        <h3 class="section-title mb-1">{{ t('platform.sbs.step2') }}</h3>
        <p class="text-[13px] text-gray-500 mb-4">{{ t('platform.sbs.step2Desc') }}</p>

        <!-- Un tab por idioma DECLARADO en el build: no se inventan idiomas. -->
        <div v-if="meta.idiomas.length > 1" class="flex items-center gap-1.5 mb-4">
          <button
            v-for="l in meta.idiomas"
            :key="l"
            type="button"
            :class="['chip', l === idiomaActivo ? 'chip-active' : 'chip-inactive']"
            @click="idiomaActivo = l"
          >
            {{ l.toUpperCase() }}
            <span v-if="!tituloCompleto(l)" class="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </button>
        </div>

        <div class="space-y-4">
          <UiInput
            v-model="titulo[idiomaActivo]"
            :label="t('platform.sbs.fTitle')"
            :placeholder="t('platform.sbs.fTitlePh')"
            required
          />
          <div>
            <label class="block text-[13px] font-bold text-gray-700 mb-1.5">{{ t('platform.sbs.fDescription') }}</label>
            <textarea v-model="descripcion[idiomaActivo]" class="input !h-24 !py-2.5" :placeholder="t('platform.sbs.fDescriptionPh')" />
          </div>
          <div>
            <label class="block text-[13px] font-bold text-gray-700 mb-1.5">{{ t('platform.sbs.fObjective') }}</label>
            <textarea v-model="objetivo[idiomaActivo]" class="input !h-24 !py-2.5" :placeholder="t('platform.sbs.fObjectivePh')" />
          </div>
          <div>
            <label class="block text-[13px] font-bold text-gray-700 mb-1.5">{{ t('platform.sbs.fBibliography') }}</label>
            <textarea v-model="bibliografia[idiomaActivo]" class="input !h-20 !py-2.5" :placeholder="t('platform.sbs.fBibliographyPh')" />
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
      </UiCard>

      <div class="flex justify-end gap-2">
        <UiButton variant="outline" @click="navigateTo('/platform/storyboards')">{{ t('common.cancel') }}</UiButton>
        <UiButton v-if="meta" :disabled="!puedeGuardar" :loading="guardando" @click="guardar">
          {{ t('platform.sbs.register') }}
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { parsearMetadata } from '~/utils/metadataStoryboard'
import type { StoryboardMetadata } from '~/utils/metadataStoryboard'
import type { Localized } from '~/utils/types'

definePageMeta({ layout: 'dashboard', titleKey: 'platform.sbs.newTitle', descKey: 'platform.sbs.newDesc' })

const { t } = useT()
const { registrar } = usePlatformStoryboards()
const { listPaises, listOrganizacionesSimple } = usePlatform()
const { toast } = useToast()

const textoMetadata = ref('')
const meta = ref<StoryboardMetadata | null>(null)
const errorMetadata = ref('')
const idiomaActivo = ref('es')

const titulo = reactive<Localized>({})
const descripcion = reactive<Localized>({})
const objetivo = reactive<Localized>({})
const bibliografia = reactive<Localized>({})
const estado = ref('BORRADOR')
const duracionMin = ref('30')
const organizacionId = ref<number | ''>('')
const paises = ref<string[]>([])
const guardando = ref(false)

// Tocar el JSON descarta la validación previa: dejar el tilde verde sobre un texto ya
// editado sería mentir, y peor, permitiría registrar algo distinto de lo que se validó.
function invalidar() {
  if (meta.value || errorMetadata.value) {
    meta.value = null
    errorMetadata.value = ''
  }
}

function analizar() {
  if (!textoMetadata.value.trim()) {
    meta.value = null
    errorMetadata.value = ''
    return
  }
  const { meta: parseada, error } = parsearMetadata(textoMetadata.value)
  errorMetadata.value = error ?? ''
  meta.value = parseada
  if (!parseada) return

  // El título del build siembra el formulario; el resto se escribe a mano.
  idiomaActivo.value = parseada.idiomas[0] ?? 'es'
  for (const l of parseada.idiomas) {
    titulo[l] = parseada.titulo[l] ?? ''
    descripcion[l] ??= ''
    objetivo[l] ??= ''
    bibliografia[l] ??= ''
  }
}

const datosDelBuild = computed(() => {
  const m = meta.value
  if (!m) return []
  return [
    { label: t('platform.sbs.colStoryboard'), valor: m.slug },
    { label: t('platform.sbs.colType'), valor: m.tipo_codigo },
    { label: t('platform.sbs.fCategory'), valor: m.categoria_codigo ?? '—' },
    { label: t('platform.sbs.fAudience'), valor: m.audiencia_codigo },
    { label: t('platform.sbs.fScenes'), valor: String(m.numero_escenas) },
    { label: t('platform.sbs.fLanguages'), valor: m.idiomas.map(nombreIdioma).join(' · ') },
    // El uuid es largo: fila propia a lo ancho, si no se corta con puntos suspensivos.
    { label: t('platform.sbs.fKey'), valor: m.clave, ancho: true },
  ]
})

// «ES · EN» no le dice nada a quien no conozca los códigos: se muestran los nombres.
// Si apareciera un idioma sin etiqueta, `t` devuelve la clave — ahí cae al código en mayúscula.
function nombreIdioma(codigo: string): string {
  const etiqueta = t('lang.' + codigo)
  return etiqueta === 'lang.' + codigo ? codigo.toUpperCase() : etiqueta
}

function tituloCompleto(l: string) {
  return !!titulo[l]?.trim()
}

const estadoOpciones = computed(() => [
  { value: 'BORRADOR', label: t('sbState.BORRADOR') },
  { value: 'EN_REVISION', label: t('sbState.EN_REVISION') },
  { value: 'PUBLICADO', label: t('sbState.PUBLICADO') },
  { value: 'ARCHIVADO', label: t('sbState.ARCHIVADO') },
])

const orgs = ref<{ id: number, nombre: string }[]>([])
const orgOpciones = computed(() => [
  { value: '', label: t('platform.sbs.standard') },
  ...orgs.value.map(o => ({ value: o.id, label: o.nombre })),
])

const paisesCatalogo = ref<{ codigo: string, nombre: Localized, bandera: string | null }[]>([])
function togglePais(codigo: string) {
  paises.value = paises.value.includes(codigo)
    ? paises.value.filter(c => c !== codigo)
    : [...paises.value, codigo]
}

onMounted(async () => {
  orgs.value = await listOrganizacionesSimple()
  paisesCatalogo.value = await listPaises()
})

// El título es obligatorio en TODOS los idiomas declarados: publicar con uno vacío
// deja al educador con una tarjeta sin nombre en su idioma.
const puedeGuardar = computed(() =>
  !!meta.value && meta.value.idiomas.every(tituloCompleto) && !guardando.value)

// Solo se persisten los idiomas del build, y sin cadenas en blanco.
function recortar(campo: Localized): Localized {
  const salida: Localized = {}
  for (const l of meta.value?.idiomas ?? []) {
    const v = campo[l]?.trim()
    if (v) salida[l] = v
  }
  return salida
}

async function guardar() {
  if (!meta.value || !puedeGuardar.value) return
  guardando.value = true
  const obj = recortar(objetivo)
  const bib = recortar(bibliografia)
  const { id, error } = await registrar(meta.value, {
    titulo: recortar(titulo),
    descripcion: recortar(descripcion),
    objetivo: Object.keys(obj).length ? obj : null,
    bibliografia: Object.keys(bib).length ? bib : null,
    estado: estado.value,
    duracion_min: duracionMin.value ? Number(duracionMin.value) : null,
    portada: null,
    paises: paises.value,
    organizacion_id: organizacionId.value === '' ? null : Number(organizacionId.value),
  })
  guardando.value = false

  if (error) {
    toast.error(error)
    return
  }
  toast.success(t('platform.sbs.registered'))
  navigateTo(id ? `/platform/storyboards/${id}` : '/platform/storyboards')
}
</script>
