<template>
  <!-- El detalle de un taller (tarea 023): la misma tarjeta de «Nuevo Taller» y se edita igual. Nombre, storyboard,
       educadores, cuándo y dónde, y audiencia, a la vista y con sus campos mientras no se ha dado (borrador, en revisión
       o publicado sin empezar); todo se guarda junto con un solo «Guardar Cambios» al pie, y «Cancelar» lo descarta.
       Dado, la tarjeta solo se lee. En la cabecera, la acción del estado (Publicar, Enviar a Revisión, Cancelar Taller o
       Reprogramar) y el menú ⋮ con lo que se usa poco: Devolver a Borrador, Duplicar, Archivar y, aparte y en coral,
       Eliminar (solo si no se ha dado; lo exige la base). A la derecha, lo que pasa con el taller: su estado, el cierre
       del educador, los dispositivos que se unieron y su historial. -->
  <div v-if="workshop" class="w-full">
    <header class="ui-page-header">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-3">
          <h1 class="ui-heading min-w-0 truncate">{{ workshop.title }}</h1>
          <UiBadge :tone="workshop.tone" dot class="shrink-0">{{ workshop.statusLabel }}</UiBadge>
        </div>
        <p class="ui-text mt-1.5">{{ subtitulo }}</p>
      </div>

      <!-- La acción del estado. Con cambios sin guardar, «Guardar Cambios» es el único lima y esta pasa a contorno (y
           guarda antes de cambiar el estado). -->
      <div class="ui-page-header-actions">
        <UiButton v-if="workshop.estado === 'BORRADOR'" variant="outline" icon="send" :disabled="ocupado" @click="pasarA('EN_REVISION')">
          {{ t('workshops.sendReview') }}
        </UiButton>
        <UiButton
          v-if="workshop.estado === 'BORRADOR' || workshop.estado === 'EN_REVISION'"
          :variant="sinGuardar ? 'outline' : 'primary'"
          icon="check"
          :disabled="ocupado"
          @click="pasarA('PUBLICADO')"
        >
          {{ t('workshops.publish') }}
        </UiButton>
        <UiButton v-else-if="workshop.estado === 'PUBLICADO'" variant="outline" icon="ban" :disabled="ocupado" @click="motivo = ''; cancelando = true">
          {{ t('workshops.cancel') }}
        </UiButton>
        <UiButton v-else-if="workshop.status === 'sin_realizar' || workshop.estado === 'CANCELADO'" icon="calendar" @click="nuevaFecha = ''; reprogramando = true">
          {{ t('workshops.reschedule') }}
        </UiButton>
        <MenuAcciones :acciones="acciones" :ayuda="puedeEditar ? undefined : t('workshops.deleteGiven')" @select="alElegir" />
      </div>
    </header>

    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <!-- Dos tercios: la tarjeta de «Nuevo Taller» -->
      <div class="ui-panel overflow-hidden lg:col-span-2">
        <!-- 1 · Nombre -->
        <TallerSeccion id="nombre" :numero="1" :titulo="t('wizard.secName')" :completa="!faltas.nombre.length" :falta="falta('nombre')" :marcar="intentado">
          <UiInput
            v-if="puedeEditar"
            id="taller-nombre"
            v-model="state.title"
            :label="t('wizard.fName')"
            :placeholder="t('wizard.fTitlePh')"
            :error="intentado && !state.title.trim() ? t('wizard.errName') : undefined"
            required
          />
          <p v-else class="text-body font-extrabold text-ink">{{ workshop.title }}</p>
        </TallerSeccion>

        <!-- 2 · Storyboard: se cambia como los educadores -->
        <TallerSeccion id="storyboard" :numero="2" :titulo="t('wizard.stepStoryboard')" :completa="!faltas.storyboard.length" :falta="falta('storyboard')" :marcar="intentado" class="border-t border-line">
          <template v-if="puedeEditar" #accion>
            <button type="button" class="ui-link text-caption" data-tone="sky" @click="eligiendoStoryboard = true">{{ t('wizard.change') }}</button>
          </template>
          <div v-if="selectedStoryboard" class="flex items-center gap-4">
            <UiSymbol icon="book" size="md" v-bind="uiAreaAttrs(selectedStoryboard.area)" />
            <div class="min-w-0">
              <p class="text-body font-extrabold text-ink">{{ selectedStoryboard.title }}</p>
              <p class="ui-caption mt-0.5">{{ [selectedStoryboard.category, selectedStoryboard.targetAge, selectedStoryboard.duration, tCount(t, 'storyboards.scenes', selectedStoryboard.scenesCount)].join(' · ') }}</p>
              <NuxtLink :to="`/organizacion/storyboards/${selectedStoryboard.id}`" class="ui-link mt-1.5 gap-1.5 text-caption" data-tone="sky">
                <UiIcon name="external" class="size-3.5" />
                {{ t('workshops.viewStoryboard') }}
              </NuxtLink>
            </div>
          </div>
          <p v-else class="ui-text">{{ workshop.storyboard }} · {{ t('workshops.sbUnavailable') }}</p>
        </TallerSeccion>

        <!-- 3 · Educadores -->
        <TallerSeccion id="educadores" :numero="3" :titulo="t('wizard.stepEducators')" :completa="!faltas.educadores.length" :falta="falta('educadores')" :marcar="intentado" class="border-t border-line">
          <template v-if="puedeEditar && hayEducadores" #accion>
            <button type="button" class="ui-link text-caption" data-tone="sky" @click="eligiendoEducadores = true">{{ t('wizard.change') }}</button>
          </template>
          <!-- Dado: los que lo tuvieron, con el grupo del que vinieron -->
          <div v-if="!puedeEditar" class="flex flex-wrap gap-x-6 gap-y-3">
            <div v-for="a in workshop.asignados" :key="a.id" class="flex min-w-0 items-center gap-3">
              <UiAvatar :name="a.nombre" />
              <div class="min-w-0">
                <p class="truncate text-body font-extrabold text-ink">{{ a.nombre }}</p>
                <p class="ui-caption mt-px truncate">{{ a.grupo ?? getEducator(a.id)?.profesion }}</p>
              </div>
            </div>
            <p v-if="!workshop.asignados.length" class="ui-text">{{ t('workshops.unassigned') }}</p>
          </div>
          <div v-else-if="state.educatorMode === 'individual' && selectedEducators.length" class="flex flex-wrap gap-x-6 gap-y-3">
            <div v-for="edu in selectedEducators" :key="edu.id" class="flex min-w-0 items-center gap-3">
              <UiAvatar :name="edu.nombre" :initials="edu.initials" />
              <div class="min-w-0">
                <p class="truncate text-body font-extrabold text-ink">{{ edu.nombre }}</p>
                <p class="ui-caption mt-px truncate">{{ grupoDe(edu.id) ?? edu.profesion }}</p>
              </div>
            </div>
          </div>
          <div v-else-if="state.educatorMode === 'group' && selectedGroups.length" class="flex flex-wrap gap-x-6 gap-y-3">
            <div v-for="g in selectedGroups" :key="g.id" class="flex min-w-0 items-center gap-3">
              <UiSymbol icon="users" size="md" :tone="uiToneFor(g.nombre)" />
              <div class="min-w-0">
                <p class="truncate text-body font-extrabold text-ink">{{ g.nombre }}</p>
                <p class="ui-caption mt-px">{{ tCount(t, 'wizard.groupMembers', getGroupMembers(g.id).length) }}</p>
              </div>
            </div>
          </div>
          <button v-else type="button" class="ui-slot" @click="eligiendoEducadores = true">
            <UiIcon name="user-plus" />
            {{ t('wizard.pickEducatorsSlot') }}
          </button>
          <p v-if="puedeEditar && intentado && hayEducadores && faltas.educadores.length" class="field-error mt-2">{{ t('wizard.groupEmpty') }}</p>
        </TallerSeccion>

        <!-- 4 · Cuándo y dónde -->
        <TallerSeccion id="cuando" :numero="4" :titulo="t('wizard.stepWhen')" :completa="!faltas.cuando.length" :falta="falta('cuando')" :marcar="intentado" class="border-t border-line">
          <TallerCuandoDonde v-if="puedeEditar" />
          <dl v-else class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div v-for="d in datosCuando" :key="d.label">
              <dt class="eyebrow">{{ d.label }}</dt>
              <dd class="mt-0.5 text-body font-extrabold text-ink">{{ d.value }}</dd>
            </div>
          </dl>
        </TallerSeccion>

        <!-- 5 · Audiencia -->
        <TallerSeccion id="audiencia" :numero="5" :titulo="t('wizard.stepAudience')" :completa="!faltas.audiencia.length" :falta="falta('audiencia')" :marcar="intentado" class="border-t border-line">
          <TallerAudiencia v-if="puedeEditar" />
          <dl v-else class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div v-for="d in datosAudiencia" :key="d.label" :class="d.ancho && 'sm:col-span-2'">
              <dt class="eyebrow">{{ d.label }}</dt>
              <dd :class="['mt-0.5', d.ancho ? 'ui-text' : 'text-body font-extrabold text-ink']">{{ d.value }}</dd>
            </div>
          </dl>
        </TallerSeccion>

        <!-- El pie, para todo lo que se ajuste -->
        <div v-if="puedeEditar" class="ui-panel-footer flex flex-wrap items-center justify-end gap-3">
          <p v-if="sinGuardar" class="ui-caption mr-auto">{{ t('workshops.unsaved') }}</p>
          <UiButton tone="neutral" :disabled="!sinGuardar || ocupado" @click="descartar">{{ t('common.cancel') }}</UiButton>
          <UiButton icon="check" :disabled="!sinGuardar || enCurso" :loading="isSubmitting" @click="guardar">{{ t('workshops.saveChanges') }}</UiButton>
        </div>
      </div>

      <!-- Un tercio: lo que pasa con el taller -->
      <div class="flex flex-col gap-6">
        <section class="ui-panel">
          <div class="ui-panel-header"><h2 class="ui-title">{{ t('workshops.stateTitle') }}</h2></div>
          <p class="ui-text px-6 py-5">{{ textoDelEstado }}</p>
        </section>

        <!-- Lo que el educador cuenta al terminar en Educators. Del grupo, nunca de una persona. -->
        <section class="ui-panel">
          <div class="ui-panel-header"><h2 class="ui-title">{{ t('workshops.closingTitle') }}</h2></div>
          <div v-if="cierres.length" class="divide-y divide-line">
            <div v-for="a in cierres" :key="a.id" class="px-6 py-5">
              <p class="text-body font-extrabold text-ink">{{ a.nombre }}</p>
              <p class="ui-caption mt-0.5">{{ ejecucion(a) }}</p>
              <dl v-if="a.feedback" class="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
                <div><dt class="eyebrow">{{ t('workshops.rating') }}</dt><dd class="text-body font-extrabold text-ink">{{ a.feedback.calificacion }}/5</dd></div>
                <div><dt class="eyebrow">{{ t('workshops.attendees') }}</dt><dd class="text-body font-extrabold text-ink">{{ a.feedback.asistentes_reales }}</dd></div>
                <div><dt class="eyebrow">{{ t('workshops.participation') }}</dt><dd class="text-body font-extrabold text-ink">{{ t(`workshops.participacion.${a.feedback.participacion_grupo}`) }}</dd></div>
                <div><dt class="eyebrow">{{ t('workshops.clarity') }}</dt><dd class="text-body font-extrabold text-ink">{{ t(`workshops.claridad.${a.feedback.claridad_contenido}`) }}</dd></div>
                <div v-if="a.feedback.dificultades_grupo" class="col-span-2"><dt class="eyebrow">{{ t('workshops.hardest') }}</dt><dd class="ui-text">{{ a.feedback.dificultades_grupo }}</dd></div>
                <div v-if="a.feedback.material_faltante" class="col-span-2"><dt class="eyebrow">{{ t('workshops.missingMaterial') }}</dt><dd class="ui-text">{{ a.feedback.material_faltante }}</dd></div>
              </dl>
            </div>
          </div>
          <p v-else class="ui-text px-6 py-5">{{ seDara ? t('workshops.closingPending') : t('workshops.closingNone') }}</p>
        </section>

        <!-- Los dispositivos que se unieron con el QR (tarea 013) y cuánto estuvieron conectados en promedio -->
        <section class="ui-panel">
          <div class="ui-panel-header"><h2 class="ui-title">{{ t('workshops.devicesTitle') }}</h2></div>
          <dl v-if="dispositivos" class="grid grid-cols-2 gap-x-6 px-6 py-5">
            <div><dt class="eyebrow">{{ t('workshops.devicesJoined') }}</dt><dd class="text-body font-extrabold tabular-nums text-ink">{{ dispositivos }}</dd></div>
            <div><dt class="eyebrow">{{ t('workshops.devicesAverage') }}</dt><dd class="text-body font-extrabold tabular-nums text-ink">{{ t('workshops.minutes', { n: minutosPorDispositivo }) }}</dd></div>
          </dl>
          <p v-else class="ui-text px-6 py-5">{{ seDara ? t('workshops.devicesPending') : t('workshops.devicesNone') }}</p>
        </section>

        <section class="ui-panel">
          <div class="ui-panel-header"><h2 class="ui-title">{{ t('workshops.history') }}</h2></div>
          <div class="px-6 py-5">
            <p v-if="workshop.motivoCancelacion" class="ui-text">{{ t('workshops.cancelledReason', { motivo: workshop.motivoCancelacion }) }}</p>
            <p v-if="workshop.reprogramaciones" class="ui-text">
              {{ workshop.reprogramaciones === 1 ? t('workshops.rescheduledOnce') : t('workshops.rescheduledTimes', { n: workshop.reprogramaciones }) }}
            </p>
            <p v-if="!workshop.motivoCancelacion && !workshop.reprogramaciones" class="ui-text">{{ t('workshops.historyNone') }}</p>
          </div>
        </section>
      </div>
    </div>

    <TallerStoryboardDialog v-model:open="eligiendoStoryboard" />
    <TallerEducadoresDialog v-model:open="eligiendoEducadores" />

    <!-- Cancelar: se confirma; el motivo le llega al educador -->
    <UiConfirmDialog
      :open="cancelando"
      :title="t('workshops.cancelTitle')"
      :confirm-label="t('workshops.cancel')"
      :loading="enCurso"
      @update:open="(v) => cancelando = v"
      @confirm="confirmarCancelar"
    >
      <p>{{ t('workshops.cancelWarn') }}</p>
      <UiTextarea v-model="motivo" class="mt-4" :label="t('workshops.reason')" optional :rows="2" :placeholder="t('workshops.reasonPh')" />
    </UiConfirmDialog>

    <!-- Reprogramar: otra fecha (desde hoy) y vuelve a publicado -->
    <UiDialog :open="reprogramando" :title="t('workshops.rescheduleTitle')" @update:open="(v) => reprogramando = v">
      <p class="ui-text">{{ t('workshops.rescheduleText') }}</p>
      <UiInput v-model="nuevaFecha" class="mt-4" type="date" :label="t('workshops.newDate')" :min="hoy" />
      <template #actions>
        <UiButton :disabled="!nuevaFecha" :loading="enCurso" icon="calendar" @click="confirmarReprogramar">{{ t('workshops.reschedule') }}</UiButton>
      </template>
    </UiDialog>

    <!-- Archivar: descartado; sale de las listas activas -->
    <UiConfirmDialog
      :open="archivando"
      :title="t('workshops.archiveTitle')"
      :confirm-label="t('workshops.archiveConfirm')"
      :loading="enCurso"
      @update:open="(v) => archivando = v"
      @confirm="confirmarArchivar"
    >
      <p>{{ t('workshops.archiveWarn', { titulo: workshop.title }) }}</p>
    </UiConfirmDialog>

    <!-- Eliminar: permanente, se confirma en coral -->
    <UiConfirmDialog
      :open="eliminando"
      :title="t('workshops.deleteTitle')"
      :confirm-label="t('workshops.deleteConfirm')"
      :loading="enCurso"
      @update:open="(v) => eliminando = v"
      @confirm="confirmarEliminar"
    >
      <p>{{ t('workshops.deleteWarn', { titulo: workshop.title }) }}</p>
    </UiConfirmDialog>
  </div>

  <!-- Cargando (la lista llega async al refrescar la página) -->
  <div v-else-if="cargando" class="ui-panel ui-text p-10 text-center">{{ t('common.loading') }}</div>

  <div v-else class="ui-panel">
    <UiEmptyState icon="alert" :title="t('workshops.notFound')" :text="t('workshops.notFoundText')">
      <UiButton variant="outline" size="sm" @click="navigateTo('/organizacion/workshops')">{{ t('workshops.backToList') }}</UiButton>
    </UiEmptyState>
  </div>
