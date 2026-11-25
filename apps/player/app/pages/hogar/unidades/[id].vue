<template>
  <!-- Una unidad de estudio de la app del hogar (tarea 022): su título y su descripción por idioma, sus
       storyboards en orden (solo los del hogar; se agregan con búsqueda y se suben o bajan) y si está
       publicada. `nueva` la crea. La base solo admite storyboards publicados en el hogar. -->
  <div class="mx-auto max-w-[980px] space-y-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div class="min-w-0">
        <NuxtLink to="/hogar" class="ui-link text-caption" data-tone="sky">App del hogar</NuxtLink>
        <h1 class="ui-heading mt-1 truncate">{{ nueva ? 'Nueva unidad' : (textoLocal(guardada?.titulo) || 'Unidad de estudio') }}</h1>
      </div>
      <UiBadge v-if="!nueva" :tone="guardada?.publicada ? 'lime' : 'neutral'" dot>{{ guardada?.publicada ? 'Publicada' : 'Borrador' }}</UiBadge>
    </header>

    <UiEmptyState v-if="!nueva && cargado && !guardada" icon="search" title="No encontramos esa unidad">
      <UiButton to="/hogar" variant="outline">Volver a la App del hogar</UiButton>
    </UiEmptyState>

    <template v-else>
      <!-- Título y descripción, por idioma -->
      <UiCard>
        <UiTabs v-model="idioma" :items="pestanas" label="Idioma de la unidad" fit class="mb-5" />
        <div class="space-y-5">
          <UiInput :id="`titulo-${idioma}`" v-model="form.titulo[idioma]" label="Título" :placeholder="idioma === 'es' ? 'Ej: Ganando músculos' : 'E.g. Building muscle'" />
          <UiTextarea v-model="form.descripcion[idioma]" label="Descripción" optional :rows="3" :placeholder="idioma === 'es' ? 'Qué recorre y para quién' : 'What it covers and for whom'" />
        </div>
      </UiCard>

      <!-- Sus storyboards, en el orden en que la familia los recorre -->
      <UiCard :padding="false">
        <template #header>
          <div class="min-w-0">
            <h2 class="ui-title">Storyboards <span class="text-body font-bold text-subtle">· {{ form.storyboards.length }}</span></h2>
            <p class="ui-caption">En el orden en que se recorren. Solo los que salen en el hogar.</p>
          </div>
          <UiButton variant="outline" icon="plus" :disabled="!disponibles.length && !delHogar.length" @click="abrirAgregar">Agregar Storyboards</UiButton>
        </template>
        <p v-if="!form.storyboards.length" class="ui-text px-6 py-6">Todavía no tiene storyboards.</p>
        <ol v-else class="divide-y divide-line">
          <li v-for="(sid, i) in form.storyboards" :key="sid" class="flex items-center gap-3 px-6 py-3">
            <span class="w-6 shrink-0 text-center text-body font-black tabular-nums text-muted">{{ i + 1 }}</span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-body font-extrabold text-ink">{{ tituloDe(sid) }}</p>
              <p v-if="!delHogarIds.has(sid)" class="ui-caption text-(--tone-strong)" data-tone="coral">Ya no sale en el hogar: quítalo para guardar.</p>
              <p v-else class="ui-caption truncate">{{ detalleDe(sid) }}</p>
            </div>
            <UiButton tone="neutral" size="sm" icon="chevron-up" icon-only :label="`Subir ${tituloDe(sid)}`" :disabled="i === 0" @click="form.storyboards = mover(form.storyboards, i, -1)" />
            <UiButton tone="neutral" size="sm" icon="chevron-down" icon-only :label="`Bajar ${tituloDe(sid)}`" :disabled="i === form.storyboards.length - 1" @click="form.storyboards = mover(form.storyboards, i, 1)" />
            <UiButton tone="neutral" size="sm" icon="close" icon-only :label="`Quitar ${tituloDe(sid)}`" @click="form.storyboards = form.storyboards.filter(x => x !== sid)" />
          </li>
        </ol>
      </UiCard>

      <!-- Publicarla y guardar -->
      <UiCard>
        <UiSwitch v-model="form.publicada" label="Publicada" />
        <p class="field-help">Publicada, las familias la ven con los storyboards de su país. En borrador, solo aquí.</p>
        <UiAlert v-if="aviso && intento" tone="warning" class="mt-4">{{ aviso }}</UiAlert>
        <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
          <UiButton v-if="!nueva" variant="outline" icon="trash" @click="eliminando = true">Eliminar Unidad</UiButton>
          <span v-else />
          <UiButton icon="check" :loading="guardando" :disabled="!cambios" @click="guardarUnidad">{{ nueva ? 'Crear Unidad' : 'Guardar Unidad' }}</UiButton>
        </div>
      </UiCard>
    </template>

    <UiDialog :open="agregando" title="Agregar storyboards" size="lg" split @update:open="(v) => { if (!v) agregando = false }">
      <UiSearchInput v-model="busqueda" placeholder="Buscar por título o slug…" max-width="full" class="mt-1" />
      <p class="ui-caption mt-3">{{ elegidos.length === 1 ? '1 elegido' : `${elegidos.length} elegidos` }}</p>
      <div class="scrollbar-thin mt-2 flex max-h-80 flex-col divide-y divide-line overflow-y-auto rounded-control-sm border-2 border-line">
        <UiCheckbox
          v-for="f in filtrados"
          :key="f.id"
          :model-value="elegidos.includes(f.id)"
          class="w-full cursor-pointer px-3.5 py-2.5 transition-colors hover:bg-canvas"
          @update:model-value="alternar(f.id)"
        >
          <span class="min-w-0 flex-1">
            <span class="block truncate text-body font-extrabold text-ink">{{ textoLocal(f.titulo) || f.slug }}</span>
            <span class="block truncate text-caption font-semibold text-muted">{{ detalleFila(f) }}</span>
          </span>
        </UiCheckbox>
        <p v-if="!filtrados.length" class="ui-text p-6 text-center">
          {{ disponibles.length ? 'Ninguno coincide con la búsqueda.' : 'Ya tiene todos los storyboards del hogar.' }}
        </p>
      </div>
      <template #actions>
        <UiButton tone="neutral" @click="agregando = false">Cancelar</UiButton>
        <UiButton :disabled="!elegidos.length" @click="confirmarAgregar">
          {{ elegidos.length ? `Agregar ${elegidos.length}` : 'Agregar' }}
        </UiButton>
      </template>
    </UiDialog>

    <UiConfirmDialog
      :open="eliminando"
      :title="`Eliminar «${textoLocal(guardada?.titulo) || 'la unidad'}»`"
      confirm-label="Eliminar Unidad"
      :loading="guardando"
      @update:open="(v) => eliminando = v"
      @confirm="eliminarUnidad"
    >
      <p>Sus storyboards siguen en el hogar, sueltos o en otras unidades.</p>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import type { FilaBase } from '~/composables/useCatalogoBase'
