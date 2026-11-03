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
        <UiButton v-if="puedeEditar" variant="outline" icon="pencil" @click="abrirEdicion">{{ t('common.edit') }}</UiButton>
        <!-- Las acciones del ciclo según el estado guardado; la base rechaza lo que no cabe. -->
        <template v-if="workshop.estado === 'BORRADOR' || workshop.estado === 'EN_REVISION'">
          <UiButton v-if="workshop.estado === 'BORRADOR'" variant="outline" icon="send" @click="accion(enviarARevision, t('workshops.sentReview'))">
            {{ t('workshops.sendReview') }}
          </UiButton>
          <UiButton v-else variant="outline" icon="pencil" @click="accion(volverABorrador, t('workshops.backDraft'))">
            {{ t('workshops.backToDraft') }}
          </UiButton>
          <UiButton icon="check" @click="accion(publicarTaller, t('workshops.published'))">
            {{ t('workshops.publish') }}
          </UiButton>
        </template>
        <!-- Secundaria: una acción destructiva no es la más visible de la vista (el coral, en su confirmación) -->
        <UiButton v-else-if="workshop.estado === 'PUBLICADO'" variant="outline" icon="ban" @click="motivo = ''; cancelando = true">
          {{ t('workshops.cancel') }}
        </UiButton>
        <UiButton v-else-if="workshop.status === 'sin_realizar' || workshop.estado === 'CANCELADO'" icon="calendar" @click="nuevaFecha = ''; reprogramando = true">
          {{ t('workshops.reschedule') }}
        </UiButton>

        <!-- Menú ⋯ -->
        <RekaPopoverRoot v-model:open="menuAbierto">
          <RekaPopoverTrigger as-child>
            <UiButton variant="outline" icon="more-vertical" icon-only :label="t('workshops.more')" />
          </RekaPopoverTrigger>
          <RekaPopoverPortal>
            <RekaPopoverContent align="end" :side-offset="6" class="ui-listbox ui-listbox-floating w-60">
              <button type="button" class="ui-option justify-start gap-2.5" @click="duplicar">
                <UiIcon name="copy" class="size-4 text-subtle" />
                {{ t('workshops.duplicate') }}
              </button>
              <button v-if="puedeArchivar" type="button" class="ui-option justify-start gap-2.5" @click="menuAbierto = false; archivando = true">
                <UiIcon name="package" class="size-4 text-subtle" />
                {{ t('workshops.archive') }}
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
                  {{ t('workshops.delete') }}
                </button>
              </template>
              <p class="ui-caption mx-3 mb-2 mt-1.5">{{ t('workshops.menuHelp') }}</p>
            </RekaPopoverContent>
          </RekaPopoverPortal>
        </RekaPopoverRoot>
      </div>
    </header>

    <!-- Panel principal -->
    <div class="ui-panel overflow-hidden">
      <!-- Barra de info: la hora lleva el tono de la sesión -->
      <div class="border-b border-line px-6 py-5">
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

      <!-- La jornada: a cuál pertenece, con su lugar y sus días, y cambiarla (suelto, una en curso o
           una nueva; la fecha debe caer en sus días) -->
      <div class="flex flex-wrap items-center gap-3 border-b border-line px-6 py-4">
        <UiSymbol size="sm" icon="calendar" :tone="workshop.jornada ? 'lime' : 'neutral'" />
        <div class="min-w-0 flex-1">
          <p class="eyebrow">{{ t('workshops.fJornada') }}</p>
          <p class="text-body font-extrabold text-ink">
            <template v-if="workshop.jornada">{{ workshop.jornada.nombre }} <span class="font-bold text-muted">· {{ workshop.jornada.ubicacion }} · {{ rangoJornada(workshop.jornada, locale) }}</span></template>
            <template v-else>{{ t('workshops.noJornada') }}</template>
          </p>
        </div>
        <UiButton v-if="puedeEditar" variant="outline" size="sm" icon="pencil" @click="abrirJornada">{{ t('workshops.changeJornada') }}</UiButton>
      </div>

      <!-- Storyboard vinculado: su símbolo lleva el tono de su área educativa -->
      <div class="px-6 py-6">
        <p class="eyebrow mb-3.5">{{ t('workshops.storyboardLinked') }}</p>
        <div v-if="storyboard" class="flex items-start gap-4">
          <UiSymbol icon="book" size="md" v-bind="uiAreaAttrs(storyboard.area)" />
          <div class="min-w-0 flex-1">
            <p class="text-body font-extrabold text-ink">{{ storyboard.title }}</p>
            <p class="ui-caption mb-3 mt-0.5">
              {{ storyboard.category }} · {{ t(`storyboards.${storyboard.pertenencia}`) }} · {{ storyboard.duration }} · {{ tCount(t, 'storyboards.scenes', storyboard.scenesCount) }} · {{ storyboard.targetAge }}
            </p>
            <NuxtLink
              :to="'/organizacion/storyboards/' + storyboard.id"
              class="ui-link gap-1.5 text-caption"
              data-tone="sky"
            >
              <UiIcon name="external" class="size-3.5" />
              {{ t('workshops.viewStoryboard') }}
            </NuxtLink>
          </div>
        </div>
        <div v-else class="ui-text">{{ t('workshops.sbUnavailable') }}</div>
      </div>

      <!-- Educador asignado -->
      <div class="border-t border-line px-6 py-6">
        <div class="mb-3.5 flex items-center justify-between gap-3">
          <p class="eyebrow">{{ t('workshops.educatorAssigned') }}</p>
          <UiButton v-if="puedeEditar" variant="outline" size="sm" icon="users" @click="nuevoEducador = ''; nuevoGrupo = ''; gestionandoEducadores = true">
            {{ t('workshops.changeEducators') }}
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
        <div v-else class="ui-text">{{ t('workshops.noEducator') }}</div>

        <!-- El taller puede tener VARIOS asignados (directos o vía grupo) -->
        <div v-if="workshop.asignados.length > 1" class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span class="eyebrow">{{ t('workshops.alsoAssigned') }}</span>
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
        <p class="eyebrow mb-3.5">{{ t('workshops.execution') }}</p>
        <div class="space-y-4">
          <div v-for="a in workshop.asignados.filter(x => x.iniciadoEn || x.feedback)" :key="a.id" class="flex items-start gap-4">
            <UiAvatar :name="a.nombre" size="sm" />
            <div class="min-w-0 flex-1">
              <p class="text-body font-extrabold text-ink">{{ a.nombre }}</p>
              <p class="ui-caption mt-0.5">{{ ejecucion(a) }}</p>
              <dl v-if="a.feedback" class="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                <div><dt class="eyebrow">{{ t('workshops.rating') }}</dt><dd class="text-body font-extrabold text-ink">{{ a.feedback.calificacion }}/5</dd></div>
                <div><dt class="eyebrow">{{ t('workshops.attendees') }}</dt><dd class="text-body font-extrabold text-ink">{{ a.feedback.asistentes_reales }}</dd></div>
                <div><dt class="eyebrow">{{ t('workshops.participation') }}</dt><dd class="text-body font-extrabold text-ink">{{ t(`workshops.participacion.${a.feedback.participacion_grupo}`) }}</dd></div>
                <div><dt class="eyebrow">{{ t('workshops.clarity') }}</dt><dd class="text-body font-extrabold text-ink">{{ t(`workshops.claridad.${a.feedback.claridad_contenido}`) }}</dd></div>
                <div v-if="a.feedback.dificultades_grupo" class="col-span-2 sm:col-span-4"><dt class="eyebrow">{{ t('workshops.hardest') }}</dt><dd class="ui-text">{{ a.feedback.dificultades_grupo }}</dd></div>
                <div v-if="a.feedback.material_faltante" class="col-span-2 sm:col-span-4"><dt class="eyebrow">{{ t('workshops.missingMaterial') }}</dt><dd class="ui-text">{{ a.feedback.material_faltante }}</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- Cancelación y reprogramaciones: lo que cambió en su ciclo -->
      <div v-if="workshop.motivoCancelacion || workshop.reprogramaciones" class="border-t border-line px-6 py-6">
        <p class="eyebrow mb-3">{{ t('workshops.history') }}</p>
        <p v-if="workshop.motivoCancelacion" class="ui-text">{{ t('workshops.cancelledReason', { motivo: workshop.motivoCancelacion }) }}</p>
        <p v-if="workshop.reprogramaciones" class="ui-text">
          {{ workshop.reprogramaciones === 1 ? t('workshops.rescheduledOnce') : t('workshops.rescheduledTimes', { n: workshop.reprogramaciones }) }}
        </p>
      </div>

      <!-- Notas -->
      <div v-if="workshop.notes" class="border-t border-line px-6 py-6">
        <p class="eyebrow mb-3">{{ t('workshops.notes') }}</p>
        <p class="ui-text">{{ workshop.notes }}</p>
      </div>
    </div>

    <!-- Editar los datos (no el estado). Uno finalizado o cancelado cambia de fecha al reprogramarse. -->
    <UiDialog :open="editando" :title="t('workshops.editTitle')" size="lg" @update:open="(v) => editando = v">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UiInput v-model="form.titulo" class="sm:col-span-2" :label="t('workshops.fTitle')" :placeholder="storyboard?.title" />
        <div class="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-3">
          <!-- Con jornada, la fecha vive entre sus días (la base lo exige; para salir, «Cambiar jornada») -->
          <UiInput
            v-model="form.fecha"
            type="date"
            :label="t('workshops.fDate')"
            :min="fechaMin"
            :max="workshop.jornada?.fecha_fin"
            :disabled="!fechaEditable"
            :hint="fechaHint"
          />
          <UiInput v-model="form.horaInicio" type="time" :label="t('workshops.fStart')" />
          <UiInput v-model="form.horaFin" type="time" :label="t('workshops.fEnd')" />
        </div>
        <!-- Suelto, el lugar. Con jornada, el lugar es el suyo (encima) y aquí va el detalle -->
        <div v-if="workshop.jornada" class="sm:col-span-2">
          <p class="mb-2 flex items-center gap-2 text-body font-semibold text-muted">
            <UiIcon name="map-pin" class="size-4 shrink-0 text-subtle" />
            {{ t('wizard.jornadaPlace') }}:
            <span class="font-extrabold text-ink">{{ workshop.jornada.ubicacion }}</span>
          </p>
          <UiInput
            v-model="form.ubicacion"
            :label="t('wizard.fLocationDetail')"
            :placeholder="t('wizard.fLocationDetailPh')"
            :hint="t('wizard.fLocationEffective', { lugar: lugarDelTaller(form, workshop.jornada) })"
            optional
          />
        </div>
        <UiInput v-else v-model="form.ubicacion" :label="t('workshops.fLocation')" :placeholder="t('workshops.fLocationPh')" />
        <UiInput v-model="form.grupo" :label="t('workshops.fGroup')" :placeholder="t('workshops.fGroupPh')" />
        <UiInput v-model="form.capacidad" type="number" :label="t('workshops.fCapacity')" />
        <UiSelect v-model="form.modalidad" :options="modalidades" :label="t('workshops.fModality')" />
        <UiSelect v-if="idiomas.length > 1" v-model="form.idioma" :options="idiomas" :label="t('workshops.fLanguage')" />
        <UiTextarea v-model="form.notas" class="sm:col-span-2" :label="t('workshops.notes')" optional :rows="3" />
      </div>
      <p v-if="errorEdicion" class="field-error mt-3">{{ errorEdicion }}</p>
      <template #actions>
        <UiButton :loading="enCurso" icon="check" @click="guardarEdicion">{{ t('workshops.saveChanges') }}</UiButton>
      </template>
    </UiDialog>

    <!-- Cambiar la jornada: suelto, una en curso o una nueva (el mismo selector del asistente). La
         fecha del taller debe caer en sus días (la base lo exige): si no cabe en la elegida, se
         ofrece ampliarla; una nueva tiene que incluirla. -->
    <UiDialog :open="cambiandoJornada" :title="t('workshops.changeJornada')" size="lg" @update:open="(v) => cambiandoJornada = v">
      <p class="ui-text mb-4">{{ workshop.date ? t('workshops.changeJornadaText', { fecha: formattedDate }) : t('workshops.changeJornadaNoDate') }}</p>
      <JornadaSelector id="detalle-jornada" v-model="eleccion" :jornadas="jornadas" :fecha="workshop.date" />
      <p v-if="avisoLugar" class="ui-caption mt-4">{{ avisoLugar }}</p>
      <p v-if="errorJornada" class="field-error mt-3">{{ errorJornada }}</p>
      <template #actions>
        <UiButton :loading="enCurso" icon="check" @click="guardarJornada()">{{ t('common.save') }}</UiButton>
      </template>
    </UiDialog>

    <!-- La jornada elegida no llega a la fecha del taller: ¿se amplía? -->
    <UiConfirmDialog
      :open="!!ampliarDetalle"
      :title="ampliarDetalle ? t(ampliarDetalle.antes ? 'wizard.extendTitleFrom' : 'wizard.extendTitle', { dia: formattedShortDate }) : ''"
      tone="lime"
      symbol="calendar"
      :confirm-label="t('wizard.extendConfirm')"
      :cancel-label="t('common.cancel')"
      :loading="enCurso"
      @update:open="(v) => { if (!v) ampliarDetalle = null }"
      @confirm="guardarJornada(true)"
    >
      <p v-if="ampliarDetalle">
        {{ t('wizard.extendText', { nombre: ampliarDetalle.nombre, dias: ampliarDetalle.dias, nuevos: ampliarDetalle.nuevos }) }}
      </p>
    </UiConfirmDialog>

    <!-- Educadores: se suman y se quitan al momento, de uno en uno o un grupo entero. Uno publicado
         conserva al menos uno. -->
    <UiDialog :open="gestionandoEducadores" :title="t('workshops.educatorsTitle')" @update:open="(v) => gestionandoEducadores = v">
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
            {{ t('common.remove') }}
          </UiButton>
        </li>
        <li v-if="!workshop.asignados.length" class="ui-text py-2.5">{{ t('workshops.noAssigned') }}</li>
      </ul>
      <p v-if="workshop.estado === 'PUBLICADO' && workshop.asignados.length === 1" class="ui-caption mt-2">
        {{ t('workshops.pubNeedsEducator') }}
      </p>
      <div v-if="educadoresDisponibles.length" class="mt-5 flex items-end gap-3">
        <UiSelect v-model="nuevoEducador" :options="educadoresDisponibles" :label="t('workshops.assignTo')" :placeholder="t('workshops.pickEducator')" class="min-w-0 flex-1" />
        <UiButton :disabled="!nuevoEducador" :loading="enCurso" icon="plus" @click="sumarEducador">{{ t('workshops.assign') }}</UiButton>
      </div>
      <p v-else class="ui-caption mt-5">{{ t('workshops.noMoreEducators') }}</p>
      <!-- Un grupo entero: una asignación por miembro que aún no esté -->
      <div v-if="activeGroups.length" class="mt-4 flex items-end gap-3">
        <UiSelect v-model="nuevoGrupo" :options="gruposDisponibles" :label="t('workshops.assignGroup')" :placeholder="t('workshops.pickGroup')" class="min-w-0 flex-1" />
        <UiButton variant="outline" :disabled="!nuevoGrupo" :loading="enCurso" icon="users" @click="sumarGrupo">{{ t('workshops.assign') }}</UiButton>
      </div>
    </UiDialog>

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

    <!-- Eliminar: permanente, se confirma en serio -->
    <UiConfirmDialog
      :open="eliminando"
      :title="t('workshops.deleteTitle')"
      :confirm-label="t('workshops.deleteConfirm')"
      :loading="eliminandoEnCurso"
      @update:open="(v) => eliminando = v"
      @confirm="confirmarEliminar"
    >
      <p>{{ t('workshops.deleteWarn', { titulo: workshop.title }) }}</p>
    </UiConfirmDialog>
  </div>

  <!-- Cargando (la lista llega async al refrescar la página) -->
  <div v-else-if="cargando" class="ui-panel ui-text p-10 text-center">{{ t('common.loading') }}</div>

  <!-- Not Found -->
  <div v-else class="ui-panel">
    <UiEmptyState
      icon="alert"
      :title="t('workshops.notFound')"
      :text="t('workshops.notFoundText')"
    >
      <UiButton variant="outline" size="sm" @click="navigateTo('/organizacion/workshops')">
        {{ t('workshops.backToList') }}
      </UiButton>
    </UiEmptyState>
  </div>
