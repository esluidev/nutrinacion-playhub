<template>
  <!-- El panel de una jornada, desde su banda en el planificador: su lugar, sus días, la descripción,
       sus talleres (día, hora, detalle del lugar y educador) y las acciones. «Agregar taller» abre
       el asistente con la jornada y su primer día puestos; «Eliminar jornada» deja sus talleres
       sueltos y se confirma en coral. -->
  <UiDialog :open="!!jornada" :title="jornada?.nombre" size="lg" @update:open="(v) => { if (!v) emit('close') }">
    <template v-if="jornada">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div class="flex items-start gap-2.5">
          <UiIcon name="map-pin" class="mt-0.5 size-4 shrink-0 text-subtle" />
          <div class="min-w-0">
            <p class="eyebrow">{{ t('planner.jLocation') }}</p>
            <p class="text-body font-extrabold text-ink">{{ jornada.ubicacion }}</p>
          </div>
        </div>
        <div class="flex items-start gap-2.5">
          <UiIcon name="calendar" class="mt-0.5 size-4 shrink-0 text-subtle" />
          <div class="min-w-0">
            <p class="eyebrow">{{ t('planner.jDates') }} · {{ tCount(t, 'planner.jDays', diasDeJornada(jornada)) }}</p>
            <p class="text-body font-extrabold text-ink">{{ rangoJornada(jornada, locale) }}</p>
          </div>
        </div>
      </div>

      <p v-if="jornada.descripcion" class="ui-text mt-4">{{ jornada.descripcion }}</p>

      <!-- Sus talleres: cada uno con el tono de su sesión -->
      <div class="mt-5 border-t border-line pt-4">
        <div class="mb-2 flex items-center justify-between gap-3">
          <p class="eyebrow">{{ t('planner.jWorkshops') }} · {{ talleres.length }}</p>
          <UiButton size="sm" icon="plus" @click="agregarTaller">{{ t('planner.jAddWorkshop') }}</UiButton>
        </div>
        <p v-if="!talleres.length" class="ui-caption py-3">{{ t('planner.jNoWorkshops') }}</p>
        <ul v-else class="divide-y divide-line">
          <li
            v-for="w in talleres"
            :key="w.id"
            :data-tone="w.tone"
            class="flex cursor-pointer items-center gap-3 py-2.5 transition-colors hover:bg-canvas"
            @click="navigateTo(`/organizacion/workshops/${w.id}`)"
          >
            <span class="ui-time ui-time-sm w-14">
              <span>{{ diaCorto(w.fecha) }}</span>
              <strong>{{ diaNumero(w.fecha) }}</strong>
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-body font-extrabold text-ink">{{ w.title }}</p>
              <p class="ui-caption mt-0.5 truncate">
                <span class="font-extrabold tabular-nums text-(--tone-strong)">{{ w.time || t('planner.noTime') }}</span><template v-if="w.detalle"> · {{ w.detalle }}</template> · {{ w.educator }}
              </p>
            </div>
          </li>
        </ul>
      </div>
    </template>

    <!-- Eliminar va neutro: el coral queda para su confirmación (DESIGN.md, «Roles de color») -->
    <template #actions>
      <UiButton variant="outline" icon="trash" @click="eliminando = true">{{ t('planner.jDelete') }}</UiButton>
      <UiButton variant="outline" icon="pencil" @click="emit('editar')">{{ t('planner.jEditTitle') }}</UiButton>
    </template>
  </UiDialog>

  <!-- Eliminar: los talleres se quedan, sueltos -->
  <UiConfirmDialog
    :open="eliminando"
    :title="t('planner.jDeleteTitle')"
    :confirm-label="t('planner.jDelete')"
    :loading="enCurso"
    @update:open="(v) => eliminando = v"
    @confirm="confirmarEliminar"
  >
    <p>{{ avisoEliminar }}</p>
  </UiConfirmDialog>
</template>

<script setup lang="ts">
import type { JornadaFila } from '~/composables/useJornadas'
import { diasDeJornada, rangoJornada } from '~/utils/jornadas'

const props = defineProps<{ jornada: JornadaFila | null }>()
const emit = defineEmits<{ close: [], editar: [] }>()

const { t, locale } = useT()
const { toast } = useToast()
const { workshopsDeJornada, eliminarJornada } = usePlanner()

const talleres = computed(() => (props.jornada ? workshopsDeJornada(props.jornada.id) : []))

const idioma = computed(() => (locale.value === 'en' ? 'en-US' : 'es-ES'))
const diaCorto = (f: string) => (f ? aFecha(f).toLocaleDateString(idioma.value, { weekday: 'short' }).replace('.', '').toUpperCase() : '—')
const diaNumero = (f: string) => (f ? String(aFecha(f).getDate()) : '—')

// Al asistente con la jornada puesta y, de fecha, su primer día o hoy si cae dentro.
function agregarTaller() {
  const j = props.jornada
  if (!j) return
  const hoy = hoyLocal()
  const fecha = hoy > j.fecha_inicio && hoy <= j.fecha_fin ? hoy : j.fecha_inicio
  emit('close')
  navigateTo(`/organizacion/workshops/new?jornada=${j.id}&fecha=${fecha}`)
}

// «Sus 3 talleres quedan sueltos» (o «Su taller queda suelto»), con el lugar de la jornada.
const avisoEliminar = computed(() => {
  const vars = { nombre: props.jornada?.nombre ?? '', n: talleres.value.length }
  return talleres.value.length === 1 ? t('planner.jDeleteWarnOne', vars) : t('planner.jDeleteWarn', vars)
})

const eliminando = ref(false)
const enCurso = ref(false)
async function confirmarEliminar() {
  if (!props.jornada) return
  enCurso.value = true
  const { error } = await eliminarJornada(props.jornada.id)
  enCurso.value = false
  if (error) { toast.error(error); return }
  eliminando.value = false
  toast.success(t('planner.jDeleted'))
  emit('close')
}
</script>
