<template>
  <div v-if="sb && loaded">
    <!-- Cabecera: qué es, cómo está (los dos estados) y qué toca hacer. Una sola acción en lima:
         registrar o actualizar en la base, solo mientras haga falta. -->
    <header class="ui-page-header">
      <div class="min-w-0">
        <p class="eyebrow mb-2">{{ tipoLabel(sb.tipo) }} · {{ audienceLabel(sb.audience) }}</p>
        <h1 class="ui-heading">{{ sb.title }}</h1>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <UiBadge v-if="estado" :tone="ESTADO_CATALOGO[estado.estado].tone" dot :title="ESTADO_CATALOGO[estado.estado].desc">
            {{ ESTADO_CATALOGO[estado.estado].label }}
          </UiBadge>
          <UiBadge v-else tone="neutral">Leyendo la base…</UiBadge>
          <UiBadge v-if="publicacion" :tone="uiPublicationTone(publicacion.estado)" dot :title="ESTADO_PUBLICACION[publicacion.estado].desc">
            {{ ESTADO_PUBLICACION[publicacion.estado].label }}
          </UiBadge>
          <UiBadge v-if="organizacion" :tone="uiToneFor(organizacion.nombre)" :title="`Personalizado: solo lo ve ${organizacion.nombre}`">
            {{ organizacion.nombre }}
          </UiBadge>
          <span class="font-mono text-caption text-muted" :title="`Clave del storyboard (key): la identidad en la base`">{{ sb.clave }}</span>
        </div>
        <p class="ui-text mt-2">{{ paso }}</p>
      </div>
      <div class="ui-page-header-actions">
        <UiButton variant="outline" icon="play" :to="playUrl()">Probar en el runner</UiButton>
        <UiButton
          v-if="estado && estado.estado !== 'al_dia'"
          icon="send"
          :loading="sincronizando"
          :disabled="!!estado.errores.length"
          @click="registrar"
        >
          {{ estado.estado === 'sin_registrar' ? 'Registrar en la base' : 'Actualizar en la base' }}
        </UiButton>
      </div>
    </header>

    <UiAlert v-if="errorCatalogo" tone="danger" class="mb-6">
      <p>{{ errorCatalogo }}</p>
      <UiButton tone="neutral" size="sm" icon="retry" class="mt-3" :loading="cargando" @click="cargar">Volver a leer</UiButton>
    </UiAlert>

    <UiAlert v-if="estado?.errores.length" tone="danger" title="El JSON tiene errores: no se puede registrar" class="mb-6">
      <ul class="mt-1 list-disc pl-5">
        <li v-for="e in estado.errores" :key="e">{{ e }}</li>
      </ul>
      <p class="mt-2">Los códigos válidos son los de las listas cerradas de la base (catalogo.md). Corrige el JSON y vuelve a compilar.</p>
    </UiAlert>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <!-- ── Lo que viene del JSON ─────────────────────────────────────────── -->
      <UiCard :padding="false">
        <template #header>
          <div class="min-w-0">
            <h2 class="ui-title">Lo que viene del JSON</h2>
            <p class="ui-caption mt-0.5">content/storyboards/{{ category }}/{{ id }}/storyboard.json. Es lo único que se escribe en la base al registrar.</p>
          </div>
        </template>

        <dl class="grid gap-x-6 gap-y-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="d in datosJson" :key="d.label" class="min-w-0">
            <dt class="eyebrow mb-1">{{ d.label }}</dt>
            <dd :class="['text-body font-extrabold text-ink', d.mono && 'break-all font-mono text-caption']">{{ d.valor }}</dd>
          </div>
        </dl>

        <!-- Qué cambió frente a la base, campo por campo y con los dos valores. -->
        <div v-if="estado?.estado === 'desactualizado'" class="border-t border-line p-6">
          <UiAlert tone="sun" title="El JSON cambió frente a la base">
            Cambia: {{ estado.cambios.join(', ') }}. Al actualizar, la base dirá lo que dice el JSON; la publicación y la guía no se tocan.
          </UiAlert>
          <ul class="mt-4 divide-y divide-line">
            <li v-for="d in estado.diferencias" :key="d.campo" class="py-3 first:pt-0 last:pb-0">
              <p class="font-extrabold text-ink first-letter:uppercase">{{ d.campo }}</p>
              <div class="mt-1.5 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                <p class="text-body font-semibold text-muted"><span class="eyebrow mr-2">En la base</span>{{ d.base }}</p>
                <p class="text-body font-semibold text-ink"><span class="eyebrow mr-2">En el JSON</span>{{ d.json }}</p>
              </div>
              <ul v-if="d.detalle?.length" class="mt-2 space-y-1">
                <li v-for="linea in d.detalle" :key="linea" class="ui-caption">· {{ linea }}</li>
              </ul>
            </li>
          </ul>
          <UiAlert v-if="estado.escenasQueSeQuitan.length" tone="coral" class="mt-4">
            Al actualizar se borra la guía escrita de {{ estado.escenasQueSeQuitan.length === 1 ? 'la escena' : 'las escenas' }}
            <strong>{{ estado.escenasQueSeQuitan.join(', ') }}</strong>. Si solo cambió el nombre de la carpeta, renómbrala antes en el JSON.
          </UiAlert>
        </div>

        <!-- Las escenas que declara storyboard.json, con o sin su scene.json, y su guía por idioma. -->
        <div class="border-t border-line">
          <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
            <h3 class="ui-title">Escenas</h3>
            <span class="ui-caption">{{ loaded.scenes.length }} de {{ sb.sceneCount }} con contenido<template v-if="sb.estimatedDuration"> · {{ sb.estimatedDuration }} min en total</template></span>
          </div>
          <UiDataTable :columns="columnasEscenas" :rows="escenas" :row-key="(r) => r.folder" :page-size="0" flat>
            <template #cell-numero="{ row }">
              <span class="ui-symbol ui-symbol-sm" :data-area="sb.tipo" aria-hidden="true">{{ row.numero }}</span>
            </template>
            <template #cell-title="{ row }">
              <span class="font-extrabold text-ink">{{ row.title }}</span>
              <span class="block font-mono text-caption text-muted">scenes/{{ row.folder }}/</span>
            </template>
            <template #cell-template="{ row }">
              <UiBadge v-if="row.template" tone="sky">{{ row.template }}</UiBadge>
              <UiBadge v-else-if="row.hasContent" tone="grape" title="Sin plantilla: trae su propio scene.vue">propia</UiBadge>
              <UiBadge v-else tone="coral" title="La carpeta no tiene scene.json: el runner la salta">sin scene.json</UiBadge>
            </template>
            <template #cell-guia="{ row }">
              <div v-if="row.guia" class="flex flex-wrap gap-1.5">
                <UiBadge
                  v-for="idioma in sb.languages"
                  :key="idioma"
                  :tone="row.guia.includes(idioma) ? 'lime' : 'neutral'"
                  :title="`${nombreIdioma(idioma)}: ${row.guia.includes(idioma) ? 'con guía' : 'sin guía'}`"
                >
                  {{ idioma.toUpperCase() }}
                </UiBadge>
              </div>
              <span v-else class="ui-caption">—</span>
            </template>
            <template #cell-acciones="{ row }">
              <UiButton
                v-if="row.hasContent"
                tone="neutral"
                size="sm"
                icon="play"
                icon-only
                label="Probar esta escena"
                title="Probar esta escena"
                :to="playUrl(row.folder)"
              />
            </template>
          </UiDataTable>
        </div>
      </UiCard>

      <div class="space-y-6">
        <!-- ── Publicación ───────────────────────────────────────────────── -->
        <UiCard>
          <div class="mb-4 flex items-center justify-between gap-3">
            <h2 class="ui-title">Publicación</h2>
            <UiBadge v-if="publicacion" :tone="uiPublicationTone(publicacion.estado)" dot>{{ ESTADO_PUBLICACION[publicacion.estado].label }}</UiBadge>
          </div>

          <p v-if="!publicacion" class="ui-text">
            Regístralo en la base para decidir su estado, en qué países se ofrece y para quién.
          </p>

          <div v-else class="space-y-5">
            <div>
              <UiSelect v-model="form.estado" :options="estadoOpciones" label="Estado" />
              <p class="field-help">{{ ESTADO_PUBLICACION[form.estado].desc }}</p>
            </div>

            <div>
              <p class="field-label">Países</p>
              <p v-if="!paises.length" class="ui-text">No se pudo leer el catálogo de países.</p>
              <div v-else class="flex flex-wrap gap-2" role="group" aria-label="Países donde se ofrece">
                <button
                  v-for="pais in paises"
                  :key="pais.codigo"
                  type="button"
                  class="filter filter-sm"
                  :aria-pressed="form.paises.includes(pais.codigo)"
                  @click="togglePais(pais.codigo)"
                >
                  <span v-if="pais.bandera" aria-hidden="true">{{ pais.bandera }}</span>{{ pais.nombre }}
                </button>
              </div>
              <p class="field-help">Donde se ofrece (por tropicalización puede ser uno solo). Publicar pide al menos uno.</p>
            </div>

            <div>
              <UiSelect :model-value="form.organizacionId" :options="orgOpciones" label="Para quién" @update:model-value="(v) => { form.organizacionId = typeof v === 'number' ? v : null }" />
              <p class="field-help">Estándar: lo ven todas las organizaciones de sus países. Una organización: personalizado, solo lo ve ella.</p>
            </div>

            <!-- Lima solo si la cabecera no tiene ya la acción principal (registrar/actualizar). -->
            <UiButton
              block
              icon="check"
              :variant="estado?.estado === 'al_dia' ? 'primary' : 'outline'"
              :loading="publicando"
              :disabled="!cambiosPublicacion"
              @click="guardarPublicacion"
            >
              Guardar publicación
            </UiButton>
            <p class="ui-caption">
              Última escritura en la base: {{ fecha(publicacion.actualizado) }}.
              La base frena lo que no se puede: publicar sin país, despublicar lo que ya se usa, quitar un país con workshops por venir.
            </p>
          </div>
        </UiCard>

        <!-- ── Guía ──────────────────────────────────────────────────────── -->
        <UiCard>
          <div class="mb-4 flex items-center justify-between gap-3">
            <h2 class="ui-title">Guía</h2>
            <span class="ui-caption">Se escribe en Admin</span>
          </div>

          <p v-if="!publicacion" class="ui-text">
            Cuando esté registrado, Admin podrá escribir su guía escena por escena, en cada idioma.
          </p>

          <div v-else class="space-y-4">
            <div v-for="g in publicacion.guiaPorIdioma" :key="g.idioma">
              <div class="mb-1.5 flex items-center justify-between gap-3">
                <span class="text-body font-extrabold text-ink">{{ nombreIdioma(g.idioma) }}</span>
                <UiBadge :tone="tonoGuia(g.escritas, g.total)">{{ g.escritas }} de {{ g.total }} escenas</UiBadge>
              </div>
              <UiProgress :value="g.escritas" :max="g.total || 1" :tone="tonoGuia(g.escritas, g.total)" :label="`Guía en ${nombreIdioma(g.idioma)}`" />
            </div>
            <p class="ui-caption">El educador la ve en el runner dentro de Educators. Aquí solo se mira.</p>
            <UiButton v-if="urlAdmin" variant="outline" size="sm" icon="external" :href="urlAdmin" target="_blank" rel="noopener">
              Abrir en Admin
            </UiButton>
          </div>
        </UiCard>
      </div>
    </div>
  </div>

  <UiCard v-else>
    <UiEmptyState icon="search" title="Storyboard no encontrado" text="No existe en el build de Player.">
      <UiButton to="/storyboards" variant="outline">Volver a Storyboards</UiButton>
    </UiEmptyState>
  </UiCard>