</template>

<script setup lang="ts">
import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'
import { MODALIDADES } from '~/composables/useWorkshops'
import type { Modalidad, Workshop } from '~/composables/useWorkshops'
import type { EleccionJornada, JornadaFila } from '~/composables/useJornadas'
import { eleccionJornada, validarDatosJornada } from '~/composables/useJornadas'
import { ampliarJornada, fechaEnJornada, lugarDelTaller, rangoJornada } from '~/utils/jornadas'

definePageMeta({ layout: 'dashboard' })

const { t, locale } = useT()
const route = useRoute()
const {
  getWorkshop, loading: cargando, enviarARevision, volverABorrador, publicarTaller, cancelarTaller,
  reprogramarTaller, archivarTaller, duplicarTaller, eliminarTaller, actualizarTaller, cambiarJornada,
  asignarEducador, asignarGrupo, quitarAsignacion,
} = useWorkshops()
const { getStoryboard } = useStoryboards()
const { getEducator, activeEducators, activeGroups, getGroupMembers } = useEducators()
const { orgActiva } = useContexto()
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
const hoy = hoyLocal()

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
  idioma: 'es', modalidad: 'PRESENCIAL' as Modalidad, notas: '',
})
const modalidades = computed(() => MODALIDADES.map(value => ({ value, label: t(`workshops.modality.${value}`) })))
const idiomas = computed(() => (storyboard.value?.languages ?? [])
  .map(l => ({ value: l, label: t(`lang.${l}`) === `lang.${l}` ? l.toUpperCase() : t(`lang.${l}`) })))
