<template>
  <!-- La guía de una escena (`guia_escenas`): las doce secciones de la plantilla de la guía, en cada idioma del
       storyboard. Se escribe en tandas: se pasa a la escena anterior o a la siguiente sin volver al detalle. -->
  <div v-if="sb && guia && escena" class="mx-auto max-w-3xl">
    <UiPageHeader :eyebrow="sb.title" :title="`${escena.orden} · ${tr(escena.titulo, 'es') || escena.carpeta}`" :description="`scenes/${escena.carpeta}/`">
      <template #actions>
        <UiButton variant="outline" icon="chevron-left" :to="rutaDetalle">Volver al storyboard</UiButton>
        <UiButton variant="outline" icon="play" :to="`/play/${category}/${id}?mode=educator&escena=${escena.carpeta}`">Probar esta escena</UiButton>
      </template>
    </UiPageHeader>

    <UiCard>
      <div class="mb-1 flex items-center justify-between gap-3">
        <h2 class="ui-title">Guía de la escena</h2>
        <div class="ui-group">
          <NuxtLink
            v-if="anterior"
            :to="`${rutaGuia}/${anterior.carpeta}`"
            class="ui-group-item"
            :title="tr(anterior.titulo, 'es')"
            :aria-label="`Escena anterior: ${tr(anterior.titulo, 'es')}`"
          >
            <UiIcon name="chevron-left" />
          </NuxtLink>
          <span class="ui-group-label">{{ escena.orden }}/{{ guia.escenas.length }}</span>
          <NuxtLink
            v-if="siguiente"
            :to="`${rutaGuia}/${siguiente.carpeta}`"
            class="ui-group-item"
            :title="tr(siguiente.titulo, 'es')"
            :aria-label="`Escena siguiente: ${tr(siguiente.titulo, 'es')}`"
          >
            <UiIcon name="chevron-right" />
          </NuxtLink>
        </div>
      </div>
      <p class="ui-text mb-4">Lo que lee el educador al preparar y dar el taller. Cada sección se escribe por idioma.</p>

      <UiTabs v-if="guia.idiomas.length > 1" v-model="idioma" :items="pestanas" label="Idioma de la guía" fit class="mb-5" />

      <div class="space-y-5">
        <UiTextarea
          v-for="seccion in SECCIONES_GUIA"
          :key="seccion"
          v-model="secciones[seccion][idioma]"
          :label="ETIQUETAS_GUIA[seccion].label"
          :hint="ETIQUETAS_GUIA[seccion].hint"
        />
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="outline" :to="rutaDetalle">Cancelar</UiButton>
          <UiButton icon="check" :loading="guardando" @click="guardar">Guardar</UiButton>
        </div>
      </template>
    </UiCard>
  </div>

  <div v-else-if="!cargado" class="grid place-items-center py-16"><UiSpinner /></div>

  <UiCard v-else class="mx-auto max-w-3xl">
    <UiEmptyState
      icon="search"
      title="Esta escena no está en la base"
      text="La guía se escribe para las escenas registradas. Si es nueva en el JSON, actualiza el storyboard en la base desde su detalle."
    >
      <UiButton variant="outline" icon="chevron-left" :to="sb ? rutaDetalle : '/storyboards'">
        {{ sb ? 'Volver al storyboard' : 'Volver a Storyboards' }}
      </UiButton>
    </UiEmptyState>
  </UiCard>
</template>

<script setup lang="ts">
import { tr } from '~/types/i18n'
import { ETIQUETAS_GUIA, SECCIONES_GUIA, textoPorIdioma } from '~/utils/catalogoResumen'
import type { SeccionGuia } from '~/utils/catalogoResumen'
import type { Localized } from '~/types/i18n'

const route = useRoute()
const category = String(route.params.category)
const id = String(route.params.id)
const rutaDetalle = `/storyboards/${category}/${id}`
const rutaGuia = `${rutaDetalle}/guia`

const { getStoryboard } = useStoryboards()
const sb = computed(() => {
  const row = getStoryboard(id)
  return row && row.tipo === category ? row : undefined
})

const { guiaDe, guardarEscena, cargar, cargado } = useCatalogoBase()
const { toast } = useToast()
onMounted(cargar)

const guia = computed(() => guiaDe(id))
const escena = computed(() => guia.value?.escenas.find(e => e.carpeta === String(route.params.escena)) ?? null)
const indice = computed(() => (escena.value && guia.value ? guia.value.escenas.indexOf(escena.value) : -1))
const anterior = computed(() => (indice.value > 0 ? guia.value!.escenas[indice.value - 1] : null))
const siguiente = computed(() => (indice.value >= 0 && indice.value < guia.value!.escenas.length - 1 ? guia.value!.escenas[indice.value + 1] : null))

const idioma = ref('es')
const pestanas = computed(() => (guia.value?.idiomas ?? []).map(l => ({ value: l, label: l.toUpperCase() })))

// Las doce secciones, siempre como texto por idioma. Al pasar a otra escena la página no se desmonta: se
// vuelve a sembrar con la nueva (por su id). Releer la base después de guardar no la vuelve a sembrar.
const secciones = reactive(Object.fromEntries(SECCIONES_GUIA.map(s => [s, {}])) as Record<SeccionGuia, Record<string, string>>)
let sembrada: number | null = null
watch(escena, (actual) => {
  if (!actual || actual.id === sembrada || !guia.value) return
  sembrada = actual.id
  if (!guia.value.idiomas.includes(idioma.value)) idioma.value = guia.value.idiomas[0] ?? 'es'
  for (const s of SECCIONES_GUIA) {
    for (const l of guia.value.idiomas) secciones[s][l] = actual[s]?.[l] ?? ''
  }
}, { immediate: true })

const guardando = ref(false)

async function guardar() {
  const actual = escena.value
  const idiomas = guia.value?.idiomas
  if (!actual || !idiomas) return
  guardando.value = true
  const datos = Object.fromEntries(SECCIONES_GUIA.map(s => [s, textoPorIdioma(secciones[s], idiomas)])) as Record<SeccionGuia, Localized | null>
  const error = await guardarEscena(actual.id, datos)
  guardando.value = false
  if (error) toast.error(error)
  else toast.success('Guía de la escena guardada.')
}
</script>