import { TIPO_LABELS } from '~/composables/useStoryboards'
import type { TipoStoryboard } from '~/types/storyboard'
import { IDIOMAS_UNIDAD, agregar, faltaParaGuardar, formVacio, mover, textoLocal } from '~/utils/unidadesEstudio'
import type { FormUnidad, IdiomaUnidad } from '~/utils/unidadesEstudio'

// Al crear una, se pasa de `nueva` a su id: la página se vuelve a montar con la ruta.
definePageMeta({ key: r => r.fullPath })

const route = useRoute()
const nueva = route.params.id === 'nueva'
const id = nueva ? null : Number(route.params.id)

const { delHogar, filaPorId, cargar: cargarCatalogo } = useCatalogoBase()
const { unidad, cargar: cargarUnidades, guardar, eliminar } = useUnidadesEstudio()
const { audienceLabel } = useStoryboards()
const { toast } = useToast()

const cargado = ref(false)
onMounted(async () => {
  await Promise.all([cargarCatalogo(), cargarUnidades()])
  cargado.value = true
})

const guardada = computed(() => (id ? unidad(id) : undefined))
const form = reactive<FormUnidad>(formVacio())
// Lo guardado llena el formulario una vez, al llegar.
let relleno = false
watch(guardada, (u) => {
  if (!u || relleno) return
  relleno = true
  Object.assign(form, {
    titulo: { es: u.titulo.es ?? '', en: u.titulo.en ?? '' },
    descripcion: { es: u.descripcion?.es ?? '', en: u.descripcion?.en ?? '' },
    publicada: u.publicada,
    storyboards: [...u.storyboards],
  })
}, { immediate: true })

