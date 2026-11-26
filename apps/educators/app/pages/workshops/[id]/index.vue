<template>
  <!-- La ficha del taller: se llega tocando el taller en cualquier vista de «Mis talleres». Es donde se prepara y se da.
       Arriba, solo el título con su estado y cuándo, y a la derecha (debajo en el teléfono) los botones de su momento
       (Ensayar antes de su día, Ejecutar y Ensayar el día del taller, Reportar después), con aire. Debajo, en su card,
       dónde, con quién, la jornada y cuánto dura, cada dato con su icono y su nombre. Si ya se reportó, lo que anotó, con
       «Editar». Y la guía, como un lector: en pantallas anchas, las escenas a la izquierda y la elegida a la derecha, con
       «Anterior» y «Siguiente»; en el teléfono y la tableta vertical, cada escena se abre debajo de sí misma. Sin el
       tono del área en toda la página: el color queda para el estado y la hora. -->
  <div v-if="taller" class="flex flex-col gap-6">
    <header class="ui-page-header mb-0">
      <div class="min-w-0 flex-1 max-sm:basis-full">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="ui-heading min-w-0">{{ taller.titulo }}</h1>
          <EstadoBadge :estado="estado" class="shrink-0" />
        </div>
        <p :data-tone="UI_SESSION_TONES[estado]" class="mt-1.5 text-body font-extrabold text-(--tone-strong)">
          <span class="inline-block first-letter:uppercase">{{ fechaLarga(taller.fecha, locale) }}</span> · <span class="tabular-nums">{{ horario(taller) }}</span>
        </p>
      </div>
      <div v-if="accionesDe(taller).length" class="ui-page-header-actions max-sm:grid max-sm:w-full max-sm:auto-cols-fr max-sm:grid-flow-col">
        <TallerBotones :taller="taller" principal />
      </div>
    </header>

    <!-- Dónde, con quién, la jornada y cuánto dura: cada dato con su icono y su nombre, en columnas que bajan según hay
         sitio (cuatro, dos, una) -->
    <section class="ui-panel">
      <dl class="ui-panel-body grid gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
        <div v-for="dato in datos" :key="dato.icono" class="flex min-w-0 items-start gap-3">
          <span class="ui-symbol ui-symbol-md" data-tone="neutral"><UiIcon :name="dato.icono" /></span>
          <div class="min-w-0">
            <dt class="ui-caption">{{ dato.label }}</dt>
            <dd class="text-body font-extrabold text-ink">{{ dato.texto }}</dd>
          </div>
        </div>
      </dl>
    </section>

    <!-- Cancelado: en coral, con el motivo y sin botones. -->
    <UiAlert v-if="estado === 'cancelado'" tone="coral" icon="ban" :title="t('taller.cancelado')">
      {{ taller.motivoCancelacion ?? t('taller.canceladoSinMotivo') }}
    </UiAlert>

    <!-- Reportado: lo que anotó, con «Editar» para corregirlo. -->
    <section v-if="taller.cierre" class="ui-panel">
      <div class="ui-panel-header">
        <h2 class="ui-title">{{ t('cierre.reporte') }}</h2>
        <UiButton :to="`/workshops/${taller.id}/report`" variant="outline" size="sm" icon="pencil">{{ t('cierre.editar') }}</UiButton>
      </div>
      <dl class="ui-panel-body grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-5">
        <div class="col-span-2 md:col-span-1">
          <dt class="ui-caption">{{ t('cierre.calificacion') }}</dt>
          <dd class="mt-1 flex gap-1" data-tone="sun" :aria-label="t('cierre.estrellas', { n: taller.cierre.calificacion })">
            <UiIcon v-for="n in 5" :key="n" :name="n <= taller.cierre.calificacion ? 'star-solid' : 'star'" :class="['size-6', n <= taller.cierre.calificacion ? 'text-(--tone-fill)' : 'text-disabled']" />
          </dd>
        </div>
        <div>
          <dt class="ui-caption">{{ t('cierre.asistentes') }}</dt>
          <dd class="ui-title">{{ taller.cierre.asistentes }}</dd>
          <dd v-if="taller.cierre.ninas !== null" class="ui-caption mt-0.5">{{ t('cierre.desglose', { ninas: taller.cierre.ninas, ninos: taller.cierre.ninos ?? 0 }) }}</dd>
        </div>
        <div><dt class="ui-caption">{{ t('cierre.participacion') }}</dt><dd class="ui-title">{{ t(`cierre.participacion.${taller.cierre.participacion}`) }}</dd></div>
        <div><dt class="ui-caption">{{ t('cierre.claridadCorta') }}</dt><dd class="ui-title">{{ t(`cierre.claridad.${taller.cierre.claridad}`) }}</dd></div>
        <div v-if="taller.cierre.dispositivos !== null"><dt class="ui-caption">{{ t('cierre.dispositivos') }}</dt><dd class="ui-title">{{ taller.cierre.dispositivos }}</dd></div>
      </dl>
    </section>

    <section class="ui-panel overflow-hidden">
      <div class="ui-panel-header">
        <h2 class="ui-title flex items-center gap-2.5">{{ t('guia.titulo') }}<span v-if="escenas.length" class="filter-count">{{ escenas.length }}</span></h2>
      </div>
      <div v-if="cargandoGuia" class="grid place-items-center py-12"><UiSpinner /></div>
      <div v-else-if="errorGuia" class="ui-panel-body">
        <UiAlert tone="warning" :title="t('guia.error')">
          <UiButton class="mt-3" variant="outline" icon="retry" @click="cargarGuia">{{ t('talleres.reintentar') }}</UiButton>
        </UiAlert>
      </div>
      <p v-else-if="!escenas.length" class="ui-panel-body ui-text">{{ t('guia.vacia') }}</p>
      <div v-else class="lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <!-- Las escenas, en su orden: número, título y subtítulo, y el verbo -->
        <ol class="divide-y divide-line lg:border-r lg:border-line">
          <li v-for="escena in escenas" :key="escena.carpeta">
            <button
              type="button"
              :data-tone="escena.carpeta === enVista?.carpeta ? 'sky' : 'neutral'"
              :class="['flex w-full items-start gap-3 px-6 py-4 text-left transition-colors hover:bg-canvas', escena.carpeta === enVista?.carpeta && 'lg:bg-(--tone-wash) lg:hover:bg-(--tone-wash)']"
              :aria-expanded="abierta === escena.carpeta"
              @click="elegir(escena.carpeta)"
            >
              <span class="ui-symbol ui-symbol-sm">{{ escena.numero }}</span>
              <div class="min-w-0 flex-1">
                <p class="text-body font-extrabold text-ink">{{ escena.title ?? t('guia.escena', { n: escena.numero }) }}</p>
                <p v-if="escena.subtitle" class="ui-caption">{{ escena.subtitle }}</p>
                <p v-if="escena.verb" class="eyebrow mt-1">{{ escena.verb }}</p>
              </div>
              <UiIcon name="chevron-down" :class="['mt-1 size-4 shrink-0 text-subtle transition-transform duration-200 lg:hidden', abierta === escena.carpeta && 'rotate-180']" />
            </button>
            <!-- En el teléfono y la tableta vertical, la escena se abre debajo de sí misma -->
            <div v-if="abierta === escena.carpeta" class="px-6 pb-5 lg:hidden">
              <div class="rounded-control border border-line bg-canvas px-5 py-4"><GuiaEscena :escena="escena" /></div>
            </div>
          </li>
        </ol>
        <!-- En pantallas anchas, la escena elegida a la derecha, para leerla de corrido -->
        <div v-if="enVista" class="hidden min-w-0 flex-col lg:flex">
          <div class="flex-1 px-8 py-6">
            <p class="eyebrow">{{ t('guia.escenaDe', { n: enVista.numero, total: escenas.length }) }}</p>
            <h3 class="ui-title mt-1">{{ enVista.title ?? t('guia.escena', { n: enVista.numero }) }}</h3>
            <p v-if="enVista.subtitle" class="ui-text mt-0.5">{{ enVista.subtitle }}</p>
            <div class="mt-6 max-w-prose"><GuiaEscena :escena="enVista" /></div>
          </div>
          <div class="ui-panel-footer flex justify-between gap-3">
            <UiButton variant="outline" icon="chevron-left" :disabled="enVista.numero === 1" @click="mover(-1)">{{ t('guia.anterior') }}</UiButton>
            <UiButton variant="outline" icon-right="chevron-right" :disabled="enVista.numero === escenas.length" @click="mover(1)">{{ t('guia.siguiente') }}</UiButton>
          </div>
        </div>
      </div>
    </section>
  </div>
  <div v-else-if="cargando" class="grid place-items-center py-16"><UiSpinner /></div>
  <UiCard v-else>
    <UiEmptyState icon="search" :title="t('taller.noEncontrado')">
      <UiButton to="/" icon="calendar">{{ t('nav.talleres') }}</UiButton>
    </UiEmptyState>
  </UiCard>
