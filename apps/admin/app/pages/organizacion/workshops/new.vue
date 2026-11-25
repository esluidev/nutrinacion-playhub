<template>
  <!-- «Nuevo Taller» en una sola tarjeta (tarea 023): sus secciones a la vista y en el orden en que se piensan (nombre,
       storyboard, educadores, cuándo y dónde, audiencia), cada una con su marca y lo que le falta en su cabecera. El
       storyboard y los educadores se eligen en su diálogo (uno solo, desde la página); lo demás, ahí mismo. Abajo,
       cómo se guarda: «Publicar» (la principal) lo pide todo y, si falta algo, baja a la primera sección incompleta y
       marca sus campos; «Guardar como Borrador» y «Enviar a Revisión» solo necesitan el storyboard. Entra con
       `?storyboard=`, `?fecha=`, `?programa=` o `?jornada=&fecha=` (useWorkshopWizard). -->
  <div class="mx-auto max-w-[980px]">
    <header class="ui-page-header">
      <div class="min-w-0 flex-1">
        <h1 class="ui-heading">{{ t('workshops.newTitle') }}</h1>
        <p class="ui-text mt-1.5">{{ t('workshops.newDesc') }}</p>
      </div>
    </header>

    <!-- Hecho: lima. Con jornada, lo siguiente suele ser otro taller de la misma jornada -->
    <div v-if="isSuccess" class="ui-panel px-6 py-16 text-center">
      <UiSymbol tone="lime" size="xl" class="animate-bounce-once mx-auto mb-5">
        <UiIcon name="check" class="animate-draw-check" />
      </UiSymbol>
      <h2 class="ui-title mb-2">{{ t('wizard.successTitle') }}</h2>
      <p class="ui-text mb-8">{{ t('wizard.successText') }}</p>
      <div class="mx-auto flex max-w-3xl flex-col flex-wrap items-center justify-center gap-3 sm:flex-row">
        <UiButton v-if="ultimo?.jornadaId" icon="plus" class="w-full sm:w-auto" @click="agregarOtro">{{ t('wizard.addAnother') }}</UiButton>
        <UiButton :variant="ultimo?.jornadaId ? 'outline' : 'primary'" class="w-full sm:w-auto" @click="navigateTo('/organizacion/planner')">{{ t('wizard.goPlanner') }}</UiButton>
        <UiButton variant="outline" class="w-full sm:w-auto" @click="navigateTo('/organizacion/workshops')">{{ t('wizard.viewWorkshops') }}</UiButton>
      </div>
    </div>

    <div v-else class="ui-panel overflow-hidden">
      <!-- 1 · Nombre: lo primero, para reconocerlo. Sigue al storyboard mientras no se escriba otro -->
      <TallerSeccion id="nombre" :numero="1" :titulo="t('wizard.secName')" :completa="!faltas.nombre.length" :falta="falta('nombre')" :marcar="intentado">
        <UiInput
          id="taller-nombre"
          v-model="state.title"
          :label="t('wizard.fName')"
          :placeholder="t('wizard.fTitlePh')"
          :hint="t('wizard.fNameHint')"
          :error="intentado && !state.title.trim() ? t('wizard.errName') : undefined"
          required
        />
      </TallerSeccion>

      <!-- 2 · Storyboard: elegido en una línea con «Cambiar», o el hueco para elegirlo -->
      <TallerSeccion id="storyboard" :numero="2" :titulo="t('wizard.stepStoryboard')" :completa="!faltas.storyboard.length" :falta="falta('storyboard')" :marcar="intentado" class="border-t border-line">
        <template v-if="selectedStoryboard" #accion>
          <button type="button" class="ui-link text-caption" data-tone="sky" @click="eligiendoStoryboard = true">{{ t('wizard.change') }}</button>
        </template>
        <div v-if="selectedStoryboard" class="flex items-center gap-4">
          <UiSymbol icon="book" size="md" v-bind="uiAreaAttrs(selectedStoryboard.area)" />
          <div class="min-w-0">
            <p class="text-body font-extrabold text-ink">{{ selectedStoryboard.title }}</p>
            <p class="ui-caption mt-0.5">{{ [selectedStoryboard.category, selectedStoryboard.targetAge, selectedStoryboard.duration, tCount(t, 'storyboards.scenes', selectedStoryboard.scenesCount)].join(' · ') }}</p>
          </div>
        </div>
        <button v-else type="button" class="ui-slot" @click="eligiendoStoryboard = true">
          <UiIcon name="book" />
          {{ t('wizard.pickStoryboard') }}
        </button>
      </TallerSeccion>

      <!-- 3 · Educadores: los elegidos (o el grupo, con sus miembros) con «Cambiar», o el hueco para elegirlos -->
      <TallerSeccion id="educadores" :numero="3" :titulo="t('wizard.stepEducators')" :completa="!faltas.educadores.length" :falta="falta('educadores')" :marcar="intentado" class="border-t border-line">
        <template v-if="hayEducadores" #accion>
          <button type="button" class="ui-link text-caption" data-tone="sky" @click="eligiendoEducadores = true">{{ t('wizard.change') }}</button>
        </template>
        <div v-if="state.educatorMode === 'individual' && selectedEducators.length" class="flex flex-wrap gap-x-6 gap-y-3">
          <div v-for="edu in selectedEducators" :key="edu.id" class="flex min-w-0 items-center gap-3">
            <UiAvatar :name="edu.nombre" :initials="edu.initials" />
            <div class="min-w-0">
              <p class="truncate text-body font-extrabold text-ink">{{ edu.nombre }}</p>
              <p class="ui-caption mt-px truncate">{{ edu.profesion }}</p>
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
        <p v-if="intentado && hayEducadores && faltas.educadores.length" class="field-error mt-2">{{ t('wizard.groupEmpty') }}</p>
      </TallerSeccion>

      <!-- 4 · Cuándo y dónde: ahí mismo -->
      <TallerSeccion id="cuando" :numero="4" :titulo="t('wizard.stepWhen')" :completa="!faltas.cuando.length" :falta="falta('cuando')" :marcar="intentado" class="border-t border-line">
        <TallerCuandoDonde />
      </TallerSeccion>

      <!-- 5 · Audiencia: ahí mismo -->
      <TallerSeccion id="audiencia" :numero="5" :titulo="t('wizard.stepAudience')" :completa="!faltas.audiencia.length" :falta="falta('audiencia')" :marcar="intentado" class="border-t border-line">
        <TallerAudiencia />
      </TallerSeccion>

      <!-- Pie: solo cómo se guarda. «Publicar» va activo: si falta algo, lleva a la primera sección incompleta -->
      <div class="ui-panel-footer flex flex-wrap items-center justify-end gap-3">
        <UiButton variant="outline" :disabled="isSubmitting" :loading="guardando === 'BORRADOR'" @click="guardar('BORRADOR')">{{ t('wizard.saveDraft') }}</UiButton>
        <UiButton variant="outline" :disabled="isSubmitting" :loading="guardando === 'EN_REVISION'" @click="guardar('EN_REVISION')">{{ t('wizard.sendReview') }}</UiButton>
        <UiButton icon="check" :disabled="isSubmitting" :loading="guardando === 'PUBLICADO'" @click="guardar('PUBLICADO')">{{ t('wizard.publish') }}</UiButton>
      </div>
    </div>

    <TallerStoryboardDialog v-model:open="eligiendoStoryboard" />
    <TallerEducadoresDialog v-model:open="eligiendoEducadores" />
  </div>