</template>

<script setup lang="ts">
import type { AccionDelMenu } from '~/components/MenuAcciones.vue'
import type { Workshop } from '~/composables/useWorkshops'
import type { SeccionTaller } from '~/utils/nuevoTaller'
import { enumerar } from '~/utils/nuevoTaller'
import { rangoJornada } from '~/utils/jornadas'

definePageMeta({ layout: 'dashboard' })

const { t, locale } = useT()
const route = useRoute()
const { toast } = useToast()
const {
  getWorkshop, loading: cargando, enviarARevision, volverABorrador, publicarTaller, cancelarTaller,
  reprogramarTaller, archivarTaller, duplicarTaller, eliminarTaller, segundosConectados,
} = useWorkshops()
const { getEducator, getGroupMembers } = useEducators()
const {
  state, intentado, faltas, primeraSinCompletar, isSubmitting, sinGuardar,
  selectedStoryboard, selectedEducators, selectedGroups,
  comprobarFecha, cargarTaller, coincideCon, guardarCambios, vigilarJornada,
} = useWorkshopWizard()

const workshopId = Number(route.params.id)
const workshop = computed(() => getWorkshop(workshopId))
const hoy = hoyLocal()

// Se dio (o se empezó): lo que pasó ya no cambia.
const empezado = computed(() => !!workshop.value?.asignados.some(a => a.iniciadoEn || a.feedback))
// Se edita (y se elimina) mientras no se ha dado: borrador, en revisión o publicado sin empezar.
const puedeEditar = computed(() => {
  const e = workshop.value?.estado
  return e === 'BORRADOR' || e === 'EN_REVISION' || (e === 'PUBLICADO' && !empezado.value)
})
// Todavía se va a dar: el cierre y los dispositivos llegarán.
const seDara = computed(() => ['BORRADOR', 'EN_REVISION', 'PUBLICADO'].includes(workshop.value?.estado ?? ''))

