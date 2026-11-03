<template>
  <!-- La ficha del taller, a la que lleva «Ver guía», con el patrón de detalle del kit, como el
       detalle de un taller en Admin: la cabecera de página (título con su estado, la fecha y, a la
       derecha, «Iniciar taller»), y debajo la guía en dos tercios y los datos en uno. Sin el tono del
       área en toda la página: el color queda para el estado y lo que significa algo. -->
  <div v-if="taller">
    <header class="ui-page-header">
      <!-- En el teléfono, la acción baja a su línea en vez de apretar la fecha -->
      <div class="min-w-0 flex-1 max-sm:basis-full">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="ui-heading min-w-0">{{ taller.titulo }}</h1>
          <EstadoBadge :estado="estado" class="shrink-0" />
        </div>
        <p class="ui-text mt-1.5 first-letter:uppercase">{{ fechaLarga(taller.fecha, locale) }} · {{ horario(taller) }}</p>
      </div>
      <div v-if="estado !== 'cancelado' && estado !== 'cerrado'" class="ui-page-header-actions">
        <UiButton :to="`/workshops/${taller.id}/jugar`" icon="play">{{ t('taller.abrir') }}</UiButton>
      </div>
    </header>

    <!-- Cancelado: en coral, con el motivo y sin «Iniciar taller». -->
    <UiAlert v-if="estado === 'cancelado'" tone="coral" icon="ban" :title="t('taller.cancelado')" class="mb-6">
      {{ taller.motivoCancelacion ?? t('taller.canceladoSinMotivo') }}
    </UiAlert>

    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <!-- La guía, escena por escena, como las escenas del storyboard en Admin: número, título y
           subtítulo, el verbo debajo; se abre con lo que el educador necesita para conducirla. Solo
           texto, como en el runner. -->
      <section class="ui-panel overflow-hidden lg:col-span-2">
        <div class="ui-panel-header">
          <div class="min-w-0">
            <h2 class="ui-title flex items-center gap-2.5">{{ t('guia.titulo') }}<span v-if="escenas.length" class="filter-count">{{ escenas.length }}</span></h2>
            <p class="ui-caption mt-0.5">{{ t('guia.texto') }}</p>
          </div>
        </div>
        <div v-if="cargandoGuia" class="grid place-items-center py-12"><UiSpinner /></div>
        <div v-else-if="errorGuia" class="ui-panel-body">
          <UiAlert tone="warning" :title="t('guia.error')">
            <UiButton class="mt-3" variant="outline" icon="retry" @click="cargarGuia">{{ t('talleres.reintentar') }}</UiButton>
          </UiAlert>
        </div>
        <p v-else-if="!escenas.length" class="ui-panel-body ui-text">{{ t('guia.vacia') }}</p>
        <div v-else class="divide-y divide-line">
          <div v-for="escena in escenas" :key="escena.carpeta">
            <button
              type="button"
              class="flex w-full items-start gap-3 px-6 py-4 text-left transition-colors hover:bg-canvas"
              :aria-expanded="abiertas.has(escena.carpeta)"
              @click="alternar(escena.carpeta)"
            >
              <span class="ui-symbol ui-symbol-sm" data-tone="neutral">{{ escena.numero }}</span>
              <div class="min-w-0 flex-1">
                <p class="text-body font-extrabold text-ink">
                  {{ escena.title ?? t('guia.escena', { n: escena.numero }) }}<span v-if="escena.subtitle" class="font-semibold text-muted">: {{ escena.subtitle }}</span>
                </p>
                <p v-if="escena.verb" class="eyebrow mt-1">{{ escena.verb }}</p>
              </div>
              <UiIcon name="chevron-down" :class="['mt-1 size-4 shrink-0 text-subtle transition-transform duration-200', abiertas.has(escena.carpeta) && 'rotate-180']" />
            </button>
            <div v-if="abiertas.has(escena.carpeta)" class="px-6 pb-5 sm:pl-16">
              <div class="flex flex-col gap-4 rounded-control border border-line bg-canvas px-5 py-4">
                <p v-if="!secciones(escena).length" class="ui-text">{{ t('guia.vacia') }}</p>
                <div v-for="seccion in secciones(escena)" :key="seccion.campo">
                  <p class="eyebrow mb-1">{{ t(`guia.${seccion.campo}`) }}</p>
                  <p class="ui-text whitespace-pre-line">{{ seccion.texto }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="space-y-6">
        <!-- Completado: lo que dejó en el feedback. -->
        <section v-if="estado === 'cerrado'" class="ui-panel">
          <div class="ui-panel-header"><h2 class="ui-title">{{ t('cierre.titulo') }}</h2></div>
          <dl class="ui-panel-body grid grid-cols-2 gap-x-4 gap-y-5">
            <div v-if="taller.cierre!.calificacion" class="col-span-2">
              <dt class="ui-caption">{{ t('cierre.calificacion') }}</dt>
              <dd class="mt-1 flex gap-1" data-tone="sun" :aria-label="t('cierre.estrellas', { n: taller.cierre!.calificacion })">
                <UiIcon v-for="n in 5" :key="n" :name="n <= taller.cierre!.calificacion ? 'star-solid' : 'star'" :class="['size-6', n <= taller.cierre!.calificacion ? 'text-(--tone-fill)' : 'text-disabled']" />
              </dd>
            </div>
            <div><dt class="ui-caption">{{ t('cierre.asistentes') }}</dt><dd class="ui-title">{{ taller.cierre!.asistentes }}</dd></div>
            <div><dt class="ui-caption">{{ t('cierre.participacion') }}</dt><dd class="ui-title">{{ t(`cierre.participacion.${taller.cierre!.participacion}`) }}</dd></div>
          </dl>
        </section>

        <!-- Los datos, en filas de etiqueta y valor como el panel de contenido en Admin, sin color:
             el único que lleva es el estado, en la cabecera. -->
        <section class="ui-panel">
          <div class="ui-panel-header"><h2 class="ui-title">{{ t('taller.datos') }}</h2></div>
          <dl class="ui-panel-body flex flex-col gap-3">
            <div v-for="dato in datos" :key="dato.label" class="flex items-baseline justify-between gap-4">
              <dt class="shrink-0 text-caption font-bold text-muted">{{ dato.label }}</dt>
              <dd class="min-w-0 text-right text-body font-extrabold text-ink">{{ dato.valor }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  </div>
  <div v-else-if="cargando" class="grid place-items-center py-16"><UiSpinner /></div>
  <UiCard v-else>
    <UiEmptyState icon="search" :title="t('taller.noEncontrado')">
      <UiButton to="/" icon="calendar">{{ t('nav.talleres') }}</UiButton>
    </UiEmptyState>
  </UiCard>
</template>

<script setup lang="ts">
import { fechaLarga, rangoDeDias } from '~/utils/fechas'
import { escenasDeLaGuia, escenasYDuracion, estadoDe, grupoYAsistentes, horario } from '~/utils/talleres'
import type { EscenaGuia, GuiaTaller } from '~/utils/talleres'

const { t, locale } = useT()
const route = useRoute()
const { taller: buscar, cargando, guia } = useTalleres()

const taller = computed(() => buscar(String(route.params.id)))
const estado = computed(() => (taller.value ? estadoDe(taller.value) : 'proximo'))
// «4 escenas · 30 min», sin la duración si el storyboard no la tiene.
const resumen = computed(() => (taller.value ? escenasYDuracion(taller.value, n => t('taller.escenas', { n }), n => t('taller.minutos', { n })) : ''))
// Las ediciones con texto propio («Infantil · 4–8»); otra se muestra tal cual.
const EDICIONES = ['KIDS', 'PREADOLESCENTES', 'ADOLESCENTES']
const edicion = (codigo: string) => (EDICIONES.includes(codigo) ? t(`edicion.${codigo}`) : codigo)

// Los datos del taller, sin la fecha ni la hora (están arriba); los que la organización no rellenó no se muestran.
const datos = computed(() => taller.value
  ? [
      { label: t('taller.storyboard'), valor: taller.value.storyboard.titulo },
      { label: t('taller.area'), valor: t(`area.${taller.value.storyboard.eje}`) },
      { label: t('taller.contenido'), valor: resumen.value },
      { label: t('taller.grupo'), valor: grupoYAsistentes(taller.value, n => t('taller.asistentes', { n })) },
      { label: t('taller.lugar'), valor: taller.value.lugar },
      { label: t('taller.jornada'), valor: taller.value.jornada ? `${t('taller.jornadaNombre', { nombre: taller.value.jornada.nombre })} · ${rangoDeDias(taller.value.jornada.fechaInicio, taller.value.jornada.fechaFin, locale.value)}` : '' },
      { label: t('taller.organizacion'), valor: taller.value.organizacion.nombre },
      { label: t('taller.modalidad'), valor: t(`modalidad.${taller.value.modalidad}`) },
      { label: t('taller.idioma'), valor: t(`idioma.${taller.value.idioma}`) },
      { label: t('taller.edicion'), valor: edicion(taller.value.storyboard.edicion) },
    ].filter(dato => dato.valor)
  : [])

// La guía se pide al abrir la ficha (y queda guardada para el runner).
const guiaDelTaller = ref<GuiaTaller | null>(null)
const cargandoGuia = ref(false)
const errorGuia = ref(false)
const escenas = computed(() => (guiaDelTaller.value ? escenasDeLaGuia(guiaDelTaller.value) : []))

async function cargarGuia() {
  if (!taller.value) return
  cargandoGuia.value = true
  errorGuia.value = false
  guiaDelTaller.value = await guia(taller.value)
  errorGuia.value = guiaDelTaller.value === null
  cargandoGuia.value = false
}
watch(() => taller.value?.id, (id) => {
  if (id && !guiaDelTaller.value) void cargarGuia()
}, { immediate: true })

// Las secciones con texto, en el orden en que se conduce la escena. «No requiere» no se muestra, como en el runner.
const CAMPOS = ['objective', 'description', 'pedagogy', 'questions', 'psychology', 'tips', 'notDoing', 'mechanic', 'material', 'science'] as const
function secciones(escena: EscenaGuia) {
  return CAMPOS
    .map(campo => ({ campo, texto: escena[campo]?.trim() ?? '' }))
    .filter(s => s.texto && !/^no requiere/i.test(s.texto))
}

// Las escenas abiertas; la primera, de entrada.
const abiertas = reactive(new Set<string>())
watch(escenas, (lista) => {
  if (!abiertas.size && lista[0]) abiertas.add(lista[0].carpeta)
}, { immediate: true })
function alternar(carpeta: string) {
  if (abiertas.has(carpeta)) abiertas.delete(carpeta)
  else abiertas.add(carpeta)
}

useHead({ title: computed(() => taller.value?.titulo ?? '') })
</script>
