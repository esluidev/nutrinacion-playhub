<template>
  <div v-if="exists" class="max-w-3xl mx-auto">
    <!-- Header: acción + botones siempre a mano (flujo admin: Cancelar vuelve
         al detalle, Guardar persiste y vuelve) -->
    <UiCard :hover="false" class="mb-6">
      <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2.5">
            <span :class="['w-3 h-3 rounded-md shrink-0', form.portada]" />
            <h2 class="text-2xl font-display font-bold text-brand-dark leading-tight">
              {{ isRegistered ? 'Editar storyboard' : 'Crear registro' }}
            </h2>
          </div>
          <p class="text-xs text-gray-400 font-mono mt-1">{{ category }}/{{ id }}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UiButton variant="outline" @click="cancel">Cancelar</UiButton>
          <UiButton variant="primary" :disabled="!canSubmit" @click="submit">
            {{ isRegistered ? 'Guardar cambios' : 'Crear registro' }}
          </UiButton>
        </div>
      </div>
    </UiCard>

    <!-- Aviso de reconciliación: guardar también refleja el build -->
    <div
      v-if="drift.has"
      class="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 mb-4"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
      <p class="text-sm text-amber-800 min-w-0">
        <span class="font-semibold">Guardar también reconciliará el build:</span>
        <span v-for="(it, i) in drift.items" :key="it.label" class="font-medium">{{ i ? ' · ' : ' ' }}{{ it.label }}</span>
      </p>
    </div>

    <div class="space-y-6">
        <!-- Contenido: título + descripción + guía general, por idioma -->
        <UiCard :padding="false" :hover="false">
          <template #header>
            <div>
              <h3 class="section-title">Contenido</h3>
              <p class="text-xs text-gray-400 mt-0.5">Título, descripción y guía por idioma · dato de gestión</p>
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
                <span v-if="langIncomplete(l)" class="absolute top-1.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
              </button>
            </div>

            <div class="space-y-4">
              <UiInput v-model="form.titulo[activeLang]" label="Título" :placeholder="`Título en ${activeLang.toUpperCase()}`" />
              <div class="space-y-1.5">
                <label class="block text-sm font-semibold text-gray-700">Descripción</label>
                <textarea
                  v-model="form.descripcion[activeLang]"
                  rows="4"
                  class="input !h-auto py-2.5 leading-relaxed resize-y"
                  :placeholder="`Descripción en ${activeLang.toUpperCase()}`"
                />
              </div>

              <!-- Guía del storyboard (storyboards.objetivo / bibliografia): la parte
                   GENERAL del doc del educador. La guía POR ESCENA se edita en cada
                   escena (storyboard_escenas, tabla del detalle). -->
              <div class="pt-4 border-t border-gray-100 space-y-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">Guía del educador</p>
                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold text-gray-700">Objetivo</label>
                  <textarea
                    v-model="form.objetivo[activeLang]"
                    rows="3"
                    class="input !h-auto py-2.5 leading-relaxed resize-y"
                    :placeholder="`Objetivo del taller en ${activeLang.toUpperCase()}`"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold text-gray-700">Bibliografía</label>
                  <textarea
                    v-model="form.bibliografia[activeLang]"
                    rows="3"
                    class="input !h-auto py-2.5 leading-relaxed resize-y"
                    :placeholder="`Referencias en ${activeLang.toUpperCase()}`"
                  />
                </div>
              </div>

              <p v-if="isNewLang(activeLang)" class="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Idioma nuevo del build — completá estos textos.
              </p>
            </div>
          </div>
        </UiCard>

        <!-- Clasificación y disponibilidad -->
        <UiCard :padding="false" :hover="false">
          <template #header>
            <div>
              <h3 class="section-title">Clasificación y disponibilidad</h3>
              <p class="text-xs text-gray-400 mt-0.5">Estado, propiedad y países · dato de gestión</p>
            </div>
          </template>

          <div class="p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block text-sm font-semibold text-gray-700">Estado</label>
                <UiDropdown v-model="form.estado" :options="STATUS_OPTIONS" block aria-label="Estado de publicación" />
              </div>

              <div class="space-y-1.5">
                <label class="block text-sm font-semibold text-gray-700">Duración</label>
                <UiDropdown v-model="form.duracion" :options="DURATION_OPTIONS" block placeholder="Seleccionar duración" aria-label="Duración" />
              </div>

              <div class="space-y-1.5">
                <label class="block text-sm font-semibold text-gray-700">Propiedad</label>
                <UiDropdown v-model="form.propiedad" :options="PROPIEDAD_OPTIONS" block aria-label="Propiedad" />
              </div>

              <div class="space-y-1.5">
                <label class="block text-sm font-semibold text-gray-700">
                  Organización dueña
                  <span v-if="form.propiedad === 'personalizado'" class="text-red-500">*</span>
                </label>
                <UiDropdown
                  v-model="form.organizacion"
                  :options="orgOptions"
                  :disabled="form.propiedad === 'estandar'"
                  block
                  :placeholder="form.propiedad === 'estandar' ? 'Sin organización (estándar)' : 'Seleccionar organización'"
                  aria-label="Organización dueña"
                />
                <p v-if="organizacionError" class="text-xs text-red-500">{{ organizacionError }}</p>
                <p v-else-if="form.propiedad === 'estandar'" class="text-xs text-gray-400">
                  Parte del catálogo base, sin organización dueña.
                </p>
              </div>

              <!-- Disponibilidad por país (vacío = global) -->
              <div class="space-y-1.5 sm:col-span-2">
                <label class="block text-sm font-semibold text-gray-700">Disponibilidad por país</label>
                <UiMultiSelect
                  v-model="form.paises"
                  :options="paisOptions"
                  empty-label="Global — todos los países"
                  search-placeholder="Buscar país..."
                  no-results-label="Sin coincidencias"
                  aria-label="Disponibilidad por país"
                />
                <p class="text-xs text-gray-400">
                  {{ form.paises.length
                    ? `Disponible en ${form.paises.length} país${form.paises.length === 1 ? '' : 'es'}.`
                    : 'Global — disponible en todos los países.' }}
                </p>
              </div>

              <div class="space-y-1.5 sm:col-span-2">
                <label class="block text-sm font-semibold text-gray-700">Portada</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="c in COVER_PALETTE"
                    :key="c"
                    type="button"
                    :class="['w-8 h-8 rounded-lg ring-2 ring-offset-2 transition', c, form.portada === c ? 'ring-brand-dark' : 'ring-transparent hover:ring-gray-200']"
                    :aria-label="c"
                    @click="form.portada = c"
                  />
                </div>
              </div>
            </div>
          </div>

        </UiCard>

        <p class="text-xs text-gray-400">
          {{ isRegistered ? 'Representación · se persiste al conectar Supabase.' : 'Aún sin registro · al crearlo se sembrará en Supabase (representación).' }}
        </p>
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
// EDICIÓN del catálogo del storyboard, en página propia (flujo administrativo:
// el detalle solo muestra; aquí se edita y se guarda). Guardar persiste el
// catálogo editable + reconcilia los derivados del build (003: no hay
// "sincronizar" aparte) vía updateCatalog → store mock → Supabase al conectar.
// ─────────────────────────────────────────────────────────────────────────────
import { tr } from '~/types/i18n'
import type { PublicationStatus, Propiedad } from '~/types/storyboard'

