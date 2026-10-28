<template>
  <div v-if="workshop" class="max-w-[980px] mx-auto">
    <!-- Header -->
    <header class="ui-page-header">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-3">
          <h1 class="ui-heading min-w-0 truncate">
            {{ workshop.title }}
          </h1>
          <UiBadge :tone="workshop.tone" dot class="shrink-0">
            {{ workshop.statusLabel }}
          </UiBadge>
        </div>
        <p class="ui-text mt-1.5">{{ subtitulo }}</p>
      </div>

      <div class="ui-page-header-actions">
        <UiButton v-if="puedeEditar" variant="outline" icon="pencil" @click="abrirEdicion">Editar</UiButton>
        <!-- Las acciones del ciclo según el estado guardado; la base rechaza lo que no cabe. -->
        <template v-if="workshop.estado === 'BORRADOR' || workshop.estado === 'EN_REVISION'">
          <UiButton v-if="workshop.estado === 'BORRADOR'" variant="outline" icon="send" @click="accion(enviarARevision, 'Enviado a revisión.')">
            Enviar a revisión
          </UiButton>
          <UiButton v-else variant="outline" icon="pencil" @click="accion(volverABorrador, 'Vuelve a borrador.')">
            Volver a borrador
          </UiButton>
          <UiButton icon="check" @click="accion(publicarTaller, 'Taller publicado: sus educadores ya lo ven.')">
            Publicar
          </UiButton>
        </template>
        <!-- Secundaria: una acción destructiva no es la más visible de la vista (el coral, en su confirmación) -->
        <UiButton v-else-if="workshop.estado === 'PUBLICADO'" variant="outline" icon="ban" @click="motivo = ''; cancelando = true">
          Cancelar Taller
        </UiButton>
        <UiButton v-else-if="workshop.status === 'sin_realizar' || workshop.estado === 'CANCELADO'" icon="calendar" @click="nuevaFecha = ''; reprogramando = true">
          Reprogramar
        </UiButton>

        <!-- Menú ⋯ -->
        <RekaPopoverRoot v-model:open="menuAbierto">
          <RekaPopoverTrigger as-child>
            <UiButton variant="outline" icon="more-vertical" icon-only label="Más acciones" />
          </RekaPopoverTrigger>
          <RekaPopoverPortal>
            <RekaPopoverContent align="end" :side-offset="6" class="ui-listbox ui-listbox-floating w-60">
              <button type="button" class="ui-option justify-start gap-2.5" @click="duplicar">
                <UiIcon name="copy" class="size-4 text-subtle" />
                Duplicar taller
              </button>
              <button v-if="puedeArchivar" type="button" class="ui-option justify-start gap-2.5" @click="menuAbierto = false; archivando = true">
                <UiIcon name="package" class="size-4 text-subtle" />
                Archivar (descartar)
              </button>
              <template v-if="workshop.estado === 'BORRADOR' || workshop.estado === 'EN_REVISION'">
                <div class="mx-2 my-1 h-px bg-line" />
                <button
                  type="button"
                  data-tone="coral"
                  class="ui-option justify-start gap-2.5 text-(--tone-strong) hover:bg-(--tone-wash)"
                  @click="menuAbierto = false; eliminando = true"
                >
                  <UiIcon name="trash" class="size-4" />
                  Eliminar taller
                </button>
              </template>
              <p class="ui-caption mx-3 mb-2 mt-1.5">
                Archivar lo descarta y lo guarda en el historial. Solo un borrador se puede eliminar del todo.
              </p>
            </RekaPopoverContent>
          </RekaPopoverPortal>
        </RekaPopoverRoot>
      </div>
    </header>

    <!-- Panel principal -->
    <div class="ui-panel overflow-hidden">
      <!-- Barra de info: la hora lleva el tono de la sesión -->
      <div class="border-b border-line bg-canvas px-6 py-5">
        <div class="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          <div v-for="info in infoBar" :key="info.label" class="flex flex-col gap-1">
            <div class="flex items-center gap-1.5">
              <UiIcon :name="info.icon" class="size-3.5 text-subtle" />
              <span class="eyebrow">{{ info.label }}</span>
            </div>
            <span
              :data-tone="info.tonoSesion ? workshop.tone : undefined"
              :class="[
                'text-body font-extrabold leading-snug',
                info.tonoSesion ? 'tabular-nums text-(--tone-strong)' : 'text-ink',
              ]"
            >{{ info.value }}</span>
          </div>
        </div>
      </div>

      <!-- Storyboard vinculado: su símbolo lleva el tono de su área educativa -->
      <div class="px-6 py-6">
        <p class="eyebrow mb-3.5">Storyboard vinculado</p>
        <div v-if="storyboard" class="flex items-start gap-4">
          <UiSymbol
            icon="book"
            size="md"
                        v-bind="uiAreaAttrs(storyboard.area)"
          />
          <div class="min-w-0 flex-1">
            <p class="text-body font-extrabold text-ink">{{ storyboard.title }}</p>
            <p class="ui-caption mb-3 mt-0.5">
              {{ storyboard.category }} · {{ storyboard.pertenencia }} · {{ storyboard.duration }} · {{ storyboard.scenesCount }} escenas · {{ storyboard.targetAge }}
            </p>
            <NuxtLink
              :to="'/dashboard/storyboards/' + storyboard.id"
              class="ui-link gap-1.5 text-caption"
              data-tone="sky"
            >
              <UiIcon name="external" class="size-3.5" />
              Ver storyboard
            </NuxtLink>
          </div>
        </div>
        <div v-else class="ui-text">Storyboard no disponible</div>
      </div>

      <!-- Educador asignado -->
      <div class="border-t border-line px-6 py-6">
        <div class="mb-3.5 flex items-center justify-between gap-3">
          <p class="eyebrow">Educador asignado</p>
          <UiButton v-if="puedeEditar" variant="outline" size="sm" icon="users" @click="nuevoEducador = ''; gestionandoEducadores = true">
            Cambiar educadores
          </UiButton>
        </div>
        <div v-if="educator" class="flex items-start gap-4">
          <UiAvatar :name="educator.nombre" :initials="educator.initials" size="lg" />
          <div class="min-w-0 flex-1">
            <p class="text-body font-extrabold text-ink">{{ educator.nombre }}</p>
            <p class="ui-caption mb-3 mt-0.5">{{ educator.profesion }}</p>
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2 text-caption font-semibold text-muted">
                <UiIcon name="mail" class="size-3.5 shrink-0 text-subtle" />
                {{ educator.email }}
              </div>
              <div class="flex items-center gap-2 text-caption font-semibold text-muted">
                <UiIcon name="phone" class="size-3.5 shrink-0 text-subtle" />
                {{ educator.telefono }}
              </div>
            </div>
            <!-- El grupo por el que se le asignó (si vino de uno). Sin significado propio: tono estable por nombre -->
            <div v-if="workshop.asignados[0]?.grupo" class="mt-3">
              <UiBadge :tone="uiToneFor(workshop.asignados[0].grupo)">{{ workshop.asignados[0].grupo }}</UiBadge>
            </div>
          </div>
        </div>
        <div v-else class="ui-text">Educador no asignado</div>

        <!-- El taller puede tener VARIOS asignados (directos o vía grupo) -->
        <div v-if="workshop.asignados.length > 1" class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span class="eyebrow">También asignados:</span>
          <span
            v-for="a in workshop.asignados.slice(1)"
            :key="a.id"
            class="inline-flex items-center gap-1.5 text-caption font-bold text-muted"
          >
            <UiAvatar :name="a.nombre" size="sm" />
            {{ a.nombre }}<template v-if="a.grupo"> · {{ a.grupo }}</template>
          </span>
        </div>
      </div>

      <!-- Ejecución real y feedback del workshop (los escribe el educador desde Educators).
           Observación del grupo, nunca de una persona. -->
      <div v-if="workshop.asignados.some(a => a.iniciadoEn || a.feedback)" class="border-t border-line px-6 py-6">
        <p class="eyebrow mb-3.5">Ejecución y feedback</p>
        <div class="space-y-4">
          <div v-for="a in workshop.asignados.filter(x => x.iniciadoEn || x.feedback)" :key="a.id" class="flex items-start gap-4">
            <UiAvatar :name="a.nombre" size="sm" />
            <div class="min-w-0 flex-1">
              <p class="text-body font-extrabold text-ink">{{ a.nombre }}</p>
              <p class="ui-caption mt-0.5">{{ ejecucion(a) }}</p>
              <dl v-if="a.feedback" class="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                <div><dt class="eyebrow">Calificación</dt><dd class="text-body font-extrabold text-ink">{{ a.feedback.calificacion }}/5</dd></div>
                <div><dt class="eyebrow">Asistentes</dt><dd class="text-body font-extrabold text-ink">{{ a.feedback.asistentes_reales }}</dd></div>
                <div><dt class="eyebrow">Participación</dt><dd class="text-body font-extrabold text-ink">{{ PARTICIPACION_LABELS[a.feedback.participacion_grupo] }}</dd></div>
                <div><dt class="eyebrow">Claridad</dt><dd class="text-body font-extrabold text-ink">{{ CLARIDAD_LABELS[a.feedback.claridad_contenido] }}</dd></div>
                <div v-if="a.feedback.dificultades_grupo" class="col-span-2 sm:col-span-4"><dt class="eyebrow">Lo que más costó</dt><dd class="ui-text">{{ a.feedback.dificultades_grupo }}</dd></div>
                <div v-if="a.feedback.material_faltante" class="col-span-2 sm:col-span-4"><dt class="eyebrow">Material que faltó</dt><dd class="ui-text">{{ a.feedback.material_faltante }}</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- Cancelación y reprogramaciones: lo que cambió en su ciclo -->
      <div v-if="workshop.motivoCancelacion || workshop.reprogramaciones" class="border-t border-line px-6 py-6">
        <p class="eyebrow mb-3">Historial</p>
        <p v-if="workshop.motivoCancelacion" class="ui-text">Cancelado: {{ workshop.motivoCancelacion }}</p>
        <p v-if="workshop.reprogramaciones" class="ui-text">
          Reprogramado {{ workshop.reprogramaciones === 1 ? 'una vez' : `${workshop.reprogramaciones} veces` }}
        </p>
      </div>

      <!-- Notas -->
      <div v-if="workshop.notes" class="border-t border-line px-6 py-6">
        <p class="eyebrow mb-3">Notas</p>
        <p class="ui-text">{{ workshop.notes }}</p>
      </div>
    </div>

    <!-- Editar los datos (no el estado). Uno finalizado o cancelado cambia de fecha al reprogramarse. -->
    <UiDialog :open="editando" title="Editar Taller" size="lg" @update:open="(v) => editando = v">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UiInput v-model="form.titulo" class="sm:col-span-2" label="Título del taller" :placeholder="storyboard?.title" />
        <div class="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-3">
          <UiInput
            v-model="form.fecha"
            type="date"
            label="Fecha"
            :min="workshop.estado === 'PUBLICADO' ? hoy : undefined"
            :disabled="!fechaEditable"
            :hint="fechaEditable ? undefined : 'Para cambiar la fecha, reprográmalo.'"
          />
          <UiInput v-model="form.horaInicio" type="time" label="Inicio" />
          <UiInput v-model="form.horaFin" type="time" label="Fin" />
        </div>
        <UiInput v-model="form.ubicacion" label="Ubicación" placeholder="Aula, salón o centro comunitario" />
        <UiInput v-model="form.grupo" label="Grupo" placeholder="Ej: 2.º B" />
        <UiInput v-model="form.capacidad" type="number" label="Asistentes estimados" />
        <UiSelect v-model="form.modalidad" :options="modalidades" label="Modalidad" />
        <UiSelect v-if="idiomas.length > 1" v-model="form.idioma" :options="idiomas" label="Idioma del contenido" />
        <UiSelect v-if="jornadas.length" v-model="form.jornadaId" :options="jornadaOpciones" label="Jornada" />
        <UiTextarea v-model="form.notas" class="sm:col-span-2" label="Notas" optional :rows="3" />
      </div>
      <p v-if="errorEdicion" class="field-error mt-3">{{ errorEdicion }}</p>
      <template #actions>
        <UiButton :loading="enCurso" icon="check" @click="guardarEdicion">Guardar cambios</UiButton>
      </template>
    </UiDialog>

    <!-- Educadores: se suman y se quitan al momento. Uno publicado conserva al menos uno. -->
    <UiDialog :open="gestionandoEducadores" title="Educadores del Taller" @update:open="(v) => gestionandoEducadores = v">
      <ul class="divide-y divide-line">
        <li v-for="a in workshop.asignados" :key="a.asignacionId" class="flex items-center gap-3 py-2.5">
          <UiAvatar :name="a.nombre" size="sm" />
          <span class="min-w-0 flex-1 truncate text-body font-bold text-ink">
            {{ a.nombre }}<template v-if="a.grupo"> · {{ a.grupo }}</template>
          </span>
          <UiButton
            variant="outline"
            size="sm"
            :disabled="enCurso || (workshop.estado === 'PUBLICADO' && workshop.asignados.length === 1)"
            @click="quitarEducador(a.asignacionId, a.nombre)"
          >
            Quitar
          </UiButton>
        </li>
        <li v-if="!workshop.asignados.length" class="ui-text py-2.5">Sin educadores asignados.</li>
      </ul>
      <p v-if="workshop.estado === 'PUBLICADO' && workshop.asignados.length === 1" class="ui-caption mt-2">
        Un taller publicado necesita al menos un educador: asigna a otro antes de quitar a este.
      </p>
      <div v-if="educadoresDisponibles.length" class="mt-5 flex items-end gap-3">
        <UiSelect v-model="nuevoEducador" :options="educadoresDisponibles" label="Asignar a" placeholder="Elige un educador" class="min-w-0 flex-1" />
        <UiButton :disabled="!nuevoEducador" :loading="enCurso" icon="plus" @click="sumarEducador">Asignar</UiButton>
      </div>
      <p v-else class="ui-caption mt-5">No hay más educadores activos en la comunidad.</p>
    </UiDialog>

    <!-- Cancelar: se confirma; el motivo le llega al educador -->
    <UiConfirmDialog
      :open="cancelando"
      title="Cancelar Taller"
      confirm-label="Cancelar Taller"
      :loading="enCurso"
      @update:open="(v) => cancelando = v"
      @confirm="confirmarCancelar"
    >
      <p>Sus educadores lo verán cancelado en Educators. Si no se dio, después lo puedes reprogramar.</p>
      <UiTextarea v-model="motivo" class="mt-4" label="Motivo" optional :rows="2" placeholder="Feriado escolar, lluvia…" />
    </UiConfirmDialog>

    <!-- Reprogramar: otra fecha (desde hoy) y vuelve a publicado -->
    <UiDialog :open="reprogramando" title="Reprogramar Taller" @update:open="(v) => reprogramando = v">
      <p class="ui-text">Elige la nueva fecha: el taller vuelve a publicarse y sus educadores lo ven otra vez.</p>
      <UiInput v-model="nuevaFecha" class="mt-4" type="date" label="Nueva fecha" :min="hoy" />
      <template #actions>
        <UiButton :disabled="!nuevaFecha" :loading="enCurso" icon="calendar" @click="confirmarReprogramar">Reprogramar</UiButton>
      </template>
    </UiDialog>

    <!-- Archivar: descartado; sale de las listas activas -->
    <UiConfirmDialog
      :open="archivando"
      title="Archivar Taller"
      confirm-label="Archivar"
      :loading="enCurso"
      @update:open="(v) => archivando = v"
      @confirm="confirmarArchivar"
    >
      <p>«{{ workshop.title }}» queda descartado: sale de las listas y ya no se modifica. Se conserva en la pestaña «Archivados».</p>
    </UiConfirmDialog>

    <!-- Eliminar: permanente, se confirma en serio -->
    <UiConfirmDialog
      :open="eliminando"
      title="Eliminar Taller"
      confirm-label="Eliminar Definitivamente"
      :loading="eliminandoEnCurso"
      @update:open="(v) => eliminando = v"
      @confirm="confirmarEliminar"
    >
      <p>Esta acción es permanente y no se puede deshacer. Se eliminará "{{ workshop.title }}" junto con sus asignaciones de educadores. Si quieres conservarlo en el historial, archívalo.</p>
    </UiConfirmDialog>
  </div>

  <!-- Cargando (la lista llega async al refrescar la página) -->
  <div v-else-if="cargando" class="ui-panel ui-text p-10 text-center">Cargando…</div>

  <!-- Not Found -->
  <div v-else class="ui-panel">
    <UiEmptyState
      icon="alert"
      title="Taller no encontrado"
      text="El taller que buscas no existe o ha sido eliminado."
    >
      <UiButton variant="outline" size="sm" @click="navigateTo('/dashboard/workshops')">
        Volver a Talleres
      </UiButton>
    </UiEmptyState>
  </div>