const NOMBRES_IDIOMA: Record<IdiomaUnidad, string> = { es: 'Español', en: 'Inglés' }
const pestanas = IDIOMAS_UNIDAD.map(i => ({ value: i, label: NOMBRES_IDIOMA[i] }))
const idioma = ref<IdiomaUnidad>('es')

const delHogarIds = computed(() => new Set(delHogar.value.map(f => f.id)))
const eje = (f: FilaBase) => f.categoria.toLowerCase().replace(/_/g, '-')
const detalleFila = (f: FilaBase) => [TIPO_LABELS[eje(f) as TipoStoryboard] ?? f.categoria, audienceLabel(f.edicion), f.paises_disponibles.join(', ')].join(' · ')
const tituloDe = (sid: number) => {
  const f = filaPorId(sid)
  return f ? textoLocal(f.titulo) || f.slug : `Storyboard ${sid}`
}
const detalleDe = (sid: number) => {
  const f = filaPorId(sid)
  return f ? detalleFila(f) : ''
}

// ── Agregar storyboards: los del hogar que todavía no lleva, con búsqueda ─────
const agregando = ref(false)
const busqueda = ref('')
const elegidos = ref<number[]>([])
const disponibles = computed(() => delHogar.value.filter(f => !form.storyboards.includes(f.id)))
const filtrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return q ? disponibles.value.filter(f => textoLocal(f.titulo).toLowerCase().includes(q) || f.slug.includes(q)) : disponibles.value
})
function abrirAgregar() {
  busqueda.value = ''
  elegidos.value = []
  agregando.value = true
}
function alternar(sid: number) {
  elegidos.value = elegidos.value.includes(sid) ? elegidos.value.filter(x => x !== sid) : [...elegidos.value, sid]
}
function confirmarAgregar() {
  form.storyboards = agregar(form.storyboards, elegidos.value)
  agregando.value = false
}

// ── Guardar y eliminar ────────────────────────────────────────────────────────
const aviso = computed(() => faltaParaGuardar(form, delHogarIds.value))
const intento = ref(false)
const cambios = computed(() => {
  if (nueva) return true
  const u = guardada.value
  if (!u) return false
  return JSON.stringify({ t: form.titulo, d: form.descripcion, p: form.publicada, s: form.storyboards }) !== JSON.stringify({
    t: { es: u.titulo.es ?? '', en: u.titulo.en ?? '' },
    d: { es: u.descripcion?.es ?? '', en: u.descripcion?.en ?? '' },
    p: u.publicada,
    s: u.storyboards,
  })
})

const guardando = ref(false)
async function guardarUnidad() {
  intento.value = true
  if (aviso.value) return
  guardando.value = true
  const r = await guardar(id, form)
  guardando.value = false
  if (r.error) {
    toast.error(r.error)
    return
  }
  toast.success(form.publicada ? 'Unidad publicada: las familias ya la ven.' : 'Unidad guardada como borrador.')
  if (nueva && r.id) {
    relleno = false
    await navigateTo(`/hogar/unidades/${r.id}`, { replace: true })
  }
}

const eliminando = ref(false)
async function eliminarUnidad() {
  if (!id) return
  guardando.value = true
  const error = await eliminar(id)
  guardando.value = false
  eliminando.value = false
  if (error) {
    toast.error(error)
    return
  }
  toast.success('Unidad eliminada.')
  await navigateTo('/hogar')
}

useHead({ title: computed(() => `${textoLocal(guardada.value?.titulo) || 'Unidad de estudio'} · App del hogar`) })
</script>