const jornadas = ref<JornadaFila[]>([])

// La fecha de uno publicado va desde hoy; con jornada, además, dentro de sus días.
const fechaMin = computed(() => {
  const w = workshop.value
  const desde = [w?.estado === 'PUBLICADO' ? hoy : '', w?.jornada?.fecha_inicio ?? ''].sort().at(-1)
  return desde || undefined
})
const fechaHint = computed(() => {
  const w = workshop.value
  if (!fechaEditable.value) return t('workshops.fDateHint')
  if (!w?.jornada) return undefined
  return t('wizard.fDateInJornada', { nombre: w.jornada.nombre, desde: fechaCorta(w.jornada.fecha_inicio, locale.value), hasta: fechaCorta(w.jornada.fecha_fin, locale.value) })
})

async function cargarJornadas() {
  const orgId = orgActiva.value?.id
  jornadas.value = orgId ? await useJornadas().listar(orgId) : []
}

async function abrirEdicion() {
  const w = workshop.value
  if (!w) return
  Object.assign(form, {
    titulo: w.editable.titulo, fecha: w.date, horaInicio: w.editable.horaInicio, horaFin: w.editable.horaFin,
    ubicacion: w.editable.ubicacion, grupo: w.group, capacidad: w.capacity ? String(w.capacity) : '',
    idioma: w.language, modalidad: w.modalidad, notas: w.notes,
  })
  errorEdicion.value = ''
  editando.value = true
}