</template>

<script setup lang="ts">
import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'
import { CLARIDAD_LABELS, MODALIDADES, PARTICIPACION_LABELS } from '~/composables/useWorkshops'
import type { Modalidad, Workshop } from '~/composables/useWorkshops'
import type { JornadaFila } from '~/composables/useJornadas'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const {
  getWorkshop, loading: cargando, enviarARevision, volverABorrador, publicarTaller, cancelarTaller,
  reprogramarTaller, archivarTaller, duplicarTaller, eliminarTaller, actualizarTaller, asignarEducador, quitarAsignacion,
} = useWorkshops()
const { getStoryboard } = useStoryboards()
const { getEducator, activeEducators } = useEducators()
const { comunidadActiva } = useContexto()
const { toast } = useToast()

const menuAbierto = ref(false)
const eliminando = ref(false)
const eliminandoEnCurso = ref(false)
const cancelando = ref(false)
const reprogramando = ref(false)
const archivando = ref(false)
const enCurso = ref(false)
const motivo = ref('')
const nuevaFecha = ref('')
const hoy = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local

const workshopId = Number(route.params.id)
const workshop = computed(() => getWorkshop(workshopId))
const puedeArchivar = computed(() => !!workshop.value && ['BORRADOR', 'EN_REVISION', 'FINALIZADO', 'CANCELADO'].includes(workshop.value.estado))
// Se edita mientras no se haya dado: ni archivado, ni empezado, ni realizado.
const puedeEditar = computed(() => !!workshop.value && workshop.value.estado !== 'ARCHIVADO'
  && !workshop.value.asignados.some(a => a.iniciadoEn || a.feedback))
