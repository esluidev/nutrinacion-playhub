<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center gap-2.5">
      <UiSearchInput v-model="search" placeholder="Buscar por título o slug…" max-width="xs" />
      <UiSelect v-model="filtroTipo" variant="toolbar" prefix="Eje" :options="opcionesTipo" />
      <UiChips v-model="filtroBase" :items="chipsBase" />
      <div class="ml-auto flex flex-wrap items-center gap-2.5">
        <UiButton variant="outline" icon="retry" :loading="cargando" @click="cargar">Releer la base</UiButton>
        <!-- La acción principal de la lista: poner al día todo lo que falta, de una vez. -->
        <UiButton v-if="pendientes.length" icon="send" @click="confirmandoTodos = true">
          {{ pendientes.length === 1 ? 'Registrar el pendiente' : `Registrar ${pendientes.length} pendientes` }}
        </UiButton>
      </div>
    </div>

    <UiAlert v-if="error" tone="danger" class="mb-6">
      {{ error }}
    </UiAlert>

    <UiCard v-if="!storyboards.length">
      <UiEmptyState icon="book" title="Todavía no hay storyboards" text="Agrega uno en content/storyboards/<eje>/<slug>/storyboard.json y vuelve a compilar." />
    </UiCard>

    <UiDataTable
      v-else
      :columns="columnas"
      :rows="filas"
      :row-key="(r) => r.id"
      :page-size="0"
      empty-text="Ningún storyboard coincide con la búsqueda o los filtros."
      clickable
      @row-click="(r) => navigateTo(`/storyboards/${r.tipo}/${r.id}`)"
    >
      <template #cell-storyboard="{ row }">
        <div class="flex items-center gap-3">
          <!-- La portada lleva el tono del área, como en Admin. -->
          <span class="ui-symbol ui-symbol-md text-body font-black text-(--tone-strong)" :data-area="row.tipo" aria-hidden="true">
            {{ row.title.charAt(0).toUpperCase() }}
          </span>
          <div class="min-w-0">
            <p class="truncate font-extrabold text-ink">{{ row.title }}</p>
            <p class="truncate font-mono text-caption text-muted">{{ row.tipo }}/{{ row.id }}</p>
          </div>
        </div>
      </template>
      <template #cell-eje="{ row }">
        <span class="badge" :data-area="row.tipo">{{ tipoLabel(row.tipo) }}</span>
      </template>
      <template #cell-edicion="{ row }">
        <span class="text-body font-semibold text-muted">{{ audienceLabel(row.audience) }}</span>
      </template>
      <template #cell-contenido="{ row }">
        <span class="text-body font-semibold text-muted">
          {{ row.sceneCount }} {{ row.sceneCount === 1 ? 'escena' : 'escenas' }}
          <span class="text-subtle"> · </span><span class="uppercase">{{ row.languages.join(' · ') }}</span>
          <template v-if="row.estimatedDuration"><span class="text-subtle"> · </span>{{ row.estimatedDuration }} min</template>
        </span>
      </template>
      <template #cell-base="{ row }">
        <UiBadge v-if="row.base" :tone="etiquetaBase(row.base.estado).tone" dot :title="etiquetaBase(row.base.estado).desc">
          {{ etiquetaBase(row.base.estado).label }}
        </UiBadge>
        <span v-else-if="cargando" class="ui-caption">Leyendo…</span>
        <span v-else class="ui-caption">—</span>
      </template>
      <template #cell-publicacion="{ row }">
        <div v-if="row.publicacion" class="flex flex-wrap items-center gap-1.5">
          <UiBadge :tone="uiPublicationTone(row.publicacion.estado)" dot :title="etiquetaPublicacion(row.publicacion.estado).desc">
            {{ etiquetaPublicacion(row.publicacion.estado).label }}
          </UiBadge>
          <UiBadge v-if="organizacionDe(row.publicacion.organizacionId)" :tone="uiToneFor(organizacionDe(row.publicacion.organizacionId)!.nombre)">
            {{ organizacionDe(row.publicacion.organizacionId)!.nombre }}
          </UiBadge>
          <span v-if="row.publicacion.paises.length" class="text-body" :title="nombresPaises(row.publicacion.paises)">
            <span v-for="codigo in row.publicacion.paises" :key="codigo" class="mr-1">{{ paisDe(codigo).bandera ?? codigo }}</span>
          </span>
          <span v-else class="ui-caption">sin países</span>
        </div>
        <span v-else class="ui-caption">—</span>
      </template>
      <template #cell-guia="{ row }">
        <div v-if="row.publicacion" class="flex flex-wrap gap-1.5">
          <UiBadge
            v-for="g in row.publicacion.guiaPorIdioma"
            :key="g.idioma"
            :tone="tonoGuia(g.escritas, g.total)"
            :title="`${nombreIdioma(g.idioma)}: ${g.escritas} de ${g.total} escenas con guía (se escribe en Admin)`"
          >
            {{ g.idioma.toUpperCase() }} {{ g.escritas }}/{{ g.total }}
          </UiBadge>
        </div>
        <span v-else class="ui-caption">—</span>
      </template>
      <template #cell-acciones="{ row }">
        <div class="flex items-center justify-end gap-1.5">
          <UiButton
            v-if="row.base && row.base.estado !== 'al_dia'"
            tone="neutral"
            size="sm"
            icon="send"
            :loading="sincronizando === row.id"
            :disabled="!!row.base.errores.length"
            :title="row.base.errores.length ? `El JSON tiene errores: ${row.base.errores.join('; ')}` : undefined"
            @click.stop="registrar(row)"
          >
            {{ row.base.estado === 'sin_registrar' ? 'Registrar' : 'Actualizar' }}
          </UiButton>
          <UiButton tone="neutral" size="sm" icon="play" icon-only label="Probar en el runner" title="Probar en el runner" :to="playUrl(row)" @click.stop />
        </div>
      </template>
    </UiDataTable>

    <!-- Lo que la base conoce y este build no: se registró desde otro build o su carpeta ya no está.
         Aquí solo se archiva; para volver a publicarlo hace falta su JSON. -->
    <UiCard v-if="fueraDelBuild.length" :padding="false" class="mt-8">
      <template #header>
        <div class="min-w-0">
          <h2 class="ui-title">En la base, sin JSON en este build</h2>
          <p class="ui-caption mt-0.5">Se registraron desde otro build o su carpeta ya no está en content/storyboards. Aquí solo se pueden archivar.</p>
        </div>
      </template>
      <UiDataTable :columns="columnasFuera" :rows="fueraDelBuild" :row-key="(r) => r.clave" :page-size="0" flat>
        <template #cell-storyboard="{ row }">
          <p class="truncate font-extrabold text-ink">{{ tr(row.titulo, 'es') || row.slug }}</p>
          <p class="truncate font-mono text-caption text-muted">{{ row.slug }} · {{ row.clave }}</p>
        </template>
        <template #cell-eje="{ row }">
          <span class="badge" v-bind="uiAreaAttrs(uiAreaOf(row.categoria))">{{ etiquetaCategoria(row.categoria) }}</span>
        </template>
        <template #cell-contenido="{ row }">
          <span class="text-body font-semibold text-muted">
            {{ row.numero_escenas }} {{ row.numero_escenas === 1 ? 'escena' : 'escenas' }}
            <span class="text-subtle"> · </span><span class="uppercase">{{ row.idiomas.join(' · ') }}</span>
          </span>
        </template>
        <template #cell-publicacion="{ row }">
          <div class="flex flex-wrap items-center gap-1.5">
            <UiBadge :tone="uiPublicationTone(row.estado_publicacion)" dot>{{ etiquetaPublicacion(row.estado_publicacion).label }}</UiBadge>
            <span v-for="codigo in row.paises_disponibles" :key="codigo" :title="paisDe(codigo).nombre">{{ paisDe(codigo).bandera ?? codigo }}</span>
          </div>
        </template>
        <template #cell-acciones="{ row }">
          <div class="flex items-center justify-end">
            <UiButton tone="neutral" size="sm" icon="package" :disabled="row.estado_publicacion === 'ARCHIVADO'" @click="archivando = row">
              {{ row.estado_publicacion === 'ARCHIVADO' ? 'Archivado' : 'Archivar' }}
            </UiButton>
          </div>
        </template>
      </UiDataTable>
    </UiCard>

    <UiConfirmDialog
      :open="!!archivando"
      :title="`Archivar «${archivando ? tr(archivando.titulo, 'es') || archivando.slug : ''}»`"
      confirm-label="Archivar"
      symbol="package"
      :loading="archivandoEnCurso"
      @update:open="(v) => { if (!v) archivando = null }"
      @confirm="confirmarArchivar"
    >
      <p>No se programa más; lo ya programado se conserva. Sus países y su organización se mantienen.</p>
      <p class="mt-2">Como su JSON no está en este build, para volver a publicarlo habrá que recuperar la carpeta y registrarlo otra vez.</p>
    </UiConfirmDialog>

    <UiConfirmDialog
      :open="confirmandoTodos"
      title="Registrar lo pendiente en la base"
      confirm-label="Registrar"
      tone="lime"
      symbol="send"
      :loading="sincronizando === '*'"
      @update:open="(v) => { confirmandoTodos = v }"
      @confirm="registrarTodos"
    >
      <p>Se escribe en la base lo que dice el JSON de cada uno. La publicación y la guía no se tocan.</p>
      <ul class="mt-3 space-y-1">
        <li v-for="p in pendientes" :key="p.id" class="flex items-center justify-between gap-3 text-body">
          <span class="font-extrabold text-ink">{{ p.title }}</span>
          <span class="ui-caption">{{ p.base!.estado === 'sin_registrar' ? 'Registrar' : `Actualizar: ${p.base!.cambios.join(', ')}` }}</span>
        </li>
      </ul>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