async function guardarEdicion() {
  errorEdicion.value = ''
  if (workshop.value?.estado === 'PUBLICADO' && (!form.fecha || !form.horaInicio)) {
    errorEdicion.value = t('workshops.pubNeedsDate')
    return
  }
  if (form.horaInicio && form.horaFin && form.horaFin <= form.horaInicio) {
    errorEdicion.value = t('workshops.endAfterStart')
    return
  }
  enCurso.value = true
  const { error } = await actualizarTaller(workshopId, {
    ...form,
    capacidad: form.capacidad ? Number(form.capacidad) : null,
  })
  enCurso.value = false
  if (error) {
    errorEdicion.value = error
    return
  }
  editando.value = false
  toast.success(t('workshops.saved'))
}

// ── La jornada ───────────────────────────────────────────────────────────────
const cambiandoJornada = ref(false)
const eleccion = ref<EleccionJornada>(eleccionJornada())
const errorJornada = ref('')
// La jornada en curso elegida no llega a la fecha del taller: lo que se pregunta antes de ampliarla.
const ampliarDetalle = ref<{ nombre: string, dias: string, nuevos: string, antes: boolean } | null>(null)

async function abrirJornada() {
  eleccion.value = eleccionJornada(workshop.value?.editable.jornadaId ?? null)
  errorJornada.value = ''
  ampliarDetalle.value = null
  cambiandoJornada.value = true
  await cargarJornadas()
}

