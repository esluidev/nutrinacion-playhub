<template>
  <!-- Talleres día por día, en la ficha de una jornada y en la de un programa (tarea 023). Cada día lleva su ficha de
       fecha a la izquierda, como un calendario (`ui-time`: «jue / 26 / nov»; hoy en sol y «Hoy», lo que viene en cielo,
       lo pasado neutro), y a la derecha sus talleres, cada uno en su tarjeta (como en el planificador): la hora en el
       tono de su sesión, el nombre, la audiencia y el espacio (o el lugar), el educador en pantallas anchas y el estado;
       cada una abre su ficha. Con `agregar`, debajo de las tarjetas de cada día va un hueco para agregar otro ese día.
       En el teléfono la hora va encima del nombre y el estado debajo, para que el nombre no se corte. Los talleres sin fecha van al final. Los días se arman con `talleresPorDia` (utils/jornadas). -->
  <div class="divide-y divide-line">
    <div v-for="d in grupos" :key="d.clave" class="flex gap-3 px-4 py-4 sm:gap-4 sm:px-6">
      <span
        class="ui-time w-16 self-start"
        :data-tone="tonoDelDia(d.fecha)"
        :aria-current="d.fecha === hoy ? 'date' : undefined"
        :title="d.fecha ? tituloDelDia(d.fecha) : undefined"
      >
        <template v-if="d.fecha">
          <span>{{ d.fecha === hoy ? t('common.today') : diaDeLaSemana(d.fecha) }}</span>
          <strong>{{ Number(d.fecha.slice(8, 10)) }}</strong>
          <span>{{ mes(d.fecha) }}</span>
        </template>
        <template v-else>
          <strong>—</strong>
          <span>{{ t('workshops.noDate') }}</span>
        </template>
      </span>

      <!-- Cada taller es su tarjeta, la del planificador: blanca, con su base porque se pulsa, la franja de su tono a la
           izquierda y, si aún no está publicado (borrador, en revisión), el borde discontinuo. Apiladas como en una
           bandeja, con el hueco para agregar al final. -->
      <div class="flex min-w-0 flex-1 flex-col gap-3">
        <NuxtLink
          v-for="w in d.talleres"
          :key="w.id"
          :to="`/organizacion/workshops/${w.id}`"
          :data-tone="w.tone"
          :class="[
            'ui-panel ui-panel-interactive relative flex items-center gap-4 overflow-hidden rounded-control py-3 pl-5 pr-4',
            sinPublicar(w) && 'border-dashed border-line-strong',
          ]"
        >
          <span class="absolute inset-y-0 left-0 w-1 bg-(--tone-fill)" aria-hidden="true" />
          <span class="hidden w-28 shrink-0 whitespace-nowrap text-body font-extrabold tabular-nums text-(--tone-strong) sm:block">{{ hora(w.time) }}</span>
          <div class="min-w-0 flex-1">
            <p class="text-caption font-extrabold tabular-nums text-(--tone-strong) sm:hidden">{{ hora(w.time) }}</p>
            <p class="truncate text-body font-extrabold text-ink">{{ w.title }}</p>
            <p v-if="detalle(w)" class="ui-caption truncate">{{ detalle(w) }}</p>
            <UiBadge :tone="w.tone" dot class="mt-1.5 whitespace-nowrap sm:hidden">{{ w.statusLabel }}</UiBadge>
          </div>
          <div class="hidden w-44 min-w-0 shrink-0 items-center gap-2.5 2xl:flex">
            <template v-if="w.asignados.length">
              <UiAvatar :name="w.educator" :initials="w.initials" size="sm" />
              <span class="truncate text-body font-semibold text-muted">{{ w.educator }}</span>
            </template>
            <span v-else class="text-body font-semibold text-subtle">{{ t('workshops.unassigned') }}</span>
          </div>
          <UiBadge :tone="w.tone" dot class="hidden shrink-0 whitespace-nowrap sm:inline-flex">{{ w.statusLabel }}</UiBadge>
        </NuxtLink>

        <NuxtLink v-if="d.fecha && agregar?.(d.fecha)" :to="agregar(d.fecha)!" class="ui-slot">
          <UiIcon name="plus" />
          {{ t('planner.add') }}
        </NuxtLink>
        <p v-else-if="!d.talleres.length" class="ui-caption py-3">{{ t('jornadas.dayNone') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Workshop } from '~/composables/useWorkshops'

const props = defineProps<{
  dias: { fecha: string, talleres: Workshop[] }[]
  sinDia?: Workshop[]
  // El enlace para agregar un taller ese día, o nada si ese día no se agrega (ya pasó).
  agregar?: (fecha: string) => string | undefined
  // Debajo del nombre, el lugar y el espacio (en un programa); si no, solo el espacio (en una jornada todos van al mismo
  // lugar).
  conLugar?: boolean
}>()

const { t, locale } = useT()
const hoy = hoyLocal()
const loc = computed(() => (locale.value === 'en' ? 'en-US' : 'es-ES'))

const grupos = computed(() => [
  ...props.dias.map(d => ({ clave: d.fecha, fecha: d.fecha, talleres: d.talleres })),
  ...(props.sinDia?.length ? [{ clave: 'sin-dia', fecha: '', talleres: props.sinDia }] : []),
])

function tonoDelDia(fecha: string): string {
  if (!fecha || fecha < hoy) return 'neutral'
  return fecha === hoy ? 'sun' : 'sky'
}
function diaDeLaSemana(fecha: string): string {
  return aFecha(fecha).toLocaleDateString(loc.value, { weekday: 'short' }).replace('.', '')
}
function mes(fecha: string): string {
  return aFecha(fecha).toLocaleDateString(loc.value, { month: 'short' }).replace('.', '')
}
// «jueves, 26 de noviembre de 2026», para quien pasa el ratón o usa un lector
function tituloDelDia(fecha: string): string {
  return aFecha(fecha).toLocaleDateString(loc.value, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
// Lo que el educador aún no ve: borde discontinuo, como en el planificador.
function sinPublicar(w: Workshop): boolean {
  return w.estado === 'BORRADOR' || w.estado === 'EN_REVISION'
}
function hora(time: string): string {
  return time ? time.replace(' - ', ' – ') : t('planner.noTime')
}
function detalle(w: Workshop): string {
  const donde = props.conLugar ? (w.location === '—' ? '' : w.location) : w.editable.espacio
  return [w.audiencia, donde].filter(Boolean).join(' · ')
}
</script>