// Catálogo del build frente a la base, de un vistazo: por storyboard, su estado en la base (sin
// registrar, desactualizado, al día), su publicación (estado, organización, países), su guía
// escrita por idioma y la acción de registrar o actualizar ahí mismo. Debajo, lo que está en la
// base sin JSON en este build, solo para archivarlo. La guía se escribe en Admin.
import { uiAreaAttrs, uiAreaOf, uiPublicationTone, uiToneFor } from '@playhub/ui/app/utils/ui-tones'
import type { EstadoBase, FilaBase, Publicacion } from '~/composables/useCatalogoBase'
import { TIPO_LABELS } from '~/composables/useStoryboards'
import { tipoDeType } from '~/runner/content'
import { tr } from '~/types/i18n'
import type { StoryboardBuild, TipoStoryboard } from '~/types/storyboard'
import { ESTADO_CATALOGO, ESTADO_PUBLICACION, nombreIdioma, tonoGuia } from '~/utils/catalogoResumen'
import type { EstadoPublicacion } from '~/utils/catalogoResumen'
import type { EstadoCatalogo } from '~/utils/storyboardMetadata'

interface FilaLista extends StoryboardBuild {
  base: EstadoBase | null
  publicacion: Publicacion | null
}

const { storyboards, tipoLabel, audienceLabel } = useStoryboards()
const { estadoDe, publicacionDe, paisDe, organizacionDe, fueraDelBuild, sincronizar, archivar, cargar, cargando, error } = useCatalogoBase()
const { toast } = useToast()