const formattedShortDate = computed(() => (workshop.value?.date ? fechaCorta(workshop.value.date, locale.value) : ''))

// El lugar del taller al cambiar: si sale de su jornada se queda con el lugar completo; si entra
// en una desde suelto, su lugar pasa a ser el detalle (salvo que sea el mismo de la jornada).
const lugarDestino = computed(() => {
  const e = eleccion.value
  if (e.modo === 'existente') return jornadas.value.find(j => j.id === e.jornadaId)?.ubicacion ?? ''
  if (e.modo === 'nueva') return e.nueva.ubicacion
  return ''
})
const avisoLugar = computed(() => {
  const w = workshop.value
  if (!w) return ''
  const detalle = w.editable.ubicacion.trim()
  if (eleccion.value.modo === 'suelto') {
    return w.jornada ? t('workshops.jornadaPlaceKeep', { lugar: lugarDelTaller(w.editable, w.jornada) }) : ''
  }
  if (!w.jornada && detalle && detalle !== lugarDestino.value.trim()) return t('workshops.jornadaPlaceDetail', { lugar: detalle })
  return ''
})

// Guarda la elección. `ampliar`: ya se confirmó ampliar la jornada en curso hasta la fecha.
async function guardarJornada(ampliar = false) {
  const w = workshop.value
  if (!w) return
  errorJornada.value = ''
  const e = eleccion.value
  const api = useJornadas()
  // De suelto a una jornada con el mismo lugar, el detalle sobra.
  const detalle = !w.jornada && w.editable.ubicacion.trim() && w.editable.ubicacion.trim() === lugarDestino.value.trim() ? '' : undefined

  if (e.modo === 'suelto') {
    if (!w.jornada) { cambiandoJornada.value = false; return }
    await guardarCambioJornada(null, lugarDelTaller(w.editable, w.jornada))
    return
  }

  if (e.modo === 'existente') {
    const j = jornadas.value.find(x => x.id === e.jornadaId)
    if (!j) { errorJornada.value = t('jornada.pickRequired'); return }
    if (j.id === w.editable.jornadaId) { cambiandoJornada.value = false; return }
    if (w.date && !fechaEnJornada(j, w.date)) {
      const dias = ampliarJornada(j, w.date)
      if (!ampliar) {
        ampliarDetalle.value = { nombre: j.nombre, dias: rangoJornada(j, locale.value), nuevos: rangoJornada(dias, locale.value), antes: w.date < j.fecha_inicio }
        return
      }
      enCurso.value = true
      const { error } = await api.cambiarDias(j.id, dias)
      enCurso.value = false
      if (error) { ampliarDetalle.value = null; errorJornada.value = error; return }
    }
    ampliarDetalle.value = null
    await guardarCambioJornada(j.id, detalle)
    return
  }

  // Nueva: completa y con la fecha del taller dentro de sus días; se crea y el taller pasa a ella.
  const falta = validarDatosJornada(e.nueva)
  if (falta) { errorJornada.value = t(falta); return }
  const dias = { fecha_inicio: e.nueva.fecha_inicio, fecha_fin: e.nueva.fecha_fin || e.nueva.fecha_inicio }
  if (w.date && !fechaEnJornada(dias, w.date)) { errorJornada.value = t('jornada.mustIncludeDate', { fecha: formattedShortDate.value }); return }
  if (!orgActiva.value) return
  enCurso.value = true
  const { id, error } = await api.crear(orgActiva.value.id, e.nueva)
  enCurso.value = false
  if (error || !id) { errorJornada.value = error ?? ''; return }
  if (!(await guardarCambioJornada(id, detalle))) await api.descartarSiVacia(id)
}