const route = useRoute()
const {
  getStoryboard,
  getCatalogRow,
  updateCatalog,
  storyboardDrift,
} = useStoryboards()

const category = computed(() => String(route.params.category))
const id = computed(() => String(route.params.id))
const detailUrl = computed(() => `/storyboards/${category.value}/${id.value}`)

// Vista en vivo (existe para todo build compilado) — valida la ruta.
const view = getStoryboard(id.value)
const exists = !!view && view.tipo === category.value
// Fila CRUDA del catálogo (snapshot + gestión): semilla del form. Puede no
// existir aún (build sin registro) — el primer guardado la crea.
const catalog = getCatalogRow(id.value)

// Build (fuente de verdad compilada).
const runner = useStoryboardRunner(category.value, id.value, 'es')
const build = runner.definition
const buildLangs = computed<string[]>(() => build?.languages ?? ['es'])

const isRegistered = computed(() => !!catalog && catalog.status !== 'borrador')
const drift = computed(() => storyboardDrift(id.value))

function isNewLang(l: string) {
  return !(catalog?.languages ?? []).includes(l)
}

// ── Opciones de los controles ─────────────────────────────────────────────────
const STATUS_OPTIONS: { value: PublicationStatus, label: string, dot: string }[] = [
  { value: 'borrador', label: 'Borrador', dot: 'bg-gray-400' },
  { value: 'en_revision', label: 'En revisión', dot: 'bg-yellow-500' },
  { value: 'publicado', label: 'Publicado', dot: 'bg-green-500' },
  { value: 'archivado', label: 'Archivado', dot: 'bg-brand-coral-500' },
]
const PROPIEDAD_OPTIONS: { value: Propiedad, label: string }[] = [
  { value: 'estandar', label: 'Estándar' },
  { value: 'personalizado', label: 'Personalizado' },
]
const COVER_PALETTE = [
  'bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-violet-500',
  'bg-rose-500', 'bg-teal-500', 'bg-orange-500', 'bg-indigo-500',
]
const { paises } = usePaises()
const paisOptions = computed(() =>
  paises.value.map(p => ({ value: p.codigo, label: p.nombre, icon: p.bandera, sublabel: p.region })))
