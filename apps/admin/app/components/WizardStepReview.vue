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
        <h2 class="ui-title mb-2">Taller creado exitosamente</h2>
        <p class="ui-text mb-8">El taller ha sido programado correctamente</p>

        <div class="mx-auto flex max-w-md flex-col items-center justify-center gap-3 sm:flex-row">
          <UiButton class="w-full sm:w-auto" @click="navigateTo('/dashboard/planner')">
            Ir al Planificador
          </UiButton>
          <UiButton variant="outline" class="w-full sm:w-auto" @click="navigateTo('/dashboard/workshops')">
            Ver Talleres
          </UiButton>
        </div>
      </div>
    </Transition>

    <!-- Resumen -->
    <div v-if="!isSuccess" class="max-w-[760px] mx-auto">
      <div class="ui-panel overflow-hidden">
        <!-- Header: el estado con el tono de la sesión que se va a crear -->
        <div class="ui-panel-header">
          <div>
            <h3 class="ui-title">Resumen del taller</h3>
            <p class="ui-caption mt-0.5">Revisa los datos antes de crear el taller</p>
          </div>
          <UiBadge :tone="tone" dot>
            {{ state.estado === 'PUBLICADO' ? 'Publicado' : state.estado === 'EN_REVISION' ? 'En revisión' : 'Borrador' }}
          </UiBadge>
        </div>

        <!-- Storyboard: su símbolo con el tono de su área educativa -->
        <div class="px-6 py-5">
          <div class="mb-3.5 flex items-center justify-between">
            <span class="eyebrow">Storyboard</span>
            <button type="button" class="ui-link text-caption" data-tone="sky" @click="goToStep(1)">Editar</button>
          </div>
          <div v-if="selectedStoryboard" class="flex items-center gap-4">
            <UiSymbol
              icon="book"
              size="md"
                            v-bind="uiAreaAttrs(selectedStoryboard.area)"
            />
            <div class="min-w-0">
              <p class="text-body font-extrabold text-ink">{{ selectedStoryboard.title }}</p>
              <p class="ui-caption mt-0.5">
                {{ selectedStoryboard.category }} · {{ selectedStoryboard.pertenencia }} · {{ selectedStoryboard.duration }} · {{ selectedStoryboard.scenesCount }} escenas
              </p>
            </div>
          </div>
        </div>

        <!-- Educadores / Grupos -->
        <div class="border-t border-line px-6 py-5">
          <div class="mb-3.5 flex items-center justify-between">
            <span class="eyebrow">
              {{ state.educatorMode === 'group' ? `Grupos (${selectedGroups.length})` : `Educadores (${selectedEducators.length})` }}
            </span>
            <button type="button" class="ui-link text-caption" data-tone="sky" @click="goToStep(2)">Editar</button>
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
                  <p class="ui-caption mt-px">{{ grupo.miembros }} educadores · una asignación por educador</p>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Horario y ubicación: la hora con el tono de la sesión -->
        <div class="border-t border-line px-6 py-5">
          <div class="mb-3.5 flex items-center justify-between">
            <span class="eyebrow">Horario y ubicación</span>
            <button type="button" class="ui-link text-caption" data-tone="sky" @click="goToStep(3)">Editar</button>
          </div>
          <div class="flex flex-col gap-3">
            <div class="flex items-start gap-3">
              <UiIcon name="calendar" class="mt-px size-4 shrink-0 text-subtle" />
              <div>
                <p class="text-body font-extrabold text-ink">{{ formatDateLong(state.date) }}</p>
                <p class="ui-caption mt-0.5" :data-tone="tone">
                  <span class="font-extrabold tabular-nums text-(--tone-strong)">{{ state.timeStart || '—' }}{{ state.timeEnd ? ` – ${state.timeEnd}` : '' }}</span> · fin calculado por la duración del storyboard
                </p>
              </div>
            </div>
            <div v-if="state.location" class="flex items-center gap-3">
              <UiIcon name="map-pin" class="size-4 shrink-0 text-subtle" />
              <p class="text-body font-semibold text-muted">{{ state.location }}</p>
            </div>
            <div v-if="state.notes" class="flex items-center gap-3">
              <UiIcon name="chat" class="size-4 shrink-0 text-subtle" />
              <p class="text-body font-semibold italic text-muted">{{ state.notes }}</p>
            </div>
          </div>
        </div>

        <!-- Footer strip -->
        <div class="ui-panel-footer flex flex-wrap items-center gap-x-7 gap-y-2">
          <div class="flex items-baseline gap-2">
            <span class="text-caption font-bold text-subtle">Modalidad</span>
            <span class="text-caption font-extrabold text-muted">{{ MODALIDADES[state.modalidad].label }}</span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-caption font-bold text-subtle">Asignaciones</span>
            <span class="text-caption font-extrabold tabular-nums text-muted">{{ assignmentCount }}</span>
          </div>
          <div v-if="jornada" class="flex items-baseline gap-2">
            <span class="text-caption font-bold text-subtle">Jornada</span>
            <span class="text-caption font-extrabold text-muted">{{ jornada }}</span>
          </div>
          <div v-if="state.group" class="flex items-baseline gap-2">
            <span class="text-caption font-bold text-subtle">Grupo</span>
            <span class="text-caption font-extrabold text-muted">{{ state.group }}</span>
          </div>
          <div v-if="state.capacity" class="flex items-baseline gap-2">
            <span class="text-caption font-bold text-subtle">Asistentes estimados</span>
            <span class="text-caption font-extrabold text-muted">{{ state.capacity }}</span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-caption font-bold text-subtle">Idioma</span>
            <span class="text-caption font-extrabold text-muted">{{ state.language.toUpperCase() }}</span>
          </div>
          <div v-if="selectedStoryboard" class="flex items-baseline gap-2">
            <span class="text-caption font-bold text-subtle">Duración</span>
            <span class="text-caption font-extrabold text-muted">{{ selectedStoryboard.duration }}</span>
          </div>
        </div>
      </div>

      <!-- Nota según estado: publicado es información de lo próximo (cielo); lo demás, neutro -->
      <div class="alert mt-4" :data-tone="state.estado === 'PUBLICADO' ? 'sky' : 'neutral'">
        <UiIcon name="info" />
        <p>
          {{ state.estado === 'PUBLICADO'
            ? 'Al publicar el taller, los educadores asignados lo verán en Educators.'
            : state.estado === 'EN_REVISION'
              ? 'Queda en revisión: otra persona de la comunidad o de la organización lo confirma y lo publica.'
              : 'El borrador se guarda en Talleres; podrás completar fecha y educadores más adelante.' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MODALIDADES } from '~/composables/useWorkshops'
import type { JornadaFila } from '~/composables/useJornadas'
const { state, selectedStoryboard, selectedEducators, selectedGroups, selectedGroupsMembers, isSuccess, goToStep, formatDateLong } = useWorkshopWizard()

// La jornada elegida en el paso de programación (lista cargada ahí).
const jornadas = useState<JornadaFila[]>('wizard-jornadas', () => [])
const jornada = computed(() => jornadas.value.find(j => String(j.id) === state.value.jornadaId)?.nombre ?? '')

// Un grupo genera una asignación por cada miembro.
const assignmentCount = computed(() =>
  state.value.educatorMode === 'group' ? selectedGroupsMembers.value.length : selectedEducators.value.length,
)

// Tono de la sesión que se va a crear, igual que en la lista y el planner: programada hoy → sol,
// programada otro día → cielo, borrador → neutro.
const tone = computed(() =>
  sessionTone(state.value.estado === 'PUBLICADO' ? 'programado' : 'borrador', state.value.date),
)

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
