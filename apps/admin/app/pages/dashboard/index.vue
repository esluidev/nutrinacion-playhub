<template>
  <div>
    <UiPageHeader :title="greeting" :description="headerDesc">
      <template #actions>
        <UiButton icon="plus" @click="navigateTo('/dashboard/workshops/new')">
          Nuevo Taller
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- Cifras: cada símbolo lleva el tono de lo que mide (programados en cielo; el resto, neutro) -->
    <div class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div v-for="stat in stats" :key="stat.label" class="ui-panel ui-stat">
        <UiSymbol size="md" :icon="stat.icon" :tone="stat.tone" />
        <div class="min-w-0">
          <p class="flex items-baseline gap-1.5">
            <span class="ui-stat-value">{{ stat.value }}</span>
            <span v-if="stat.sub" class="ui-caption">{{ stat.sub }}</span>
          </p>
          <p class="ui-stat-label">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <!-- Left column (2/3) -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Próximos talleres: el día y la hora llevan el tono de la sesión (hoy en sol, próxima en cielo) -->
        <section class="ui-panel overflow-hidden">
          <header class="ui-panel-header">
            <h3 class="ui-title">Próximos talleres</h3>
            <NuxtLink to="/dashboard/planner" class="ui-link text-body" data-tone="sky">
              Abrir planificador
              <UiIcon name="chevron-right" class="size-3.5" />
            </NuxtLink>
          </header>

          <div class="divide-y divide-line">
            <div
              v-for="workshop in programados"
              :key="workshop.id"
              :data-tone="workshop.tone"
              class="flex cursor-pointer items-center gap-4 px-6 py-4 transition-colors hover:bg-canvas"
              @click="navigateTo('/dashboard/workshops/' + workshop.id)"
            >
              <span class="ui-time w-14">
                <span>{{ dowShort(workshop.date) }}</span>
                <strong>{{ domNum(workshop.date) }}</strong>
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-body font-extrabold text-ink">{{ workshop.title }}</p>
                <p class="ui-caption mt-0.5 truncate">
                  <span class="font-extrabold tabular-nums text-(--tone-strong)">{{ workshop.time }}</span> · {{ workshop.location }}
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-2.5">
                <UiAvatar :name="workshop.educator" :initials="workshop.initials" size="sm" />
                <span class="hidden text-caption font-semibold text-muted sm:block">{{ workshop.educator }}</span>
              </div>
            </div>
          </div>
          <p v-if="!programados.length" class="ui-caption px-6 py-8 text-center">
            No hay talleres programados
          </p>
        </section>

        <!-- Completados recientemente: lima, el tono de lo cerrado -->
        <section class="ui-panel overflow-hidden">
          <header class="ui-panel-header">
            <h3 class="ui-title">Completados recientemente</h3>
            <NuxtLink to="/dashboard/workshops" class="ui-link text-body" data-tone="sky">
              Ver todos
            </NuxtLink>
          </header>

          <div class="divide-y divide-line">
            <div
              v-for="workshop in completados"
              :key="workshop.id"
              class="flex cursor-pointer items-center gap-4 px-6 py-4 transition-colors hover:bg-canvas"
              @click="navigateTo('/dashboard/workshops/' + workshop.id)"
            >
              <UiSymbol size="md" icon="check" :tone="workshop.tone" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-body font-extrabold text-ink">{{ workshop.title }}</p>
                <p class="ui-caption mt-0.5 truncate">{{ workshop.location }}</p>
              </div>
              <span class="ui-caption shrink-0 tabular-nums">{{ formatShortDate(workshop.date) }}</span>
            </div>
          </div>
          <p v-if="!completados.length" class="ui-caption px-6 py-8 text-center">
            No hay talleres completados
          </p>
        </section>
      </div>

      <!-- Right column (1/3) -->
      <div class="space-y-6">
        <!-- Acciones rápidas: cada acceso con el tono de lo que abre, no todos en lima -->
        <section>
          <h3 class="ui-title mb-3">Acciones rápidas</h3>
          <div class="space-y-3">
            <button
              v-for="action in quickActions"
              :key="action.label"
              type="button"
              class="ui-panel ui-panel-interactive flex w-full items-center gap-3 p-4 text-left"
              @click="navigateTo(action.to)"
            >
              <UiSymbol size="md" :icon="action.icon" :tone="action.tone" />
              <span class="min-w-0 flex-1">
                <span class="block text-body font-extrabold leading-tight text-ink">{{ action.label }}</span>
                <span class="ui-caption mt-0.5 block">{{ action.sub }}</span>
              </span>
              <UiIcon name="chevron-right" class="size-4 text-subtle" />
            </button>
          </div>
        </section>

        <!-- Equipo -->
        <section class="ui-panel p-6">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="ui-title">Equipo</h3>
            <NuxtLink to="/dashboard/educators" class="ui-link text-body" data-tone="sky">
              Ver todos
            </NuxtLink>
          </div>
          <div class="space-y-3.5">
            <div
              v-for="edu in teamMembers"
              :key="edu.id"
              class="flex items-center gap-3"
            >
              <UiAvatar :name="edu.nombre" :initials="edu.initials" />
              <div class="min-w-0">
                <p class="truncate text-body font-extrabold text-ink">{{ edu.nombre }}</p>
                <p class="ui-caption">{{ edu.profesion }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Estado de talleres: los mismos tonos que los estados de sesión -->
        <section class="ui-panel p-6">
          <h3 class="ui-title mb-4">Estado de talleres</h3>

          <!-- Segmented bar -->
          <div class="mb-4 flex h-2 gap-0.5 overflow-hidden rounded-full bg-sunken">
            <div
              v-for="seg in statusSegments"
              :key="seg.status"
              :data-tone="seg.tone"
              class="h-full rounded-full bg-(--tone-mid)"
              :style="{ width: (seg.percent || 0.5) + '%' }"
            />
          </div>

          <!-- Legend -->
          <div class="space-y-2">
            <div
              v-for="seg in statusSegments"
              :key="'legend-' + seg.status"
              class="flex items-center justify-between text-caption"
            >
              <div class="flex items-center gap-2">
                <span :data-tone="seg.tone" class="size-2 rounded-full bg-(--tone-mid)" />
                <span class="font-semibold text-muted">{{ seg.label }}</span>
              </div>
              <span class="font-extrabold tabular-nums text-ink">{{ seg.count }}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UiTone } from '@playhub/ui/app/utils/ui-tones'
