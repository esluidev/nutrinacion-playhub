<template>
  <div>
    <!-- Buscar y tres filtros de barra; cada uno dice, al abrirse, qué filtra. Todo lo que se hace con un
         storyboard (registrar, actualizar, probar, publicar, escribir su guía) está en su detalle. -->
    <div class="mb-6 flex flex-wrap items-center gap-2.5">
      <UiSearchInput v-model="search" placeholder="Buscar por título o slug…" max-width="xs" />
      <UiSelect v-model="filtroCategoria" variant="toolbar" prefix="Categoría" :options="opcionesCategoria" />
      <UiSelect v-model="filtroEstado" variant="toolbar" prefix="Estado" :options="OPCIONES_FILTRO_ESTADO" />
      <UiSelect v-model="filtroHogar" variant="toolbar" prefix="Hogar" :options="OPCIONES_FILTRO_HOGAR" />
    </div>

    <UiAlert v-if="error" tone="danger" class="mb-6">
      <p>{{ error }}</p>
      <UiButton tone="neutral" size="sm" icon="retry" class="mt-3" :loading="cargando" @click="cargar">Volver a leer</UiButton>
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
            <p v-if="organizacionDe(row.publicacion?.organizacionId ?? null)" class="ui-caption truncate">
              Personalizado: {{ organizacionDe(row.publicacion?.organizacionId ?? null)?.nombre }}
            </p>
          </div>
        </div>
      </template>
      <template #cell-categoria="{ row }">
        <span class="badge" :data-area="row.tipo">{{ tipoLabel(row.tipo) }}</span>
      </template>
      <template #cell-edicion="{ row }">
        <span class="text-body font-semibold text-muted">{{ audienceLabel(row.audience) }}</span>
      </template>
      <template #cell-estado="{ row }">
        <EstadoStoryboard v-if="row.base" :base="row.base.estado" :publicacion="row.publicacion?.estado ?? null" />
        <span v-else-if="cargando" class="ui-caption">Leyendo…</span>
        <span v-else class="ui-caption">—</span>
      </template>
      <template #cell-paises="{ row }">
        <PaisesStoryboard v-if="row.publicacion" :paises="row.publicacion.paises" />
        <span v-else class="ui-caption">—</span>
      </template>
      <template #cell-hogar="{ row }">
        <span v-if="row.publicacion?.hogar" class="inline-flex items-center gap-1.5 text-body font-bold text-ink" title="Sale en la app del hogar">
          <UiIcon name="home" class="size-4 text-muted" />Sí
        </span>
        <span v-else class="ui-caption">—</span>
      </template>
      <template #cell-guia="{ row }">
        <div v-if="row.publicacion" class="flex flex-wrap gap-1.5">
          <UiBadge
            v-for="g in row.publicacion.guiaPorIdioma"
            :key="g.idioma"
            :tone="tonoGuia(g.escritas, g.total)"
            :title="`${nombreIdioma(g.idioma)}: ${g.escritas} de ${g.total} escenas con guía`"
          >
            {{ g.idioma.toUpperCase() }} {{ g.escritas }}/{{ g.total }}
          </UiBadge>
        </div>
        <span v-else class="ui-caption">—</span>
      </template>
    </UiDataTable>

    <!-- Lo que la base conoce y este build no: se registró desde otro build o su carpeta ya no está. No
         tiene detalle en Player, así que se archiva o se elimina aquí; para volver a publicarlo hace falta su JSON. -->
    <UiCard v-if="fueraDelBuild.length" :padding="false" class="mt-8">
      <template #header>
        <div class="min-w-0">
          <h2 class="ui-title">En la base, sin JSON en este build</h2>
          <p class="ui-caption mt-0.5">Se registraron desde otro build o su carpeta ya no está en content/storyboards. Aquí solo se pueden archivar o eliminar.</p>
        </div>
      </template>
      <UiDataTable :columns="columnasFuera" :rows="fueraDelBuild" :row-key="(r) => r.clave" :page-size="0" flat>
        <template #cell-storyboard="{ row }">
          <p class="truncate font-extrabold text-ink">{{ tr(row.titulo, 'es') || row.slug }}</p>
          <p class="truncate font-mono text-caption text-muted">{{ row.slug }} · {{ row.clave }}</p>
        </template>
        <template #cell-categoria="{ row }">
          <span class="badge" v-bind="uiAreaAttrs(uiAreaOf(row.categoria))">{{ etiquetaCategoria(row.categoria) }}</span>
        </template>
        <template #cell-estado="{ row }">
          <EstadoStoryboard base="al_dia" :publicacion="row.estado_publicacion" />
        </template>
        <template #cell-paises="{ row }">
          <PaisesStoryboard :paises="row.paises_disponibles" />
        </template>
        <template #cell-acciones="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <UiButton tone="neutral" size="sm" icon="package" :disabled="row.estado_publicacion === 'ARCHIVADO'" @click="archivando = row">
              {{ row.estado_publicacion === 'ARCHIVADO' ? 'Archivado' : 'Archivar' }}
            </UiButton>
            <UiButton tone="neutral" size="sm" icon="trash" icon-only label="Eliminar de la base" title="Eliminar de la base" @click="eliminando = row" />
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
      :open="!!eliminando"
      :title="`Eliminar «${eliminando ? tr(eliminando.titulo, 'es') || eliminando.slug : ''}»`"
      confirm-label="Eliminar"
      tone="coral"
      symbol="trash"
      :loading="eliminandoEnCurso"
      @update:open="(v) => { if (!v) eliminando = null }"
      @confirm="confirmarEliminar"
    >
      <p>Se quita de la base con su guía. No se puede deshacer.</p>
      <p class="mt-2">Si ya hay talleres que lo usan, la base lo impide: entonces, archívalo.</p>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