const fechaEditable = computed(() => !!workshop.value && ['BORRADOR', 'EN_REVISION', 'PUBLICADO'].includes(workshop.value.estado))

// ── Editar los datos ─────────────────────────────────────────────────────────
const editando = ref(false)
const errorEdicion = ref('')
const form = reactive({
  titulo: '', fecha: '', horaInicio: '', horaFin: '', ubicacion: '', grupo: '', capacidad: '',
  idioma: 'es', modalidad: 'PRESENCIAL' as Modalidad, jornadaId: '' as string, notas: '',
})
const modalidades = (Object.keys(MODALIDADES) as Modalidad[]).map(value => ({ value, label: MODALIDADES[value].label }))
const nombresIdioma: Record<string, string> = { es: 'Español', en: 'Inglés' }
const idiomas = computed(() => (storyboard.value?.languages ?? [])
  .map(l => ({ value: l, label: nombresIdioma[l] ?? l.toUpperCase() })))
const jornadas = ref<JornadaFila[]>([])
const jornadaOpciones = computed(() => [
  { value: '', label: 'Sin jornada' },
  ...jornadas.value.map(j => ({ value: String(j.id), label: j.nombre })),
])

async function abrirEdicion() {
  const w = workshop.value
  if (!w) return
  Object.assign(form, {
    titulo: w.editable.titulo, fecha: w.date, horaInicio: w.editable.horaInicio, horaFin: w.editable.horaFin,
    ubicacion: w.editable.ubicacion, grupo: w.group, capacidad: w.capacity ? String(w.capacity) : '',
    idioma: w.language, modalidad: w.modalidad, jornadaId: w.editable.jornadaId ? String(w.editable.jornadaId) : '', notas: w.notes,
  })
  errorEdicion.value = ''
  editando.value = true
  const orgId = comunidadActiva.value?.organizacionId
  jornadas.value = orgId ? await useJornadas().listar(orgId) : []
}

