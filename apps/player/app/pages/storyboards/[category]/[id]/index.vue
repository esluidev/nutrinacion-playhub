<template>
  <div v-if="sb && loaded">
    <UiPageHeader :title="sb.title" :description="`${tipoLabel(sb.tipo)} · ${audienceLabel(sb.audience)}`">
      <template #actions>
        <UiButton :to="playUrl('educator')" icon="play">Probar como educador</UiButton>
        <UiButton :to="playUrl('home')" variant="outline">En casa</UiButton>
        <UiButton :to="playUrl('device')" variant="outline" target="_blank">Dispositivo</UiButton>
      </template>
    </UiPageHeader>


    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <UiCard :padding="false">
        <template #header>
          <h2 class="ui-title">Escenas</h2>
          <span class="ui-caption">{{ loaded.scenes.length }} de {{ sb.sceneCount }} con contenido</span>
        </template>
        <UiDataTable :columns="columns" :rows="rows" :page-size="0" flat>
          <template #cell-title="{ row }">
            <span class="font-black">{{ row.title }}</span>
            <span class="ui-caption block">{{ row.folder }}</span>
          </template>
          <template #cell-template="{ row }">
            <span v-if="row.template" class="badge" data-tone="sky">{{ row.template }}</span>
            <span v-else-if="row.hasContent" class="badge" data-tone="grape">propia</span>
            <span v-else class="badge" data-tone="warning">sin escena</span>
          </template>
          <template #cell-actions="{ row }">
            <UiButton v-if="row.hasContent" :to="playUrl('educator', row.folder)" size="sm" variant="outline" icon="play">Probar</UiButton>
          </template>
        </UiDataTable>
      </UiCard>

      <div class="space-y-6">
        <UiCard>
          <h2 class="ui-title mb-4">Metadata del build</h2>
          <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-body">
            <dt class="text-muted font-bold">Eje</dt><dd>{{ tipoLabel(sb.tipo) }}</dd>
            <dt class="text-muted font-bold">Categoría</dt><dd>{{ sb.categoria ?? '—' }}</dd>
            <dt class="text-muted font-bold">Edición</dt><dd>{{ audienceLabel(sb.audience) }}</dd>
            <dt class="text-muted font-bold">Enfoques</dt><dd>{{ sb.healthFocus.length ? sb.healthFocus.join(' · ') : '—' }}</dd>
            <dt class="text-muted font-bold">Idiomas</dt><dd>{{ sb.languages.join(' · ').toUpperCase() }}</dd>
            <dt v-if="sb.estimatedDuration" class="text-muted font-bold">Duración</dt><dd v-if="sb.estimatedDuration">{{ sb.estimatedDuration }} min</dd>
            <dt class="text-muted font-bold">Clave</dt><dd class="break-all font-mono text-caption">{{ sb.clave }}</dd>
          </dl>
        </UiCard>

        <!-- El catálogo en la base frente al JSON del build. -->
        <UiCard>
          <div class="mb-3 flex items-center justify-between gap-3">
            <h2 class="ui-title">En la base</h2>
            <UiBadge v-if="estado" :tone="ESTADO_CATALOGO[estado.estado].tone" dot>{{ ESTADO_CATALOGO[estado.estado].label }}</UiBadge>
          </div>
          <p v-if="errorCatalogo" class="field-error">{{ errorCatalogo }}</p>
          <p v-else-if="!estado" class="ui-text">Leyendo el catálogo…</p>
          <p v-else-if="estado.estado === 'sin_registrar'" class="ui-text">Todavía no está en el catálogo: Admin no lo ve ni se puede programar.</p>
          <p v-else-if="estado.estado === 'desactualizado'" class="ui-text">El JSON cambió: {{ estado.cambios.join(', ') }}.</p>
          <p v-else class="ui-text">La base coincide con el JSON del build.</p>
          <UiButton
            v-if="estado && estado.estado !== 'al_dia'"
            class="mt-5"
            block
            icon="send"
            :loading="sincronizando"
            @click="registrar"
          >
            {{ estado.estado === 'sin_registrar' ? 'Registrar en la base' : 'Actualizar en la base' }}
          </UiButton>
          <p class="ui-caption mt-3">Solo se escribe lo que viene del JSON. La publicación se decide abajo; la guía, en Admin.</p>
        </UiCard>

        <!-- La publicación: como un artículo. Estado, países (del catálogo) y, si es personalizado, la organización. -->
        <UiCard v-if="publicacion">
          <div class="mb-3 flex items-center justify-between gap-3">
            <h2 class="ui-title">Publicación</h2>
            <UiBadge :tone="uiPublicationTone(publicacion.estado)" dot>{{ ESTADO_PUBLICACION[publicacion.estado].label }}</UiBadge>
          </div>

          <div class="space-y-4">
            <div>
              <UiSelect v-model="form.estado" :options="estadoOpciones" label="Estado" />
              <p class="field-help">{{ ESTADO_PUBLICACION[form.estado].desc }}</p>
            </div>

            <div>
              <p class="field-label">Países</p>
              <p class="field-help mb-2 mt-0">Donde se ofrece (por tropicalización puede ser uno solo). Publicar exige al menos uno.</p>
              <div class="flex flex-wrap gap-2" role="group" aria-label="Países">
                <button
                  v-for="pais in paises"
                  :key="pais.codigo"
                  type="button"
                  class="filter filter-sm"
                  :aria-pressed="form.paises.includes(pais.codigo)"
                  @click="togglePais(pais.codigo)"
                >
                  <span v-if="pais.bandera">{{ pais.bandera }}</span>{{ pais.nombre }}
                </button>
              </div>
            </div>

            <div>
              <UiSelect v-model="form.organizacionId" :options="orgOpciones" label="Para quién" />
              <p class="field-help">Estándar: para todas las organizaciones. Una organización: personalizado, solo lo ve ella.</p>
            </div>

            <div>
              <p class="field-label">Guía (se escribe en Admin)</p>
              <ul class="space-y-1">
                <li v-for="g in publicacion.guiaPorIdioma" :key="g.idioma" class="flex items-center justify-between text-body">
                  <span class="font-bold">{{ g.idioma.toUpperCase() }}</span>
                  <span :class="g.escritas === g.total ? 'font-semibold text-muted' : 'font-semibold text-(--tone-strong)'" :data-tone="g.escritas === g.total ? undefined : 'coral'">
                    {{ g.escritas }} de {{ g.total }} escenas
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <UiButton class="mt-5" block icon="check" :loading="publicando" :disabled="!cambiosPublicacion" @click="guardarPublicacion">
            Guardar publicación
          </UiButton>
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
// Detalle de un storyboard del build. Player construye, prueba, registra en la base lo que dice su
// JSON y lo publica (estado, países y organización; decisión 006). La guía se escribe en Admin.
import { uiPublicationTone } from '@playhub/ui/app/utils/ui-tones'
import { loadStoryboard } from '~/runner/content'
import { ESTADO_CATALOGO, ESTADO_PUBLICACION } from '~/composables/useCatalogoBase'
import type { EstadoPublicacion } from '~/composables/useCatalogoBase'