</template>

<script setup lang="ts">
import { UI_SESSION_TONES } from '@playhub/ui/app/utils/ui-tones'
import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'
import { fechaLarga, rangoDeDias } from '~/utils/fechas'
import { accionesDe, escenasDeLaGuia, escenasYDuracion, estadoDe, grupoYAsistentes, horario } from '~/utils/talleres'
import type { GuiaTaller } from '~/utils/talleres'

const { t, locale } = useT()
const route = useRoute()
const { taller: buscar, cargando, guia } = useTalleres()
const { educador } = useSesion()

const taller = computed(() => buscar(String(route.params.id)))
const estado = computed(() => (taller.value ? estadoDe(taller.value) : 'proximo'))

// Dónde, con quién, la jornada y cuánto dura (el storyboard, solo si el taller se llama distinto). El idioma solo si no
// es el de la app (el runner se abre en el del taller), la modalidad si no es presencial y la organización si trabaja en
// varias. Lo que la organización no rellenó no se muestra.
const datos = computed<{ icono: UiIconName, label: string, texto: string }[]>(() => {
  const w = taller.value
  if (!w) return []
  const duracion = [
    w.titulo !== w.storyboard.titulo ? w.storyboard.titulo : '',
    escenasYDuracion(w, n => t('taller.escenas', { n }), n => t('taller.minutos', { n })),
  ].filter(Boolean).join(' · ')
  return [
    { icono: 'map-pin' as const, label: t('taller.lugar'), texto: w.lugar },
    { icono: 'users' as const, label: t('taller.audiencia'), texto: grupoYAsistentes(w, n => t('taller.asistentes', { n })) },
    { icono: 'layers' as const, label: t('taller.jornada'), texto: w.jornada ? `${t('taller.jornadaNombre', { nombre: w.jornada.nombre })} · ${rangoDeDias(w.jornada.fechaInicio, w.jornada.fechaFin, locale.value)}` : '' },
    { icono: 'clock' as const, label: t('taller.duracion'), texto: duracion },
    { icono: 'globe' as const, label: t('taller.idioma'), texto: w.idioma !== locale.value ? t(`idioma.${w.idioma}`) : '' },
    { icono: 'devices' as const, label: t('taller.modalidad'), texto: w.modalidad !== 'presencial' ? t(`modalidad.${w.modalidad}`) : '' },
    { icono: 'building' as const, label: t('taller.organizacion'), texto: (educador.value?.organizaciones?.length ?? 0) > 1 ? w.organizacion.nombre : '' },
  ].filter(dato => dato.texto)
})

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

// La escena abierta (en el teléfono, una a la vez y se puede cerrar) y la que se ve a la derecha en pantallas anchas
// (la abierta o, si no hay, la primera). De entrada, la primera.
const abierta = ref('')
watch(escenas, (lista) => {
  if (!abierta.value && lista[0]) abierta.value = lista[0].carpeta
}, { immediate: true })
const enVista = computed(() => escenas.value.find(e => e.carpeta === abierta.value) ?? escenas.value[0])
const ancho = () => import.meta.client && window.matchMedia('(min-width: 64rem)').matches
function elegir(carpeta: string) {
  abierta.value = abierta.value === carpeta && !ancho() ? '' : carpeta
}
function mover(paso: 1 | -1) {
  const i = escenas.value.findIndex(e => e.carpeta === enVista.value?.carpeta)
  const siguiente = escenas.value[i + paso]
  if (siguiente) abierta.value = siguiente.carpeta
}

useHead({ title: computed(() => taller.value?.titulo ?? '') })
</script>