async function guardarEdicion() {
  errorEdicion.value = ''
  if (workshop.value?.estado === 'PUBLICADO' && (!form.fecha || !form.horaInicio)) {
    errorEdicion.value = 'Un taller publicado necesita fecha y hora de inicio.'
    return
  }
  if (form.horaInicio && form.horaFin && form.horaFin <= form.horaInicio) {
    errorEdicion.value = 'La hora de fin va después de la de inicio.'
    return
  }
  enCurso.value = true
  const { error } = await actualizarTaller(workshopId, {
    ...form,
    capacidad: form.capacidad ? Number(form.capacidad) : null,
    jornadaId: form.jornadaId ? Number(form.jornadaId) : null,
  })
  enCurso.value = false
  if (error) {
    errorEdicion.value = error
    return
  }
  editando.value = false
  toast.success('Cambios guardados.')
}

// ── Educadores ───────────────────────────────────────────────────────────────
const gestionandoEducadores = ref(false)
const nuevoEducador = ref<string | number | null>('')
const educadoresDisponibles = computed(() => {
  const asignados = new Set(workshop.value?.asignados.map(a => a.id) ?? [])
  return activeEducators.value.filter(e => !asignados.has(e.id)).map(e => ({ value: e.id, label: e.nombre }))
})

async function sumarEducador() {
  if (!nuevoEducador.value) return
  if (await accion(id => asignarEducador(id, Number(nuevoEducador.value)), 'Educador asignado.')) nuevoEducador.value = ''
}