</template>

<script setup lang="ts">
// Detalle de un storyboard del build (decisiones 006 y 007): lo que viene del JSON (lo único que
// Player registra en la base, con qué cambió si está desactualizado), su publicación (estado,
// países y organización, que se deciden aquí) y su guía (que se escribe en Admin y aquí se mira).
import { uiPublicationTone, uiToneFor } from '@playhub/ui/app/utils/ui-tones'
import { loadStoryboard } from '~/runner/content'
import { ESTADO_CATALOGO, ESTADO_PUBLICACION, ORDEN_PUBLICACION, nombreIdioma, siguientePaso, tonoGuia } from '~/utils/catalogoResumen'
import type { EstadoPublicacion } from '~/utils/catalogoResumen'
import { construirMetadata } from '~/utils/storyboardMetadata'

const route = useRoute()
const { getStoryboard, tipoLabel, audienceLabel } = useStoryboards()
const category = String(route.params.category)
const id = String(route.params.id)

const sb = computed(() => {
  const row = getStoryboard(id)
  return row && row.tipo === category ? row : undefined
})
const loaded = loadStoryboard(category, id)

const {
  estadoDe, publicacionDe, organizacionDe, urlGuiaEnAdmin, sincronizar, publicar, paises, organizaciones,
  error: errorCatalogo, cargando, cargar,
} = useCatalogoBase()
const { toast } = useToast()