import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'

definePageMeta({ layout: 'dashboard' })

const { t } = useT()
const { workshops } = useWorkshops()
const { activeEducators } = useEducators()
const { storyboards } = useStoryboards()
const { comunidadActiva } = useContexto()

// Saludo por hora del día + nombre del usuario.
const nombre = computed(() => {
  if (isSupabaseConfigured()) {
    const { user } = useAuth()
    return user.value?.perfil?.nombre || ''
  }
  return ''
})
const greeting = computed(() => {
  const h = new Date().getHours()
  const saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
  return nombre.value ? `${saludo}, ${nombre.value}` : saludo
})
const headerDesc = computed(() => {
  const com = comunidadActiva.value?.nombre
  return com ? `Esto es lo que pasa en ${com} esta semana` : t('dash.dashboardDesc')
})

// Date formatting
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const DOW_UP = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']
const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function parseDate(dateStr: string) {
  const parts = dateStr.split('-')
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
}
function formatShortDate(dateStr: string): string {
  if (!dateStr) return '--'
  const d = parseDate(dateStr)
  return `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`
}
function dowShort(dateStr: string): string {
  if (!dateStr) return '—'
  return DOW_UP[parseDate(dateStr).getDay()] ?? '—'
}
function domNum(dateStr: string): string {
  if (!dateStr) return '—'
  return String(parseDate(dateStr).getDate())
}

// Computed data
const programados = computed(() =>
  workshops.value
    .filter(w => w.status === 'programado')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3),
)

const completados = computed(() =>
  workshops.value
    .filter(w => w.status === 'completado')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 2),
)

// Las cifras cuentan lo que sigue vivo (no lo archivado) en el mes y la semana en curso (lunes a domingo).
const local = (d: Date) => d.toLocaleDateString('en-CA')
const mesActual = local(new Date()).slice(0, 7)
const semana = (() => {
  const lunes = new Date()
  lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7))
  const domingo = new Date(lunes)
  domingo.setDate(lunes.getDate() + 6)
  return { desde: local(lunes), hasta: local(domingo) }
})()
const vivos = computed(() => workshops.value.filter(w => w.status !== 'archivado'))
const totalWorkshops = computed(() => vivos.value.length)
const delMes = computed(() => vivos.value.filter(w => w.date.startsWith(mesActual)).length)
const programadosSemana = computed(() => vivos.value
  .filter(w => w.status === 'programado' && w.date >= semana.desde && w.date <= semana.hasta).length)

const teamMembers = computed(() => activeEducators.value.slice(0, 4))

const statusSegments = computed(() => {
  const statuses: { status: string, label: string, tone: UiTone }[] = [
    { status: 'programado', label: 'Programados', tone: 'sky' },
    { status: 'completado', label: 'Completados', tone: 'lime' },
    { status: 'cancelado', label: 'Cancelados', tone: 'coral' },
    { status: 'borrador', label: 'Borrador', tone: 'neutral' },
  ]
  const total = totalWorkshops.value
  return statuses.map(s => {
    const count = vivos.value.filter(w => w.status === s.status).length
    return {
      ...s,
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
    }
  })
})

// Cifras: el símbolo lleva el tono de lo que mide. Programados → cielo (lo próximo); el total,
// los educadores y el catálogo no miden un estado, así que van en neutro.
interface Stat { label: string, value: number, sub: string, icon: UiIconName, tone: UiTone }
const stats = computed<Stat[]>(() => [
  {
    label: 'Talleres',
    value: delMes.value,
    sub: 'este mes',
    icon: 'clapperboard',
    tone: 'neutral',
  },
  {
    label: 'Programados',
    value: programadosSemana.value,
    sub: 'esta semana',
    icon: 'calendar',
    tone: 'sky',
  },
  {
    label: 'Educadores activos',
    value: activeEducators.value.length,
    sub: '',
    icon: 'users',
    tone: 'neutral',
  },
  {
    label: 'Storyboards',
    value: storyboards.value.length,
    sub: 'disponibles',
    icon: 'book',
    tone: 'neutral',
  },
])

// Accesos rápidos: el tono dice qué abren. Nuevo taller → cielo (crea una sesión programada);
// agregar educador → uva (le llega una invitación); explorar storyboards → neutro.
interface QuickAction { label: string, sub: string, to: string, icon: UiIconName, tone: UiTone }
const quickActions: QuickAction[] = [
  {
    label: 'Nuevo Taller',
    sub: 'Crear y programar',
    to: '/dashboard/workshops/new',
    icon: 'plus',
    tone: 'sky',
  },
  {
    label: 'Agregar Educador',
    sub: 'Registrar miembro del equipo',
    to: '/dashboard/educators/nuevo',
    icon: 'user-plus',
    tone: 'grape',
  },
  {
    label: 'Explorar Storyboards',
    sub: 'Biblioteca de contenido',
    to: '/dashboard/storyboards',
    icon: 'book',
    tone: 'neutral',
  },
]
</script>
