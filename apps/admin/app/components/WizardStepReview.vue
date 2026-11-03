<template>
  <div>
    <!-- Success State: lima, lo hecho -->
    <Transition
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
    >
      <div v-if="isSuccess" class="py-16 text-center">
        <UiSymbol tone="lime" size="xl" class="animate-bounce-once mx-auto mb-5">
          <UiIcon name="check" class="animate-draw-check" />
        </UiSymbol>
        <h2 class="ui-title mb-2">{{ t('wizard.successTitle') }}</h2>
        <p class="ui-text mb-8">{{ t('wizard.successText') }}</p>

        <div class="mx-auto flex max-w-3xl flex-col flex-wrap items-center justify-center gap-3 sm:flex-row">
          <!-- Con jornada, lo siguiente suele ser otro taller de la misma jornada -->
          <UiButton v-if="ultimo?.jornadaId" icon="plus" class="w-full sm:w-auto" @click="agregarOtro">
            {{ t('wizard.addAnother') }}
          </UiButton>
          <UiButton :variant="ultimo?.jornadaId ? 'outline' : 'primary'" class="w-full sm:w-auto" @click="navigateTo('/organizacion/planner')">
            {{ t('wizard.goPlanner') }}
          </UiButton>
          <UiButton variant="outline" class="w-full sm:w-auto" @click="navigateTo('/organizacion/workshops')">
            {{ t('wizard.viewWorkshops') }}
          </UiButton>
        </div>
      </div>
    </Transition>

    <!-- Resumen -->
    <div v-if="!isSuccess" class="max-w-[760px] mx-auto">
      <div class="ui-panel overflow-hidden">
        <!-- Header: el taller por su título; cómo queda se elige al guardar -->
        <div class="ui-panel-header">
          <div class="min-w-0">
            <h3 class="ui-title truncate">{{ state.title }}</h3>
            <p class="ui-caption mt-0.5">{{ t('wizard.summaryText') }}</p>
          </div>
        </div>

        <!-- Storyboard: su símbolo con el tono de su área educativa -->
        <div class="px-6 py-5">
          <div class="mb-3.5 flex items-center justify-between">
            <span class="eyebrow">{{ t('wizard.stepStoryboard') }}</span>
            <button type="button" class="ui-link text-caption" data-tone="sky" @click="goToStep(1)">{{ t('common.edit') }}</button>
          </div>
          <div v-if="selectedStoryboard" class="flex items-center gap-4">
            <UiSymbol icon="book" size="md" v-bind="uiAreaAttrs(selectedStoryboard.area)" />
            <div class="min-w-0">
              <p class="text-body font-extrabold text-ink">{{ selectedStoryboard.title }}</p>
              <p class="ui-caption mt-0.5">
                {{ selectedStoryboard.category }} · {{ t(`storyboards.${selectedStoryboard.pertenencia}`) }} · {{ selectedStoryboard.duration }} · {{ tCount(t, 'storyboards.scenes', selectedStoryboard.scenesCount) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Educadores / Grupos -->
        <div class="border-t border-line px-6 py-5">
          <div class="mb-3.5 flex items-center justify-between">
            <span class="eyebrow">
              {{ state.educatorMode === 'group' ? `${t('wizard.groups')} (${selectedGroups.length})` : `${t('wizard.educators')} (${selectedEducators.length})` }}
            </span>
            <button type="button" class="ui-link text-caption" data-tone="sky" @click="goToStep(2)">{{ t('common.edit') }}</button>
          </div>
          <div class="flex flex-col gap-3">
            <template v-if="selectedEducators.length > 0">
              <div v-for="edu in selectedEducators" :key="edu.id" class="flex items-center gap-3">
                <UiAvatar :name="edu.nombre" :initials="edu.initials" />
                <div class="min-w-0">
                  <p class="text-body font-extrabold text-ink">{{ edu.nombre }}</p>
                  <p class="ui-caption mt-px">{{ edu.profesion }} · {{ edu.email }}</p>
                </div>
              </div>
            </template>
            <template v-else-if="selectedGroups.length > 0">
              <div v-for="grupo in selectedGroups" :key="grupo.id" class="flex items-center gap-3">
                <UiSymbol icon="users" size="md" :tone="uiToneFor(grupo.nombre)" />
                <div class="min-w-0">
                  <p class="text-body font-extrabold text-ink">{{ grupo.nombre }}</p>
                  <p class="ui-caption mt-px">{{ tCount(t, 'wizard.groupMembers', getGroupMembers(grupo.id).length) }} · {{ t('wizard.oneAssignmentEach') }}</p>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Horario y ubicación: la hora con el tono de la sesión -->
        <div class="border-t border-line px-6 py-5">
          <div class="mb-3.5 flex items-center justify-between">
            <span class="eyebrow">{{ t('wizard.stepWhen') }}</span>
            <button type="button" class="ui-link text-caption" data-tone="sky" @click="goToStep(3)">{{ t('common.edit') }}</button>
          </div>
          <div class="flex flex-col gap-3">
            <div class="flex items-start gap-3">
              <UiIcon name="calendar" class="mt-px size-4 shrink-0 text-subtle" />
              <div>
                <p class="text-body font-extrabold text-ink">{{ formatDateLong(state.date) }}</p>
                <p class="ui-caption mt-0.5" :data-tone="tone">
                  <span class="font-extrabold tabular-nums text-(--tone-strong)">{{ state.timeStart || '—' }}{{ state.timeEnd ? ` – ${state.timeEnd}` : '' }}</span> · {{ t('wizard.endByDuration') }}
                </p>
              </div>
            </div>
            <!-- La jornada: nombre y días (nueva, o ampliada para que quepa la fecha) -->
            <div v-if="jornadaEfectiva" class="flex items-start gap-3">
              <UiIcon name="layers" class="mt-px size-4 shrink-0 text-subtle" />
              <div class="min-w-0">
                <p class="flex flex-wrap items-center gap-2 text-body font-semibold text-muted">
                  <span>{{ t('wizard.fJornada') }}: <span class="font-extrabold text-ink">{{ jornadaEfectiva.nombre }}</span></span>
                  <UiBadge v-if="jornadaEfectiva.nueva" tone="neutral">{{ t('wizard.jornadaNew') }}</UiBadge>
                </p>
                <p class="ui-caption mt-0.5">
                  {{ rangoJornada(jornadaEfectiva, locale) }}<template v-if="jornadaEfectiva.ampliada"> · {{ t('wizard.jornadaExtended') }}</template>
                </p>
              </div>
            </div>
            <!-- El lugar efectivo: el de la jornada con el detalle, o el suyo si va suelto -->
            <div v-if="lugarEfectivo" class="flex items-center gap-3">
              <UiIcon name="map-pin" class="size-4 shrink-0 text-subtle" />
              <p class="text-body font-semibold text-muted">{{ lugarEfectivo }}</p>
            </div>
            <div v-if="state.notes" class="flex items-center gap-3">
              <UiIcon name="chat" class="size-4 shrink-0 text-subtle" />
              <p class="text-body font-semibold italic text-muted">{{ state.notes }}</p>
            </div>
          </div>
        </div>

        <!-- El grupo y cómo se da, con su «Editar» (paso 4) -->
        <div class="ui-panel-footer flex flex-wrap items-center gap-x-7 gap-y-2">
          <div class="flex items-baseline gap-2">
            <span class="text-caption font-bold text-subtle">{{ t('wizard.modality') }}</span>
            <span class="text-caption font-extrabold text-muted">{{ t(`workshops.modality.${state.modalidad}`) }}</span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-caption font-bold text-subtle">{{ t('wizard.assignments') }}</span>
            <span class="text-caption font-extrabold tabular-nums text-muted">{{ assignmentCount }}</span>
          </div>
          <div v-if="state.group" class="flex items-baseline gap-2">
            <span class="text-caption font-bold text-subtle">{{ t('wizard.fGroup') }}</span>
            <span class="text-caption font-extrabold text-muted">{{ state.group }}</span>
          </div>
          <div v-if="state.capacity" class="flex items-baseline gap-2">
            <span class="text-caption font-bold text-subtle">{{ t('wizard.fCapacity') }}</span>
            <span class="text-caption font-extrabold text-muted">{{ state.capacity }}</span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-caption font-bold text-subtle">{{ t('wizard.fLanguage') }}</span>
            <span class="text-caption font-extrabold text-muted">{{ state.language.toUpperCase() }}</span>
          </div>
          <div v-if="selectedStoryboard" class="flex items-baseline gap-2">
            <span class="text-caption font-bold text-subtle">{{ t('wizard.duration') }}</span>
            <span class="text-caption font-extrabold text-muted">{{ selectedStoryboard.duration }}</span>
          </div>
          <button type="button" class="ui-link ml-auto text-caption" data-tone="sky" @click="goToStep(4)">{{ t('common.edit') }}</button>
        </div>
      </div>

      <!-- Cómo se puede guardar: los botones de abajo -->
      <div class="alert mt-4" data-tone="neutral">
        <UiIcon name="info" />
        <p>{{ t('wizard.saveNote') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t, locale } = useT()
const { getGroupMembers } = useEducators()
const { state, selectedStoryboard, selectedEducators, selectedGroups, selectedGroupsMembers, jornadaEfectiva, lugarEfectivo, isSuccess, ultimo, goToStep, formatDateLong, resetWizard } = useWorkshopWizard()

// Otro taller en la misma jornada: el asistente de nuevo, con la jornada y el día del recién creado.
async function agregarOtro() {
  const u = ultimo.value
  if (!u?.jornadaId) return
  await navigateTo({ path: '/organizacion/workshops/new', query: { jornada: String(u.jornadaId), fecha: u.fecha } })
  resetWizard()
}

// Un grupo genera una asignación por cada miembro.
const assignmentCount = computed(() =>
  state.value.educatorMode === 'group' ? selectedGroupsMembers.value.length : selectedEducators.value.length,
)

// Tono de la hora, el de una sesión programada, igual que en la lista y el planner: hoy → sol,
// otro día → cielo. Cómo queda (publicado, en revisión o borrador) se elige al guardar.
const tone = computed(() => sessionTone('programado', state.value.date))
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
