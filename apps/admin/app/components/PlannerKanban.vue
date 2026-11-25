<template>
  <div>
    <!-- Escritorio: una sola rejilla. Cada día es una bandeja que empieza en su fecha y llega hasta abajo; hoy, en sol (el
         mismo color que «Hoy» en Educators). Debajo de las fechas, por dentro de las bandejas, una banda por jornada que
         cruza sus días, como un evento de día completo en un calendario (tinte lima, como el lugar actual de la
         navegación), con su nombre y su lugar: al pulsarla se abre su panel. Las que se cruzan van en filas distintas y
         las que no, comparten fila (filasDeBandas). Así la fecha nunca se separa de su columna. -->
    <div class="hidden lg:block">
      <div class="grid grid-cols-7 gap-x-3" :style="{ gridTemplateRows: `auto repeat(${filasDeJornadas}, auto) minmax(420px, 1fr)` }">
        <!-- La bandeja de cada día, de arriba abajo: el fondo de su fecha, sus jornadas y sus talleres -->
        <div
          v-for="(day, i) in weekDays"
          :key="'f-' + day.key"
          :class="['ui-tray', dragOverDate === day.fecha && 'is-target']"
          :data-tone="day.isToday ? 'sun' : undefined"
          :style="{ gridColumn: i + 1, gridRow: '1 / -1' }"
        />

        <header
          v-for="(day, i) in weekDays"
          :key="'h-' + day.key"
          class="relative flex items-center gap-2 px-2.5 pb-1.5 pt-2.5"
          :style="{ gridColumn: i + 1, gridRow: 1 }"
          :aria-label="day.fullName"
        >
          <span class="ui-day" :aria-current="day.isToday ? 'date' : undefined">{{ day.date }}</span>
          <span class="eyebrow">{{ day.shortName }}</span>
          <UiBadge v-if="day.isToday" tone="sun" class="ml-auto">{{ t('common.today') }}</UiBadge>
        </header>

        <!-- Cada jornada, una sola banda de punta a punta (se pulsa entera y abre su panel), que en los huecos entre
             columnas se aclara: debajo, la banda en lavado; encima, un tramo por día, de borde a borde de su bandeja, en
             el tinte de siempre. Así se lee que cruza las columnas sin cortarse ni cortar su nombre, que va encima. Se
             redondea solo donde empieza y donde termina (no si sigue en otra semana). -->
        <template v-for="b in weekBands" :key="b.jornada.id">
          <button
            type="button"
            data-tone="lime"
            :class="[
              'relative mx-2.5 mb-1.5 min-h-8 border border-(--tone-tint-edge) transition-colors',
              resaltada === b.jornada.id ? 'bg-(--nav-current)' : 'bg-(--tone-wash)',
              !b.empiezaAntes && 'rounded-l-control-sm',
              !b.sigueDespues && 'rounded-r-control-sm',
            ]"
            :style="{ gridColumn: `${b.desde} / ${b.hasta + 1}`, gridRow: b.fila + 1 }"
            :aria-label="nombreYLugar(b.jornada)"
            :title="nombreYLugar(b.jornada)"
            @mouseenter="resaltada = b.jornada.id"
            @mouseleave="resaltada = null"
            @click="emit('abrirJornada', b.jornada.id)"
          />
          <span
            v-for="d in diasDe(b)"
            :key="`${b.jornada.id}-${d}`"
            data-tone="lime"
            :class="[
              'pointer-events-none relative mb-1.5 min-h-8 border-y border-(--tone-tint-edge) transition-colors',
              resaltada === b.jornada.id ? 'bg-(--tone-tint-edge)' : 'bg-(--nav-current)',
              d === b.desde && 'ml-2.5 border-l',
              d === b.desde && !b.empiezaAntes && 'rounded-l-control-sm',
              d === b.hasta && 'mr-2.5 border-r',
              d === b.hasta && !b.sigueDespues && 'rounded-r-control-sm',
            ]"
            :style="{ gridColumn: d, gridRow: b.fila + 1 }"
            aria-hidden="true"
          />
          <span
            class="pointer-events-none relative mx-2.5 mb-1.5 flex min-w-0 items-center gap-1.5 px-2.5 text-caption font-extrabold text-ink"
            data-tone="lime"
            :style="{ gridColumn: `${b.desde} / ${b.hasta + 1}`, gridRow: b.fila + 1 }"
            aria-hidden="true"
          >
            <UiIcon :name="b.empiezaAntes ? 'chevron-left' : 'calendar'" class="size-3.5 shrink-0 text-(--tone-icon)" />
            <span class="truncate">{{ nombreYLugar(b.jornada) }}</span>
            <UiIcon v-if="b.sigueDespues" name="chevron-right" class="ml-auto size-3.5 shrink-0 text-(--tone-icon)" />
          </span>
        </template>

        <section
          v-for="(day, i) in weekDays"
          :key="day.key"
          class="ui-tray-stack relative pt-1"
          :style="{ gridColumn: i + 1, gridRow: filasDeJornadas + 2 }"
          :aria-label="day.fullName"
          @dragover.prevent="onDragOver(day.fecha)"
          @dragleave="onDragLeave"
          @drop="onDrop($event, day.fecha)"
        >
          <PlannerWorkshopCard v-for="ws in day.workshops" :key="ws.id" :workshop="ws" />
          <button type="button" class="ui-slot" @click="navigateTo('/organizacion/workshops/new?fecha=' + day.fecha)">
            <UiIcon name="plus" />
            {{ t('planner.add') }}
          </button>
        </section>
      </div>
    </div>

    <!-- Móvil: lista vertical; las jornadas del día, como etiquetas bajo su cabecera -->
    <div class="space-y-5 lg:hidden">
      <section v-for="day in weekDays" :key="'m-' + day.key" :aria-label="day.fullName">
        <header class="mb-2 flex flex-wrap items-center gap-2.5 px-1">
          <span class="ui-day" :aria-current="day.isToday ? 'date' : undefined">{{ day.date }}</span>
          <span class="eyebrow">{{ day.fullName }}</span>
          <UiBadge v-if="day.isToday" tone="sun">{{ t('common.today') }}</UiBadge>
          <span v-if="day.workshops.length > 0" class="filter-count ml-auto">{{ day.workshops.length }}</span>
          <button
            v-for="j in jornadasDe(day.fecha)"
            :key="j.id"
            type="button"
            data-tone="lime"
            class="badge w-full justify-start bg-(--nav-current) text-ink"
            @click="emit('abrirJornada', j.id)"
          >
            <UiIcon name="calendar" class="size-3.5 text-(--tone-icon)" />
            <span class="truncate">{{ nombreYLugar(j) }}</span>
          </button>
        </header>

        <div class="ui-tray" :data-tone="day.isToday ? 'sun' : undefined">
          <PlannerWorkshopCard v-for="ws in day.workshops" :key="'m-' + ws.id" :workshop="ws" />
          <button type="button" class="ui-slot" @click="navigateTo('/organizacion/workshops/new?fecha=' + day.fecha)">
            <UiIcon name="plus" />
            {{ t('planner.add') }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JornadaResumen } from '~/utils/jornadas'