onMounted(cargar)

const search = ref('')
const filtroTipo = ref<string | number | null>('todos')
const filtroBase = ref<'todos' | EstadoCatalogo>('todos')

const opcionesTipo = computed(() => {
  const tipos: TipoStoryboard[] = ['alimentacion', 'actividad-fisica', 'cuidado-personal', 'salud-emocional']
  return [{ value: 'todos', label: 'Todos' }, ...tipos.map(t => ({ value: t, label: tipoLabel(t) }))]
})

const todas = computed<FilaLista[]>(() => storyboards.value.map(sb => ({ ...sb, base: estadoDe(sb.id), publicacion: publicacionDe(sb.id) })))

const chipsBase = computed(() => {
  const cuenta = (estado: EstadoCatalogo) => todas.value.filter(f => f.base?.estado === estado).length
  return [
    { value: 'todos', label: 'Todos', count: todas.value.length },
    ...(Object.keys(ESTADO_CATALOGO) as EstadoCatalogo[]).map(estado => ({ value: estado, label: ESTADO_CATALOGO[estado].label, count: cuenta(estado) })),
  ]
})

const filas = computed(() => {
  let lista = todas.value
  if (filtroTipo.value !== 'todos') lista = lista.filter(f => f.tipo === filtroTipo.value)
  if (filtroBase.value !== 'todos') lista = lista.filter(f => f.base?.estado === filtroBase.value)
  const q = search.value.trim().toLowerCase()
  if (q) lista = lista.filter(f => f.title.toLowerCase().includes(q) || f.id.includes(q))
  return lista
})