</template>

<script setup lang="ts">
import type { WizardEstado } from '~/composables/useWorkshopWizard'
import type { SeccionTaller } from '~/utils/nuevoTaller'
import { enumerar } from '~/utils/nuevoTaller'

definePageMeta({ layout: 'dashboard' })

const { t } = useT()
const { toast } = useToast()
const { getGroupMembers } = useEducators()
const {
  state, intentado, faltas, primeraSinCompletar, isSubmitting, isSuccess, ultimo,
  selectedStoryboard, selectedEducators, selectedGroups,
  comprobarFecha, submit, resetWizard, vigilarJornada,
} = useWorkshopWizard()

// Los vigilantes de la jornada viven con la página.
vigilarJornada()

const eligiendoStoryboard = ref(false)
const eligiendoEducadores = ref(false)
const hayEducadores = computed(() => (state.value.educatorMode === 'group' ? selectedGroups.value.length : selectedEducators.value.length) > 0)

// El nombre sale del storyboard si aún no tiene (también cuando el storyboard llega ya elegido, con `?storyboard=`).
watch(selectedStoryboard, (sb) => {
  if (sb && !state.value.title.trim()) state.value.title = sb.title
}, { immediate: true })

// Lo que le falta a una sección, en su cabecera: «Falta elegir», «Faltan el día y la hora», «La fecha cae fuera del
// programa».
function falta(seccion: SeccionTaller): string {
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

// Cómo se guarda. Publicar lo pide todo: si falta algo, se marca y la página baja a la primera sección incompleta; una
// fecha fuera de la jornada pregunta antes si se amplía. Borrador y revisión solo necesitan el storyboard.
const guardando = ref<WizardEstado | null>(null)
async function guardar(estado: WizardEstado) {
  if (estado === 'PUBLICADO') {
    intentado.value = true
    const primera = primeraSinCompletar.value
    if (primera) { irA(primera); return }
    if (!comprobarFecha()) return
  }
  else if (!state.value.storyboardId) {
    toast.error(t('wizard.errStoryboardToSave'))
    eligiendoStoryboard.value = true
    return
  }
  state.value.estado = estado
  guardando.value = estado
  const r = await submit()
  guardando.value = null
  if (r) {
    isSuccess.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Otro taller en la misma jornada: la tarjeta de nuevo, con la jornada y el día del recién creado.
async function agregarOtro() {
  const u = ultimo.value
  if (!u?.jornadaId) return
  await navigateTo({ path: '/organizacion/workshops/new', query: { jornada: String(u.jornadaId), fecha: u.fecha } })
  resetWizard()
}

onMounted(() => {
  resetWizard()
})
</script>

<style scoped>
@keyframes bounce-once {
  0% { transform: scale(0); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

@keyframes draw-check {
  0% { stroke-dashoffset: 30; }
  100% { stroke-dashoffset: 0; }
}

.animate-bounce-once {
  animation: bounce-once 0.5s ease-out;
}

.animate-draw-check {
  stroke-dasharray: 30;
  animation: draw-check 0.5s ease-out 0.2s forwards;
  stroke-dashoffset: 30;
}
</style>