// La tarjeta sigue al taller guardado: al llegar, y cuando cambia (otra pestaña, otra app, un cambio de estado) si no
// hay nada sin guardar. Con cambios a medias, se quedan. Los vigilantes de la jornada van después: cargar el taller no
// cuenta como elegir su jornada.
watch(workshop, (w, antes) => {
  if (w && (!antes || antes.id !== w.id || coincideCon(antes))) cargarTaller(w)
}, { immediate: true })
vigilarJornada()

const eligiendoStoryboard = ref(false)
const eligiendoEducadores = ref(false)
const hayEducadores = computed(() => (state.value.educatorMode === 'group' ? selectedGroups.value.length : selectedEducators.value.length) > 0)
// El grupo del que vino un educador ya asignado.
const grupoDe = (id: number) => workshop.value?.asignados.find(a => a.id === id)?.grupo ?? null

// Lo que le falta a una sección, en su cabecera (como en «Nuevo Taller»).
function falta(seccion: SeccionTaller): string {
  if (!puedeEditar.value) return ''
  const f = faltas.value[seccion]
  if (!f.length) return ''
  if (f.includes('fueraDelPrograma')) return t('wizard.missOutsideProgram')
  if (seccion === 'storyboard' || seccion === 'educadores') return t('wizard.missPick')
  const partes = f.map(x => t(`wizard.miss.${x}`))
  return t(partes.length > 1 ? 'wizard.missMany' : 'wizard.missOne', { lo: enumerar(partes, t('wizard.and')) })
}