onMounted(cargar)

const estado = computed(() => estadoDe(id))
const publicacion = computed(() => publicacionDe(id))
const organizacion = computed(() => organizacionDe(publicacion.value?.organizacionId ?? null))
const paso = computed(() => siguientePaso(estado.value?.estado ?? null, publicacion.value, estado.value?.errores ?? []))
const urlAdmin = computed(() => (publicacion.value ? urlGuiaEnAdmin(publicacion.value.id) : null))

// ── Lo que viene del JSON ─────────────────────────────────────────────────────
const datosJson = computed(() => {
  if (!sb.value || !loaded) return []
  const meta = construirMetadata(loaded.json)
  const localizado = (valor: Record<string, string>) => Object.entries(valor).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(' · ') || '—'
  return [
    { label: 'Clave (key)', valor: meta.clave, mono: true },
    { label: 'Slug', valor: meta.slug, mono: true },
    { label: 'Versión del build', valor: meta.version_build ?? '—' },
    { label: 'Título', valor: localizado(meta.titulo) },
    { label: 'Eje', valor: `${tipoLabel(sb.value.tipo)} (${meta.categoria})` },
    { label: 'Subcategoría', valor: meta.subcategoria ?? '—' },
    { label: 'Edición', valor: `${audienceLabel(sb.value.audience)} (${meta.edicion})` },
    { label: 'Enfoques de salud', valor: meta.enfoques_salud.join(', ') || '—' },
    { label: 'Idiomas', valor: meta.idiomas.map(nombreIdioma).join(' · ') },
    { label: 'Idioma principal', valor: nombreIdioma(meta.idioma_principal) },
    { label: 'Duración', valor: meta.duracion_min ? `${meta.duracion_min} min` : '—' },
    { label: 'Escenas', valor: String(meta.escenas.length) },
  ]
})