async function guardarCambioJornada(jornadaId: number | null, ubicacion?: string) {
  enCurso.value = true
  const { error } = await cambiarJornada(workshopId, jornadaId, ubicacion)
  enCurso.value = false
  if (error) {
    errorJornada.value = error
    return false
  }
  cambiandoJornada.value = false
  toast.success(t('workshops.jornadaChanged'))
  return true
}

// ── Educadores ───────────────────────────────────────────────────────────────
const gestionandoEducadores = ref(false)
const nuevoEducador = ref<string | number | null>('')
const nuevoGrupo = ref<string | number | null>('')
const educadoresDisponibles = computed(() => {
  const asignados = new Set(workshop.value?.asignados.map(a => a.id) ?? [])
  return activeEducators.value.filter(e => !asignados.has(e.id)).map(e => ({ value: e.id, label: e.nombre }))
})
const gruposDisponibles = computed(() => activeGroups.value.map(g => ({ value: g.id, label: `${g.nombre} · ${tCount(t, 'wizard.groupMembers', getGroupMembers(g.id).length)}` })))

async function sumarEducador() {
  if (!nuevoEducador.value) return
  if (await accion(id => asignarEducador(id, Number(nuevoEducador.value)), t('workshops.assigned'))) nuevoEducador.value = ''
}

