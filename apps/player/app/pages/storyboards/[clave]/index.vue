<template>
  <div v-if="sb && loaded">
    <!-- El detalle de un storyboard: arriba qué es y su estado de publicación, con «Probar» y, solo cuando hace falta,
         la acción principal (registrarlo o actualizarlo en la base). Debajo, un aviso solo si hay algo que hacer con
         la base. En dos tercios, sus escenas (plantilla, guía por idioma, escribir su guía y probarla); en un tercio, su
         publicación (para leer; se cambia en su diálogo), su guía y sus datos. Nada técnico a la vista que no se use. -->
    <header class="ui-page-header">
      <div class="flex min-w-0 items-center gap-4">
        <!-- Su portada, la que sale en la app del hogar (tarea 025) -->
        <span v-if="portada" class="portada-detalle" aria-hidden="true"><img :src="portada" alt=""></span>
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="ui-heading min-w-0">{{ sb.title }}</h1>
            <UiBadge v-if="publicacion" :tone="uiPublicationTone(publicacion.estado)" dot>{{ ESTADO_PUBLICACION[publicacion.estado].label }}</UiBadge>
            <UiBadge v-else-if="estado" :tone="ESTADO_CATALOGO[estado.estado].tone" dot>{{ ESTADO_CATALOGO[estado.estado].label }}</UiBadge>
          </div>
          <p class="ui-text mt-1.5">{{ resumen }}</p>
        </div>
      </div>
      <div class="ui-page-header-actions">
        <UiButton variant="outline" icon="play" :to="playUrl()">Probar</UiButton>
        <UiButton
          v-if="estado && estado.estado !== 'al_dia'"
          icon="send"
          :loading="sincronizando"
          :disabled="!!estado.errores.length"
          @click="registrar"
        >
          {{ estado.estado === 'sin_registrar' ? 'Registrar' : 'Actualizar' }}
        </UiButton>
      </div>
    </header>

    <UiAlert v-if="errorCatalogo" tone="danger" class="mb-6">
      <p>{{ errorCatalogo }}</p>
      <UiButton tone="neutral" size="sm" icon="retry" class="mt-3" :loading="cargando" @click="cargar">Volver a leer</UiButton>
    </UiAlert>

    <!-- Solo cuando hay algo que hacer con la base: el JSON tiene errores, todavía no está o cambió. -->
    <UiAlert v-if="estado?.errores.length" tone="danger" title="El JSON tiene errores: no se puede registrar" class="mb-6">
      <ul class="mt-1 list-disc pl-5">
        <li v-for="e in estado.errores" :key="e">{{ e }}</li>
      </ul>
    </UiAlert>
    <UiAlert v-else-if="estado?.estado === 'sin_registrar'" tone="sun" title="Todavía no está en la base" class="mb-6">
      Regístralo para publicarlo y escribir su guía.
    </UiAlert>
    <UiAlert v-else-if="estado?.estado === 'desactualizado'" tone="sun" title="El JSON cambió" class="mb-6">
      <p>Cambia: {{ estado.cambios.join(', ') }}. Al actualizar, la publicación y la guía se conservan.</p>
      <button type="button" class="ui-link mt-2 gap-1.5 text-caption" :aria-expanded="verCambios" @click="verCambios = !verCambios">
        {{ verCambios ? 'Ocultar los cambios' : 'Ver los cambios' }}
        <UiIcon name="chevron-down" :class="['size-3.5 transition-transform', verCambios && 'rotate-180']" />
      </button>
      <ul v-if="verCambios" class="mt-3 space-y-3">
        <li v-for="d in estado.diferencias" :key="d.campo">
          <p class="font-extrabold first-letter:uppercase">{{ d.campo }}</p>
          <p class="mt-0.5"><span class="eyebrow mr-2">Base</span>{{ d.base }}</p>
          <p><span class="eyebrow mr-2">JSON</span>{{ d.json }}</p>
          <ul v-if="d.detalle?.length" class="mt-1 space-y-0.5">
            <li v-for="linea in d.detalle" :key="linea" class="ui-caption">· {{ linea }}</li>
          </ul>
        </li>
      </ul>
      <p v-if="estado.escenasQueSeQuitan.length" class="mt-3 font-bold text-(--tone-strong)" data-tone="coral">
        Se borra la guía de {{ estado.escenasQueSeQuitan.length === 1 ? 'la escena' : 'las escenas' }} {{ estado.escenasQueSeQuitan.join(', ') }}.
      </p>
    </UiAlert>

    <div class="grid items-start gap-6 lg:grid-cols-3">
      <!-- ── Escenas ───────────────────────────────────────────────────────── -->
      <section class="ui-panel overflow-hidden lg:col-span-2">
        <div class="ui-panel-header">
          <h2 class="ui-title flex items-center gap-2.5">Escenas<span class="filter-count">{{ escenas.length }}</span></h2>
        </div>
        <UiDataTable :columns="columnasEscenas" :rows="escenas" :row-key="(r) => r.folder" :page-size="0" flat>
          <template #cell-numero="{ row }">
            <span class="ui-symbol ui-symbol-sm" :data-area="sb.tipo" aria-hidden="true">{{ row.numero }}</span>
          </template>
          <template #cell-title="{ row }">
            <span class="font-extrabold text-ink">{{ row.title }}</span>
          </template>
          <template #cell-template="{ row }">
            <span v-if="row.template" class="text-body font-semibold text-muted">{{ nombrePlantilla(row.template) }}</span>
            <span v-else-if="row.hasContent" class="text-body font-semibold text-muted">Propia</span>
            <UiBadge v-else tone="coral" title="La carpeta no tiene scene.json: el runner la salta">Sin contenido</UiBadge>
          </template>
          <template #cell-guia="{ row }">
            <div v-if="row.guia" class="flex flex-wrap gap-1.5">
              <UiBadge
                v-for="idioma in sb.languages"
                :key="idioma"
                :tone="row.guia.includes(idioma) ? 'lime' : 'neutral'"
                :title="`${nombreIdioma(idioma)}: ${row.guia.includes(idioma) ? 'escrita' : 'sin escribir'}`"
              >
                <UiIcon v-if="row.guia.includes(idioma)" name="check" class="size-3" />{{ idioma.toUpperCase() }}
              </UiBadge>
            </div>
            <span v-else class="ui-caption">—</span>
          </template>
          <template #cell-acciones="{ row }">
            <div class="flex items-center justify-end gap-1.5">
              <UiButton
                v-if="row.guia"
                tone="neutral"
                size="sm"
                icon="pencil"
                icon-only
                label="Escribir la guía de esta escena"
                title="Escribir la guía de esta escena"
                :to="`${rutaGuia}/${row.folder}`"
              />
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
            </div>
          </template>
        </UiDataTable>
      </section>

      <div class="space-y-6">
        <!-- ── Publicación: para leer; se cambia en su diálogo ─────────────── -->
        <section class="ui-panel">
          <div class="ui-panel-header">
            <h2 class="ui-title">Publicación</h2>
            <UiButton v-if="publicacion" variant="outline" size="sm" icon="pencil" @click="editando = true">Editar</UiButton>
          </div>
          <p v-if="!publicacion" class="ui-panel-body ui-text">Se decide después de registrarlo.</p>
          <dl v-else class="ui-panel-body flex flex-col gap-3">
            <div class="flex items-baseline justify-between gap-4">
              <dt class="shrink-0 text-caption font-bold text-muted">Estado</dt>
              <dd><UiBadge :tone="uiPublicationTone(publicacion.estado)" dot>{{ ESTADO_PUBLICACION[publicacion.estado].label }}</UiBadge></dd>
            </div>
            <!-- Los países, debajo de su etiqueta: son varios y no caben a la derecha -->
            <div>
              <dt class="text-caption font-bold text-muted">Países</dt>
              <dd v-if="paisesPublicados.length" class="mt-1.5 flex flex-wrap gap-1.5">
                <UiBadge v-for="p in paisesPublicados" :key="p.codigo" tone="neutral">{{ p.bandera }} {{ p.nombre }}</UiBadge>
              </dd>
              <dd v-else class="mt-1 text-body font-extrabold text-ink">Ninguno</dd>
            </div>
            <div class="flex items-baseline justify-between gap-4">
              <dt class="shrink-0 text-caption font-bold text-muted">Para quién</dt>
              <dd class="min-w-0 text-right text-body font-extrabold text-ink">{{ organizacion ? organizacion.nombre : 'Todas las organizaciones' }}</dd>
            </div>
            <div class="flex items-baseline justify-between gap-4">
              <dt class="shrink-0 text-caption font-bold text-muted">App del hogar</dt>
              <dd class="text-body font-extrabold text-ink">{{ publicacion.hogar ? 'Sí' : 'No' }}</dd>
            </div>
          </dl>
        </section>

        <!-- ── Guía: cuánto está escrito en cada idioma; la de cada escena, desde su fila ── -->
        <section class="ui-panel">
          <div class="ui-panel-header">
            <h2 class="ui-title">Guía</h2>
            <UiButton v-if="publicacion" variant="outline" size="sm" icon="pencil" :to="rutaGuia">Guía General</UiButton>
          </div>
          <p v-if="!publicacion" class="ui-panel-body ui-text">Se escribe después de registrarlo.</p>
          <div v-else class="ui-panel-body space-y-4">
            <div v-for="g in publicacion.guiaPorIdioma" :key="g.idioma">
              <div class="mb-1.5 flex items-center justify-between gap-3">
                <span class="text-body font-extrabold text-ink">{{ nombreIdioma(g.idioma) }}</span>
                <span class="ui-caption">{{ g.escritas }} de {{ g.total }} escenas</span>
              </div>
              <UiProgress :value="g.escritas" :max="g.total || 1" :tone="tonoGuia(g.escritas, g.total)" :label="`Guía en ${nombreIdioma(g.idioma)}`" />
            </div>
          </div>
        </section>

        <!-- ── Datos: lo que dice su storyboard.json, en palabras ──────────── -->
        <section class="ui-panel">
          <div class="ui-panel-header">
            <h2 class="ui-title">Datos</h2>
            <UiBadge v-if="estado" :tone="ESTADO_CATALOGO[estado.estado].tone" dot :title="ESTADO_CATALOGO[estado.estado].desc">{{ ESTADO_CATALOGO[estado.estado].label }}</UiBadge>
          </div>
          <dl class="ui-panel-body flex flex-col gap-3">
            <!-- Lo técnico (carpeta y clave), debajo de su etiqueta y en una línea -->
            <div v-for="d in datos" :key="d.label" :class="d.mono ? 'min-w-0' : 'flex items-baseline justify-between gap-4'">
              <dt class="shrink-0 text-caption font-bold text-muted">{{ d.label }}</dt>
              <dd :class="d.mono ? 'mt-1 truncate font-mono text-caption font-semibold text-ink' : 'min-w-0 text-right text-body font-extrabold text-ink'" :title="d.mono ? d.valor : undefined">{{ d.valor }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>

    <PublicacionDialog v-model:open="editando" :slug="id" />
  </div>

  <UiCard v-else>
    <UiEmptyState icon="search" title="Storyboard no encontrado" text="No existe en el build de Player.">
      <UiButton to="/storyboards" variant="outline">Volver a Storyboards</UiButton>
    </UiEmptyState>
  </UiCard>
</template>

<script setup lang="ts">
// Detalle de un storyboard del build (decisiones 006, 007 y 013): qué es, si la base dice lo mismo que el JSON
// (registrarlo o actualizarlo, con qué cambió), sus escenas con su guía, su publicación (estado, países, para quién y
// el hogar, que se cambian en PublicacionDialog) y sus datos.
import { uiPublicationTone } from '@playhub/ui/app/utils/ui-tones'
import { loadStoryboard, portadaDe, storyboardPorClave } from '~/runner/content'
import { ESTADO_CATALOGO, ESTADO_PUBLICACION, nombreEnfoque, nombreIdioma, nombrePlantilla, nombreSubcategoria, tonoGuia } from '~/utils/catalogoResumen'
import { construirMetadata } from '~/utils/storyboardMetadata'

const route = useRoute()
const { getStoryboard, tipoLabel, audienceLabel } = useStoryboards()
const clave = String(route.params.clave)
// La clave es la identidad del storyboard en la URL; la carpeta (eje y slug) solo localiza sus archivos.
const entrada = storyboardPorClave(clave)
const category = entrada?.folderCategory ?? ''
const id = entrada?.json.slug ?? ''

const sb = computed(() => {
  const row = getStoryboard(id)
  return row && row.tipo === category ? row : undefined
})
const loaded = loadStoryboard(category, id)
const portada = portadaDe(category, id)

const { estadoDe, publicacionDe, organizacionDe, sincronizar, paisDe, error: errorCatalogo, cargando, cargar } = useCatalogoBase()
const { toast } = useToast()

onMounted(cargar)

const estado = computed(() => estadoDe(id))
const publicacion = computed(() => publicacionDe(id))
const organizacion = computed(() => organizacionDe(publicacion.value?.organizacionId ?? null))
const rutaGuia = `/storyboards/${clave}/guia`
const editando = ref(false)
const verCambios = ref(false)

// «Alimentación · Infantil · 4–8 · 9 escenas · 30 min»
const resumen = computed(() => {
  if (!sb.value) return ''
  return [
    tipoLabel(sb.value.tipo),
    audienceLabel(sb.value.audience),
    `${sb.value.sceneCount} escenas`,
    sb.value.estimatedDuration ? `${sb.value.estimatedDuration} min` : '',
  ].filter(Boolean).join(' · ')
})

const paisesPublicados = computed(() => (publicacion.value?.paises ?? []).map(paisDe))

// Lo que dice su storyboard.json, en palabras y sin los códigos de la base. Al final, dónde está y su clave, que es
// su identidad en todas las URL.
const datos = computed(() => {
  if (!sb.value || !loaded) return []
  const meta = construirMetadata(loaded.json)
  return [
    { label: 'Subcategoría', valor: meta.subcategoria ? nombreSubcategoria(meta.subcategoria) : '' },
    { label: 'Enfoques de salud', valor: meta.enfoques_salud.map(nombreEnfoque).join(', ') },
    { label: 'Idiomas', valor: meta.idiomas.map(nombreIdioma).join(', ') },
    { label: 'Versión', valor: meta.version_build ?? '' },
    { label: 'Carpeta', valor: `${category}/${id}`, mono: true },
    { label: 'Clave', valor: meta.clave, mono: true },
  ].filter(d => d.valor)
})

const columnasEscenas = [
  { key: 'numero', label: '#', width: 'w-14' },
  { key: 'title', label: 'Escena', grow: true },
  { key: 'template', label: 'Plantilla' },
  { key: 'guia', label: 'Guía' },
  { key: 'acciones', label: '', width: 'w-24', align: 'right' as const },
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
  else toast.success(nuevo ? 'Registrado. Ya puedes publicarlo y escribir su guía.' : 'Actualizado: la base dice lo mismo que el JSON.')
}

function playUrl(escena?: string) {
  const base = `/play/${clave}?mode=educator`
  return escena ? `${base}&escena=${escena}` : base
}
</script>