const columnasEscenas = [
  { key: 'numero', label: '#', width: 'w-14' },
  { key: 'title', label: 'Escena', grow: true },
  { key: 'template', label: 'Plantilla' },
  { key: 'guia', label: 'Guía' },
  { key: 'acciones', label: '', width: 'w-16', align: 'right' as const },
]

// Todas las escenas que declara storyboard.json, con o sin su scene.json, y en qué idiomas tienen guía.
const escenas = computed(() => (sb.value?.scenes ?? []).map((scene, i) => {
  const runner = loaded?.scenes.find(s => s.folder === scene.folder)
  return {
    numero: i + 1,
    folder: scene.folder,
    title: scene.title,
    template: runner?.json.template,
    hasContent: Boolean(runner),
    guia: publicacion.value?.guiaPorEscena[scene.folder] ?? null,
  }
}))

// ── Registrar o actualizar ────────────────────────────────────────────────────
const sincronizando = ref(false)

async function registrar() {
  const nuevo = estado.value?.estado === 'sin_registrar'
  sincronizando.value = true
  const error = await sincronizar(id)
  sincronizando.value = false
  if (error) toast.error(error)
  else toast.success(nuevo ? 'Registrado en la base. Ya puedes decidir su publicación.' : 'La base quedó al día con el JSON.')
}

// ── Publicación ───────────────────────────────────────────────────────────────
const form = reactive<{ estado: EstadoPublicacion, paises: string[], organizacionId: number | null }>({
  estado: 'REGISTRADO', paises: [], organizacionId: null,
})
watch(publicacion, (p) => {
  if (!p) return
  form.estado = p.estado
  form.paises = [...p.paises]
  form.organizacionId = p.organizacionId
}, { immediate: true })

const estadoOpciones = ORDEN_PUBLICACION.map(value => ({ value, label: ESTADO_PUBLICACION[value].label }))
const orgOpciones = computed(() => [
  { value: null, label: 'Estándar (todas las organizaciones)' },
  ...organizaciones.value.map(o => ({ value: o.id, label: o.nombre })),
])

const cambiosPublicacion = computed(() => !!publicacion.value && (
  form.estado !== publicacion.value.estado
  || form.organizacionId !== publicacion.value.organizacionId
  || [...form.paises].sort().join() !== [...publicacion.value.paises].sort().join()))

function togglePais(codigo: string) {
  form.paises = form.paises.includes(codigo) ? form.paises.filter(c => c !== codigo) : [...form.paises, codigo]
}

const publicando = ref(false)

// La base hace cumplir las reglas (al menos un país para publicar, no despublicar lo que ya se
// usa, no quitar un país con workshops por venir…): su mensaje, traducido, dice por qué.
async function guardarPublicacion() {
  publicando.value = true
  const error = await publicar(id, { estado: form.estado, paises: form.paises, organizacionId: form.organizacionId })
  publicando.value = false
  if (error) toast.error(error)
  else toast.success(form.estado === 'PUBLICADO' ? 'Publicado: las organizaciones de sus países ya lo pueden programar.' : 'Publicación guardada.')
}

const fecha = (iso: string) => new Date(iso).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })

function playUrl(escena?: string) {
  const base = `/play/${category}/${id}?mode=educator`
  return escena ? `${base}&escena=${escena}` : base
}
</script>
