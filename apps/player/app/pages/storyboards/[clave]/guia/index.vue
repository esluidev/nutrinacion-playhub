<template>
  <!-- La cabecera de la guía del educador (`guias`): de qué va el taller, qué logra y para quién es, en cada
       idioma del storyboard. La guía de cada escena se escribe desde su fila, en el detalle (decisión 013). -->
  <div v-if="sb && guia?.cabecera" class="mx-auto max-w-3xl">
    <UiPageHeader :eyebrow="sb.title" title="Cabecera de la guía" description="Lo que el educador lee antes de las escenas.">
      <template #actions>
        <UiButton variant="outline" icon="chevron-left" :to="rutaDetalle">Volver al storyboard</UiButton>
      </template>
    </UiPageHeader>

    <UiCard>
      <!-- Una pestaña por idioma del storyboard (su JSON): no se inventan idiomas. -->
      <UiTabs v-if="guia.idiomas.length > 1" v-model="idioma" :items="pestanas" label="Idioma de la guía" fit class="mb-5" />

      <div class="space-y-5">
        <UiInput id="version-guia" v-model="version" label="Versión de la guía" placeholder="1.0" />
        <UiTextarea v-model="descripcion[idioma]" label="Descripción" hint="De qué trata el taller, en pocas líneas." :rows="3" />
        <UiTextarea v-model="objetivo[idioma]" label="Objetivo" hint="Qué se busca lograr con este storyboard." :rows="2" />
        <UiTextarea
          v-model="publico[idioma]"
          label="Público"
          hint="La edición, con las palabras de la organización (p. ej. «Niños de primaria»)."
          :rows="2"
        />
        <!-- Un personalizado dice para quién es y a qué está adaptado: hace falta para publicarlo. -->
        <UiTextarea
          v-if="guia.personalizado"
          v-model="adaptadoA[idioma]"
          label="Adaptado a"
          hint="Para quién es y a qué está adaptado (p. ej. «Adolescentes con diabetes tipo 1»). Hace falta para publicarlo."
          :rows="2"
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
      icon="book"
      title="Sin guía en la base"
      text="Regístralo o actualízalo en la base desde su detalle: así se crea su guía y se puede escribir."
    >
      <UiButton variant="outline" icon="chevron-left" :to="sb ? rutaDetalle : '/storyboards'">
        {{ sb ? 'Volver al storyboard' : 'Volver a Storyboards' }}
      </UiButton>
    </UiEmptyState>
  </UiCard>
</template>

<script setup lang="ts">
import { storyboardPorClave } from '~/runner/content'
import { textoPorIdioma } from '~/utils/catalogoResumen'

const route = useRoute()
const clave = String(route.params.clave)
// La clave es la identidad del storyboard en la URL; la carpeta (eje y slug) solo localiza sus archivos.
const entrada = storyboardPorClave(clave)
const category = entrada?.folderCategory ?? ''
const id = entrada?.json.slug ?? ''
const rutaDetalle = `/storyboards/${clave}`

const { getStoryboard } = useStoryboards()
const sb = computed(() => {
  const row = getStoryboard(id)
  return row && row.tipo === category ? row : undefined
})

const { guiaDe, guardarCabecera, cargar, cargado } = useCatalogoBase()
const { toast } = useToast()
onMounted(cargar)

const guia = computed(() => guiaDe(id))
const idioma = ref('es')
const pestanas = computed(() => (guia.value?.idiomas ?? []).map(l => ({ value: l, label: l.toUpperCase() })))

// El formulario, sembrado una vez con lo que hay en la base (la base puede llegar después de abrir la página).
const version = ref('')
const descripcion = reactive<Record<string, string>>({})
const objetivo = reactive<Record<string, string>>({})
const publico = reactive<Record<string, string>>({})
const adaptadoA = reactive<Record<string, string>>({})
let sembrado = false
watch(guia, (actual) => {
  if (!actual?.cabecera || sembrado) return
  sembrado = true
  const { cabecera, idiomas } = actual
  idioma.value = idiomas[0] ?? 'es'
  version.value = cabecera.version ?? ''
  for (const l of idiomas) {
    descripcion[l] = cabecera.descripcion?.[l] ?? ''
    objetivo[l] = cabecera.objetivo?.[l] ?? ''
    publico[l] = cabecera.publico?.[l] ?? ''
    adaptadoA[l] = cabecera.adaptado_a?.[l] ?? ''
  }
}, { immediate: true })

const guardando = ref(false)

async function guardar() {
  const actual = guia.value
  if (!actual?.cabecera) return
  guardando.value = true
  const error = await guardarCabecera(actual.cabecera.id, {
    version: version.value.trim() || null,
    descripcion: textoPorIdioma(descripcion, actual.idiomas),
    objetivo: textoPorIdioma(objetivo, actual.idiomas),
    publico: textoPorIdioma(publico, actual.idiomas),
    adaptado_a: actual.personalizado ? textoPorIdioma(adaptadoA, actual.idiomas) : null,
  })
  guardando.value = false
  if (error) {
    toast.error(error)
    return
  }
  toast.success('Cabecera de la guía guardada.')
  await navigateTo(rutaDetalle)
}
</script>