const columnas = [
  { key: 'storyboard', label: 'Storyboard', grow: true },
  { key: 'eje', label: 'Eje' },
  { key: 'edicion', label: 'Edición' },
  { key: 'contenido', label: 'Contenido' },
  { key: 'base', label: 'En la base' },
  { key: 'publicacion', label: 'Publicación' },
  { key: 'guia', label: 'Guía' },
  { key: 'acciones', label: '', align: 'right' as const },
]

const columnasFuera = [
  { key: 'storyboard', label: 'Storyboard', grow: true },
  { key: 'eje', label: 'Eje' },
  { key: 'contenido', label: 'Contenido' },
  { key: 'publicacion', label: 'Publicación' },
  { key: 'acciones', label: '', align: 'right' as const },
]

const playUrl = (sb: StoryboardBuild) => `/play/${sb.tipo}/${sb.id}?mode=educator`

// Las filas de UiDataTable llegan sin tipo a los slots: estas funciones ponen el tipo al indexar.
const etiquetaBase = (estado: EstadoCatalogo) => ESTADO_CATALOGO[estado]
const etiquetaPublicacion = (estado: EstadoPublicacion) => ESTADO_PUBLICACION[estado]
const nombresPaises = (codigos: string[]) => codigos.map(c => paisDe(c).nombre).join(', ')

// El código de la base (ALIMENTACION) con la etiqueta del build (Alimentación).
const etiquetaCategoria = (codigo: string) => TIPO_LABELS[tipoDeType(codigo)] ?? codigo

// ── Registrar o actualizar ────────────────────────────────────────────────────
const sincronizando = ref<string | null>(null)
const confirmandoTodos = ref(false)
const pendientes = computed(() => todas.value.filter(f => f.base && f.base.estado !== 'al_dia' && !f.base.errores.length))

async function registrar(fila: FilaLista) {
  const nuevo = fila.base?.estado === 'sin_registrar'
  sincronizando.value = fila.id
  const e = await sincronizar(fila.id)
  sincronizando.value = null
  if (e) toast.error(e)
  else toast.success(nuevo ? `«${fila.title}» quedó registrado en la base.` : `«${fila.title}» quedó al día en la base.`)
}

async function registrarTodos() {
  sincronizando.value = '*'
  const fallos: string[] = []
  for (const fila of pendientes.value) {
    const e = await sincronizar(fila.id)
    if (e) fallos.push(`${fila.title}: ${e}`)
  }
  sincronizando.value = null
  confirmandoTodos.value = false
  if (fallos.length) toast.error(fallos.join(' · '))
  else toast.success('Todo el build quedó al día en la base.')
}

// ── Archivar lo que no tiene JSON en este build ──────────────────────────────
const archivando = ref<FilaBase | null>(null)
const archivandoEnCurso = ref(false)

async function confirmarArchivar() {
  if (!archivando.value) return
  archivandoEnCurso.value = true
  const e = await archivar(archivando.value.clave)
  archivandoEnCurso.value = false
  if (e) {
    toast.error(e)
    return
  }
  toast.success(`«${tr(archivando.value.titulo, 'es') || archivando.value.slug}» quedó archivado.`)
  archivando.value = null
}
</script>