const route = useRoute()
const { getStoryboard, tipoLabel, audienceLabel } = useStoryboards()
const category = String(route.params.category)
const id = String(route.params.id)

const sb = computed(() => {
  const row = getStoryboard(id)
  return row && row.tipo === category ? row : undefined
})
const loaded = loadStoryboard(category, id)

const columns = [
  { key: 'number', label: '#', width: 'w-14' },
  { key: 'title', label: 'Escena', grow: true },
  { key: 'template', label: 'Plantilla', width: 'w-32' },
  { key: 'points', label: 'Puntos', width: 'w-24', align: 'right' as const },
  { key: 'actions', label: '', width: 'w-32', align: 'right' as const },
]

// Todas las escenas que declara storyboard.json, con o sin su scene.json.
const rows = computed(() => (sb.value?.scenes ?? []).map((scene, i) => {
  const runner = loaded?.scenes.find(s => s.folder === scene.folder)
  return {
    number: i + 1,
    folder: scene.folder,
    title: scene.title,
    template: runner?.json.template,
    hasContent: Boolean(runner),
    points: runner?.json.defaults.pointsOnComplete ?? '—',
  }
}))

const { estadoDe, publicacionDe, sincronizar, publicar, paises, organizaciones, error: errorCatalogo } = useCatalogoBase()
const estado = computed(() => estadoDe(id))
const publicacion = computed(() => publicacionDe(id))
const sincronizando = ref(false)
const publicando = ref(false)
const { toast } = useToast()

// ── Publicación ───────────────────────────────────────────────────────────────
const form = reactive<{ estado: EstadoPublicacion, paises: string[], organizacionId: number | '' }>({
  estado: 'REGISTRADO', paises: [], organizacionId: '',
})
watch(publicacion, (p) => {
  if (!p) return
  form.estado = p.estado
  form.paises = [...p.paises]
  form.organizacionId = p.organizacionId ?? ''
}, { immediate: true })

const estadoOpciones = (Object.keys(ESTADO_PUBLICACION) as EstadoPublicacion[])
  .map(value => ({ value, label: ESTADO_PUBLICACION[value].label }))
const orgOpciones = computed(() => [
  { value: '', label: 'Estándar' },
  ...organizaciones.value.map(o => ({ value: o.id, label: o.nombre })),
])

const cambiosPublicacion = computed(() => !!publicacion.value && (
  form.estado !== publicacion.value.estado
  || (form.organizacionId || null) !== publicacion.value.organizacionId
  || [...form.paises].sort().join() !== [...publicacion.value.paises].sort().join()))

function togglePais(codigo: string) {
  form.paises = form.paises.includes(codigo) ? form.paises.filter(c => c !== codigo) : [...form.paises, codigo]
}

// La base hace cumplir las reglas (al menos un país para publicar, no quitar un país o despublicar
// lo que ya se usa…): su mensaje dice por qué.
async function guardarPublicacion() {
  publicando.value = true
  const error = await publicar(id, { estado: form.estado, paises: form.paises, organizacionId: form.organizacionId || null })
  publicando.value = false
  if (error) toast.error(error)
  else toast.success('Publicación guardada.')
}

async function registrar() {
  sincronizando.value = true
  const error = await sincronizar(id)
  sincronizando.value = false
  if (error) toast.error(error)
  else toast.success('Catálogo actualizado.')
}

function playUrl(mode: 'educator' | 'home' | 'device', escena?: string) {
  const base = `/play/${category}/${id}?mode=${mode}`
  return escena ? `${base}&escena=${escena}` : base
}
</script>