async function quitarEducador(asignacionId: number, nombre: string) {
  await accion(() => quitarAsignacion(asignacionId), `${nombre} ya no está asignado.`)
}

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

async function confirmarCancelar() {
  if (await accion(id => cancelarTaller(id, motivo.value), 'Taller cancelado.')) cancelando.value = false
}

async function confirmarReprogramar() {
  if (await accion(id => reprogramarTaller(id, nuevaFecha.value), 'Taller reprogramado y publicado.')) reprogramando.value = false
}

async function confirmarArchivar() {
  if (await accion(archivarTaller, 'Taller archivado.')) {
    archivando.value = false
    navigateTo('/dashboard/workshops')
  }
}

async function duplicar() {
  menuAbierto.value = false
  const { id, error } = await duplicarTaller(workshopId)
  if (error) {
    toast.error(error)
    return
  }
  toast.success('Taller duplicado como borrador.')
  if (id) navigateTo(`/dashboard/workshops/${id}`)
}

async function confirmarEliminar() {
  eliminandoEnCurso.value = true
  const { error } = await eliminarTaller(workshopId)
  eliminandoEnCurso.value = false
  if (error) {
    toast.error(error)
    return
  }
  eliminando.value = false
  toast.success('Taller eliminado.')
  navigateTo('/dashboard/workshops')
}
const storyboard = computed(() => workshop.value ? getStoryboard(workshop.value.storyboardId) : undefined)
const educator = computed(() => workshop.value ? getEducator(workshop.value.educatorId) : undefined)