// El catálogo del build frente a la base, de un vistazo: por storyboard, su categoría, su edición, su
// estado (sin registrar, o su estado de publicación, con «Desactualizado» si su JSON cambió), sus
// países y su guía escrita por idioma. La fila abre el detalle, donde se hace todo lo demás (decisión
// 013). Debajo, lo que está en la base sin JSON en este build, para archivarlo o eliminarlo.
import { uiAreaAttrs, uiAreaOf } from '@playhub/ui/app/utils/ui-tones'
import type { EstadoBase, FilaBase, Publicacion } from '~/composables/useCatalogoBase'
import { TIPO_LABELS } from '~/composables/useStoryboards'
import { tipoDeType } from '~/runner/content'
import { tr } from '~/types/i18n'
import type { StoryboardBuild, TipoStoryboard } from '~/types/storyboard'
import { OPCIONES_FILTRO_ESTADO, OPCIONES_FILTRO_HOGAR, nombreIdioma, pasaFiltroEstado, pasaFiltroHogar, tonoGuia } from '~/utils/catalogoResumen'
import type { FiltroEstado, FiltroHogar } from '~/utils/catalogoResumen'

interface FilaLista extends StoryboardBuild {
  base: EstadoBase | null
  publicacion: Publicacion | null
}

const { storyboards, tipoLabel, audienceLabel } = useStoryboards()
const { estadoDe, publicacionDe, organizacionDe, fueraDelBuild, archivar, eliminar, cargar, cargando, error } = useCatalogoBase()
const { toast } = useToast()

onMounted(cargar)

const search = ref('')
const filtroCategoria = ref<string | number | null>('todas')
const filtroEstado = ref<string | number | null>('todos')
const filtroHogar = ref<string | number | null>('todos')

const TIPOS: TipoStoryboard[] = ['alimentacion', 'actividad-fisica', 'cuidado-personal', 'salud-emocional']
const opcionesCategoria = [{ value: 'todas', label: 'Todas' }, ...TIPOS.map(t => ({ value: t, label: TIPO_LABELS[t] }))]

const todas = computed<FilaLista[]>(() => storyboards.value.map(sb => ({ ...sb, base: estadoDe(sb.id), publicacion: publicacionDe(sb.id) })))

const filas = computed(() => {
  let lista = todas.value
  if (filtroCategoria.value !== 'todas') lista = lista.filter(f => f.tipo === filtroCategoria.value)
  const estado = filtroEstado.value as FiltroEstado
  lista = lista.filter(f => pasaFiltroEstado(estado, f.base?.estado ?? null, f.publicacion?.estado ?? null))
  lista = lista.filter(f => pasaFiltroHogar(filtroHogar.value as FiltroHogar, f.publicacion?.hogar ?? null))
  const q = search.value.trim().toLowerCase()
  if (q) lista = lista.filter(f => f.title.toLowerCase().includes(q) || f.id.includes(q))
  return lista
})

// La tabla reparte el ancho a partes iguales (table-fixed): cada columna mide lo que necesita lo que
// enseña (la etiqueta más larga del estado es «Desactualizado»). Con todas fijas, en una pantalla
// estrecha la tabla se desplaza de lado en vez de aplastar el título; en una ancha, el sobrante se reparte.
const columnas = [
  { key: 'storyboard', label: 'Storyboard', grow: true, width: 'w-64' },
  { key: 'categoria', label: 'Categoría', width: 'w-36' },
  { key: 'edicion', label: 'Edición', width: 'w-36' },
  { key: 'estado', label: 'Estado', width: 'w-44' },
  { key: 'paises', label: 'Países', width: 'w-36' },
  { key: 'hogar', label: 'Hogar', width: 'w-24' },
  { key: 'guia', label: 'Guía', width: 'w-24' },
]

const columnasFuera = [
  { key: 'storyboard', label: 'Storyboard', grow: true, width: 'w-64' },
  { key: 'categoria', label: 'Categoría', width: 'w-36' },
  { key: 'estado', label: 'Estado', width: 'w-44' },
  { key: 'paises', label: 'Países', width: 'w-36' },
  { key: 'acciones', label: '', align: 'right' as const, width: 'w-40' },
]

// El código de la base (ALIMENTACION) con la etiqueta del build (Alimentación).
const etiquetaCategoria = (codigo: string) => TIPO_LABELS[tipoDeType(codigo)] ?? codigo

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

// ── Eliminar lo que no tiene JSON en este build ──────────────────────────────
const eliminando = ref<FilaBase | null>(null)
const eliminandoEnCurso = ref(false)

async function confirmarEliminar() {
  if (!eliminando.value) return
  eliminandoEnCurso.value = true
  const e = await eliminar(eliminando.value.clave)
  eliminandoEnCurso.value = false
  if (e) {
    toast.error(e)
    return
  }
  toast.success(`«${tr(eliminando.value.titulo, 'es') || eliminando.value.slug}» se eliminó de la base.`)
  eliminando.value = null
}
</script>