async function sumarGrupo() {
  if (!nuevoGrupo.value) return
  const grupoId = Number(nuevoGrupo.value)
  const miembros = getGroupMembers(grupoId).map(m => m.id)
  enCurso.value = true
  const { error, asignados } = await asignarGrupo(workshopId, grupoId, miembros)
  enCurso.value = false
  if (error) {
    toast.error(error)
    return
  }
  toast.success(asignados ? tCount(t, 'workshops.groupAssigned', asignados) : t('workshops.groupAllAssigned'))
  nuevoGrupo.value = ''
}

async function quitarEducador(asignacionId: number, nombre: string) {
  await accion(() => quitarAsignacion(asignacionId), t('workshops.removedEducator', { nombre }))
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
  menuAbierto.value = false
  const { id, error } = await duplicarTaller(workshopId)
  if (error) {
    toast.error(error)
    return
  }
  toast.success(t('workshops.duplicated'))
  if (id) navigateTo(`/organizacion/workshops/${id}`)
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
  toast.success(t('workshops.deleted'))
  navigateTo('/organizacion/workshops')
}
const storyboard = computed(() => workshop.value ? getStoryboard(workshop.value.storyboardId) : undefined)
const educator = computed(() => workshop.value ? getEducator(workshop.value.educatorId) : undefined)

const subtitulo = computed(() => {
  const base = orgActiva.value?.nombre ?? t('common.myOrg')
  const j = workshop.value?.jornada
  return j ? `${base} · ${t('workshops.jornadaLabel', { nombre: j.nombre, rango: rangoJornada(j, locale.value) })}` : base
})

const formattedDate = computed(() => {
  if (!workshop.value?.date) return '—'
  const s = aFecha(workshop.value.date).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
})

// La hora (tonoSesion) se pinta con el tono de la sesión, como en el planner y en Educators.
interface InfoItem { label: string, value: string, icon: UiIconName, tonoSesion?: boolean }
const infoBar = computed<InfoItem[]>(() => [
  { label: t('workshops.fDate'), value: formattedDate.value, icon: 'calendar' },
  { label: t('workshops.time'), value: workshop.value?.time || '—', icon: 'clock', tonoSesion: true },
  { label: t('workshops.fLocation'), value: workshop.value?.location || '—', icon: 'map-pin' },
  { label: t('workshops.fGroup'), value: [workshop.value?.group, workshop.value?.capacity ? t('workshops.estimated', { n: workshop.value.capacity }) : ''].filter(Boolean).join(' · ') || '—', icon: 'user' },
  { label: t('workshops.fModality'), value: workshop.value ? t(`workshops.modality.${workshop.value.modalidad}`) : '—', icon: 'building' },
  { label: t('workshops.fLanguage'), value: workshop.value?.language.toUpperCase() || '—', icon: 'globe' },
])

const hora = (iso: string) => new Date(iso).toLocaleTimeString(locale.value === 'en' ? 'en-US' : 'es', { hour: '2-digit', minute: '2-digit' })
function ejecucion(a: Workshop['asignados'][number]): string {
  if (!a.iniciadoEn) return t('workshops.execNone')
  return a.terminadoEn
    ? t('workshops.execFromTo', { desde: hora(a.iniciadoEn), hasta: hora(a.terminadoEn) })
    : t('workshops.execStarted', { hora: hora(a.iniciadoEn) })
}
</script>