const { organizaciones } = useOrganizaciones()
const orgOptions = computed(() =>
  organizaciones.value.map(o => ({ value: o.id, label: o.nombre, description: o.tipo })))
// Duración en MINUTOS (int, mapea a storyboards.duracion_min) como vocabulario
// controlado. Si el valor del catálogo no es un preset, se agrega para no perderlo.
const DURATION_PRESETS = [15, 20, 25, 30, 40, 45, 60]
const DURATION_OPTIONS = computed(() => {
  const values = DURATION_PRESETS.map(String)
  if (form.duracion && !values.includes(form.duracion)) values.unshift(form.duracion)
  return values.map(v => ({ value: v, label: `${v} min` }))
})

// ── Formulario ────────────────────────────────────────────────────────────────
const activeLang = ref(buildLangs.value[0] ?? 'es')
const form = reactive({
  titulo: {} as Record<string, string>,
  descripcion: {} as Record<string, string>,
  objetivo: {} as Record<string, string>,
  bibliografia: {} as Record<string, string>,
  duracion: '', // minutos como string (valor de UiDropdown) → duracion_min
  portada: '',
  propiedad: 'estandar' as Propiedad,
  organizacion: '',
  paises: [] as string[],
  estado: 'borrador' as PublicationStatus,
})

function seedForm() {
  if (!exists) return
  const titulo: Record<string, string> = {}
  const descripcion: Record<string, string> = {}
  const objetivo: Record<string, string> = {}
  const bibliografia: Record<string, string> = {}
  for (const l of buildLangs.value) {
    // es = título customizado del catálogo (o el del build si no hay fila);
    // otros idiomas = semilla del build.
    titulo[l] = l === 'es' ? (catalog?.title ?? tr(build?.title ?? '', 'es')) : tr(build?.title ?? '', l, 'es')
    descripcion[l] = l === 'es' ? (catalog?.description ?? '') : ''
    objetivo[l] = catalog?.objetivo?.[l] ?? ''
    bibliografia[l] = catalog?.bibliografia?.[l] ?? ''
  }
  form.titulo = titulo
  form.descripcion = descripcion
  form.objetivo = objetivo
  form.bibliografia = bibliografia
  form.duracion = String(parseInt(catalog?.duration ?? '', 10) || '')
  form.portada = catalog?.coverColor ?? COVER_PALETTE[0]!
  form.propiedad = catalog?.propiedad ?? 'estandar'
  form.organizacion = catalog?.organizacion ?? ''
  form.paises = [...(catalog?.paises ?? [])]
  form.estado = catalog?.status ?? 'borrador'
}
seedForm()
const pristine = ref(JSON.stringify(form))
const dirty = computed(() => JSON.stringify(form) !== pristine.value)

function langIncomplete(l: string) {
  return isNewLang(l) || !form.titulo[l]?.trim() || !form.descripcion[l]?.trim()
}
const organizacionError = computed(() =>
  form.propiedad === 'personalizado' && !form.organizacion.trim() ? 'Requerida para propiedad personalizada' : '')

// Al pasar a estándar se limpia la organización (el campo queda deshabilitado).
watch(() => form.propiedad, (p) => {
  if (p === 'estandar') form.organizacion = ''
})

// Habilitado: sin registro siempre se puede crear; con registro, si hay ediciones
// o si el build cambió (drift) y hay que reflejarlo al guardar.
const canSubmit = computed(() => {
  if (organizacionError.value) return false
  if (!isRegistered.value) return true
  return dirty.value || drift.value.has
})

// Guardar = persiste TODO al store (→ Supabase al conectar): campos editables del
// catálogo + las partes estáticas derivadas del build (reconcilia el drift).
function submit() {
  if (!canSubmit.value || !exists) return
  updateCatalog(id.value, {
    // Editable por el usuario
    title: form.titulo.es || form.titulo[buildLangs.value[0]!] || tr(build?.title ?? '', 'es'),
    description: form.descripcion.es ?? '',
    objetivo: { ...form.objetivo },
    bibliografia: { ...form.bibliografia },
    // En la BD va duracion_min (int); el mock conserva el string de display.
    duration: form.duracion ? `${form.duracion} min` : '',
    coverColor: form.portada,
    propiedad: form.propiedad,
    organizacion: form.propiedad === 'personalizado' ? form.organizacion : undefined,
    paises: [...form.paises],
    status: form.estado,
    // SNAPSHOT de lo build-owned (guardar = registrar/sincronizar el build):
    // la vista siempre muestra el build vivo; esto reconcilia el drift.
    languages: [...buildLangs.value],
    sceneCount: build?.scenes.length ?? 0,
    categoria: build?.category ? build.category.toLowerCase().replace(/_/g, '-') : catalog?.categoria,
    audience: build?.audience ?? catalog?.audience ?? '',
  })
  navigateTo(detailUrl.value)
}

function cancel() {
  navigateTo(detailUrl.value)
}
</script>