function irA(seccion: SeccionTaller) {
  document.getElementById(`seccion-${seccion}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Uno publicado lo pide todo (lo exige la base): si falta algo, se marca y la página baja a la primera sección
// incompleta; una fecha fuera de su jornada pregunta antes si se amplía.
function listoParaPublicar(): boolean {
  intentado.value = true
  const primera = primeraSinCompletar.value
  if (primera) {
    irA(primera)
    return false
  }
  return comprobarFecha()
}

// ── Guardar o descartar ──────────────────────────────────────────────────────
async function guardar() {
  if (workshop.value?.estado === 'PUBLICADO' && !listoParaPublicar()) return
  if (await guardarCambios()) toast.success(t('workshops.saved'))
}

function descartar() {
  if (workshop.value) cargarTaller(workshop.value)
  intentado.value = false
}

// ── El ciclo ─────────────────────────────────────────────────────────────────
const enCurso = ref(false)
const ocupado = computed(() => enCurso.value || isSubmitting.value)
const cancelando = ref(false)
const reprogramando = ref(false)
const archivando = ref(false)
const eliminando = ref(false)
const motivo = ref('')
const nuevaFecha = ref('')

// Una acción del ciclo: si la base la rechaza, su mensaje dice por qué (p. ej., «asigna al menos un educador»).
async function accion(fn: (id: number) => Promise<{ error: string | null }>, ok: string) {
  enCurso.value = true
  const { error } = await fn(workshopId)
  enCurso.value = false
  if (error) {
    toast.error(error)
    return false
  }
  toast.success(ok)
  return true
}

// Enviar a revisión o publicar. Con cambios sin guardar, primero se guardan.
async function pasarA(estado: 'EN_REVISION' | 'PUBLICADO') {
  if (estado === 'PUBLICADO' && !listoParaPublicar()) return
  if (sinGuardar.value && !(await guardarCambios())) return
  if (estado === 'PUBLICADO') await accion(publicarTaller, t('workshops.published'))
  else await accion(enviarARevision, t('workshops.sentReview'))
}

// El menú ⋮: según el estado, y Eliminar al final (deshabilitado si ya se dio).
const acciones = computed<AccionDelMenu[]>(() => {
  const e = workshop.value?.estado
  const lista: AccionDelMenu[] = []
  if (e === 'EN_REVISION') lista.push({ key: 'borrador', label: t('workshops.backToDraft'), icon: 'pencil' })
  lista.push({ key: 'duplicar', label: t('workshops.duplicate'), icon: 'copy' })
  if (e === 'BORRADOR' || e === 'EN_REVISION' || e === 'FINALIZADO' || e === 'CANCELADO') {
    lista.push({ key: 'archivar', label: t('workshops.archive'), icon: 'package' })
  }
  lista.push({ key: 'eliminar', label: t('workshops.delete'), icon: 'trash', peligro: true, disabled: !puedeEditar.value })
  return lista
})

async function alElegir(key: string) {
  if (key === 'borrador') await accion(volverABorrador, t('workshops.backDraft'))
  else if (key === 'duplicar') await duplicar()
  else if (key === 'archivar') archivando.value = true
  else if (key === 'eliminar') eliminando.value = true
}

async function confirmarCancelar() {
  if (await accion(id => cancelarTaller(id, motivo.value), t('workshops.cancelled'))) cancelando.value = false
}

async function confirmarReprogramar() {
  if (await accion(id => reprogramarTaller(id, nuevaFecha.value), t('workshops.rescheduled'))) reprogramando.value = false
}

async function confirmarArchivar() {
  if (await accion(archivarTaller, t('workshops.archived'))) {
    archivando.value = false
    navigateTo('/organizacion/workshops')
  }
}

async function duplicar() {
  const { id, error } = await duplicarTaller(workshopId)
  if (error) {
    toast.error(error)
    return
  }
  toast.success(t('workshops.duplicated'))
  if (id) navigateTo(`/organizacion/workshops/${id}`)
}

async function confirmarEliminar() {
  if (await accion(eliminarTaller, t('workshops.deleted'))) {
    eliminando.value = false
    navigateTo('/organizacion/workshops')
  }
}

// ── Lo que se muestra ────────────────────────────────────────────────────────
// «Sábado 28 nov 2026 · 09:30 – 10:00 · Hospital Bloom · Sala Especial»
const fechaLarga = (iso: string) => {
  const dia = aFecha(iso).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-ES', { weekday: 'long' })
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${fechaCorta(iso, locale.value)}`
}
const subtitulo = computed(() => {
  const w = workshop.value
  if (!w) return ''
  return [w.date ? fechaLarga(w.date) : t('workshops.noDate'), w.time.replace(' - ', ' – '), w.location === '—' ? '' : w.location]
    .filter(Boolean).join(' · ')
})

// Qué significa el estado en que está y qué sigue.
const textoDelEstado = computed(() => {
  const w = workshop.value
  if (!w) return ''
  if (w.estado === 'PUBLICADO' && empezado.value) return t('workshops.stateText.EN_CURSO')
  if (w.estado === 'FINALIZADO') return t(w.status === 'completado' ? 'workshops.stateText.REALIZADO' : 'workshops.stateText.SIN_REALIZAR')
  return t(`workshops.stateText.${w.estado}`)
})

// Dado, «Cuándo y dónde» y «Audiencia» se leen.
const datosCuando = computed(() => {
  const w = workshop.value
  if (!w) return []
  const pertenece = w.jornada
    ? `${w.jornada.nombre} · ${rangoJornada(w.jornada, locale.value)}`
    : w.programa ? w.programa.nombre : t('wizard.belongsSuelto')
  return [
    { label: t('wizard.belongs'), value: pertenece },
    { label: t('wizard.fDate'), value: w.date ? fechaLarga(w.date) : '—' },
    { label: t('workshops.time'), value: w.time.replace(' - ', ' – ') || '—' },
    { label: t('places.field'), value: w.location },
  ]
})
const datosAudiencia = computed(() => {
  const w = workshop.value
  if (!w) return []
  return [
    { label: t('audiences.field'), value: w.audiencia || '—' },
    { label: t('wizard.fCapacity'), value: w.capacity ? String(w.capacity) : '—' },
    { label: t('wizard.fLanguage'), value: t(`lang.${w.language}`) === `lang.${w.language}` ? w.language.toUpperCase() : t(`lang.${w.language}`) },
    { label: t('wizard.modality'), value: t(`workshops.modality.${w.modalidad}`) },
    ...(w.notes ? [{ label: t('wizard.fNotes'), value: w.notes, ancho: true }] : []),
  ] as { label: string, value: string, ancho?: boolean }[]
})

// El cierre: los asignados que lo empezaron o lo cerraron.
const cierres = computed(() => workshop.value?.asignados.filter(a => a.iniciadoEn || a.feedback) ?? [])
const hora = (iso: string) => new Date(iso).toLocaleTimeString(locale.value === 'en' ? 'en-US' : 'es', { hour: '2-digit', minute: '2-digit' })
function ejecucion(a: Workshop['asignados'][number]): string {
  if (!a.iniciadoEn) return t('workshops.execNone')
  return a.terminadoEn
    ? t('workshops.execFromTo', { desde: hora(a.iniciadoEn), hasta: hora(a.terminadoEn) })
    : t('workshops.execStarted', { hora: hora(a.iniciadoEn) })
}

// Los dispositivos: cuántos se unieron (lo anota el educador en el cierre, el mayor si son varios) y el tiempo
// conectado de los aprobados, como en el reporte.
const dispositivos = computed(() => Math.max(0, ...(workshop.value?.asignados.map(a => a.dispositivos ?? 0) ?? [])))
const segundos = ref(0)
watch(() => workshop.value?.estado, async () => {
  if (workshop.value && !seDara.value) segundos.value = await segundosConectados(workshopId)
}, { immediate: true })
const minutosPorDispositivo = computed(() => (dispositivos.value ? Math.round(segundos.value / dispositivos.value / 60) : 0))
</script>