const subtitulo = computed(() => {
  const com = comunidadActiva.value?.nombre
  const base = com ? `Comunidad ${com}`.replace('Comunidad Comunidad', 'Comunidad') : 'Tu comunidad'
  return workshop.value?.jornada ? `${base} · Jornada «${workshop.value.jornada}»` : base
})

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const formattedDate = computed(() => {
  if (!workshop.value?.date) return '—'
  const parts = workshop.value.date.split('-')
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
})

// La hora (tonoSesion) se pinta con el tono de la sesión, como en el planner y en Educators.
interface InfoItem { label: string, value: string, icon: UiIconName, tonoSesion?: boolean }
const infoBar = computed<InfoItem[]>(() => [
  { label: 'Fecha', value: formattedDate.value, icon: 'calendar' },
  { label: 'Horario', value: workshop.value?.time || '—', icon: 'clock', tonoSesion: true },
  { label: 'Ubicación', value: workshop.value?.location || '—', icon: 'map-pin' },
  { label: 'Grupo', value: [workshop.value?.group, workshop.value?.capacity ? `${workshop.value.capacity} estimados` : ''].filter(Boolean).join(' · ') || '—', icon: 'user' },
  { label: 'Modalidad', value: workshop.value ? MODALIDADES[workshop.value.modalidad].label : '—', icon: 'building' },
  { label: 'Idioma', value: workshop.value?.language.toUpperCase() || '—', icon: 'globe' },
])

const hora = (iso: string) => new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
function ejecucion(a: Workshop['asignados'][number]): string {
  if (!a.iniciadoEn) return 'Feedback sin registro de ejecución'
  return a.terminadoEn ? `De ${hora(a.iniciadoEn)} a ${hora(a.terminadoEn)}` : `Empezó a las ${hora(a.iniciadoEn)}; sin terminar`
}

</script>