const emit = defineEmits<{ abrirJornada: [id: number] }>()

const { t } = useT()
const { weekDays, weekBands, jornadasDe, moveWorkshop } = usePlanner()

// «Semana de la nutrición · Sede central»: la banda dice qué jornada es y dónde.
const nombreYLugar = (j: JornadaResumen) => `${j.nombre} · ${j.ubicacion}`

// Los días (columnas 1–7) que cruza una banda, y la jornada resaltada al pasar el puntero (todos sus tramos a la vez).
const diasDe = (b: { desde: number, hasta: number }) => Array.from({ length: b.hasta - b.desde + 1 }, (_, i) => b.desde + i)
const resaltada = ref<number | null>(null)

// Cuántas filas de jornadas lleva la semana (0 si no hay ninguna).
const filasDeJornadas = computed(() => Math.max(0, ...weekBands.value.map(b => b.fila)))

const dragOverDate = ref<string | null>(null)

function onDragOver(fecha: string) {
  dragOverDate.value = fecha
}

function onDragLeave() {
  dragOverDate.value = null
}

function onDrop(e: DragEvent, fecha: string) {
  dragOverDate.value = null
  const workshopId = Number(e.dataTransfer?.getData('text/plain'))
  if (workshopId) {
    moveWorkshop(workshopId, fecha)
  }
}
</script>
