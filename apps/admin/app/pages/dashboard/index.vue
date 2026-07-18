<template>
  <div>
    <!-- Stat Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="card p-4 relative overflow-hidden"
      >
        <div :class="['absolute top-0 left-0 w-full h-1', stat.accentColor]" />
        <div class="flex items-center justify-between mb-3">
          <div :class="['w-8 h-8 rounded-lg flex items-center justify-center', stat.iconBg]">
            <svg xmlns="http://www.w3.org/2000/svg" :class="['w-4 h-4', stat.iconColor]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" :d="stat.icon" />
            </svg>
          </div>
        </div>
        <p class="text-2xl font-display font-bold text-brand-dark leading-none">{{ stat.value }}</p>
        <p class="text-xs text-gray-400 mt-1">{{ stat.label }}</p>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- Left column (2/3) -->
      <div class="lg:col-span-2 space-y-5">
        <!-- Proximos Talleres -->
        <div class="card overflow-hidden">
          <div class="px-5 py-4 flex items-center justify-between">
            <h3 class="section-title">Proximos Talleres</h3>
            <UiButton variant="ghost" size="sm" @click="navigateTo('/dashboard/planner')">
              Planner
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </UiButton>
          </div>

          <div class="divider" />

          <div v-if="programados.length > 0">
            <div
              v-for="(workshop, idx) in programados"
              :key="workshop.id"
              :class="[
                'px-5 py-3 flex items-center justify-between hover:bg-gray-50/70 transition-colors cursor-pointer',
                idx < programados.length - 1 ? 'border-b border-gray-50' : '',
              ]"
              @click="navigateTo('/dashboard/workshops/' + workshop.id)"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0', workshop.avatarBg]">
                  {{ workshop.initials }}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-brand-dark truncate">{{ workshop.title }}</p>
                  <p class="text-xs text-gray-400 truncate">{{ workshop.storyboard }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 shrink-0 ml-3">
                <div class="text-right hidden sm:block">
                  <p class="text-xs text-gray-500">{{ formatShortDate(workshop.date) }}</p>
                  <p class="text-[11px] text-gray-400">{{ workshop.time }} · {{ workshop.location }}</p>
                </div>
                <UiBadge :variant="statusVariant(workshop.status)">
                  {{ workshop.statusLabel }}
                </UiBadge>
              </div>
            </div>
          </div>
          <div v-else class="px-5 py-8 text-center text-sm text-gray-400">
            No hay talleres programados
          </div>
        </div>

        <!-- Completados Recientemente -->
        <div class="card overflow-hidden">
          <div class="px-5 py-4 flex items-center justify-between">
            <h3 class="section-title">Completados Recientemente</h3>
            <UiButton variant="ghost" size="sm" @click="navigateTo('/dashboard/workshops')">
              Ver todos
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </UiButton>
          </div>

          <div class="divider" />

          <div v-if="completados.length > 0">
            <div
              v-for="(workshop, idx) in completados"
              :key="workshop.id"
              :class="[
                'px-5 py-3 flex items-center justify-between hover:bg-gray-50/70 transition-colors cursor-pointer',
                idx < completados.length - 1 ? 'border-b border-gray-50' : '',
              ]"
              @click="navigateTo('/dashboard/workshops/' + workshop.id)"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0', workshop.avatarBg]">
                  {{ workshop.initials }}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-brand-dark truncate">{{ workshop.title }}</p>
                  <p class="text-xs text-gray-400 truncate">{{ workshop.storyboard }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 shrink-0 ml-3">
                <div class="text-right hidden sm:block">
                  <p class="text-xs text-gray-500">{{ formatShortDate(workshop.date) }}</p>
                  <p class="text-[11px] text-gray-400">{{ workshop.location }}</p>
                </div>
                <UiBadge variant="green">
                  {{ workshop.statusLabel }}
                </UiBadge>
              </div>
            </div>
          </div>
          <div v-else class="px-5 py-8 text-center text-sm text-gray-400">
            No hay talleres completados
          </div>
        </div>
      </div>

      <!-- Right column (1/3) -->
      <div class="space-y-5">
        <!-- Acciones Rapidas -->
        <div class="card p-5">
          <h3 class="section-title mb-4">Acciones Rapidas</h3>
          <div class="space-y-2">
            <button
              v-for="action in quickActions"
              :key="action.label"
              :class="[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all',
                action.hoverBg,
              ]"
              @click="navigateTo(action.to)"
            >
              <div :class="['w-8 h-8 rounded-lg flex items-center justify-center shrink-0', action.iconBg]">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" :d="action.icon" />
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-brand-dark font-semibold text-[13px] leading-tight">{{ action.label }}</p>
                <p :class="['text-[11px] font-normal mt-0.5', action.subColor]">{{ action.sub }}</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Equipo -->
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <h3 class="section-title">Equipo</h3>
              <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-secondary-50 text-[10px] font-bold text-brand-secondary-600">
                {{ activeEducators.length }}
              </span>
            </div>
            <UiButton variant="ghost" size="sm" @click="navigateTo('/dashboard/educators')">
              Ver todos
            </UiButton>
          </div>
          <div class="space-y-3">
            <div
              v-for="edu in teamMembers"
              :key="edu.id"
              class="flex items-center gap-3"
            >
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0', edu.avatarBg]">
                {{ edu.initials }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-brand-dark truncate">{{ edu.nombre }}</p>
                <p class="text-xs text-gray-400">{{ edu.profesion }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Estado de Talleres -->
        <div class="card p-5">
          <h3 class="section-title mb-4">Estado de Talleres</h3>

          <!-- Segmented bar -->
          <div v-if="totalWorkshops > 0" class="h-2.5 rounded-full flex overflow-hidden mb-4">
            <div
              v-for="seg in statusSegments"
              :key="seg.status"
              :class="seg.color"
              :style="{ width: seg.percent + '%' }"
            />
          </div>
          <div v-else class="h-2.5 rounded-full bg-gray-100 mb-4" />

          <!-- Legend -->
          <div class="space-y-2">
            <div
              v-for="seg in statusSegments"
              :key="'legend-' + seg.status"
              class="flex items-center justify-between text-xs"
            >
              <div class="flex items-center gap-2">
                <span :class="['w-2 h-2 rounded-full', seg.color]" />
                <span class="text-gray-500">{{ seg.label }}</span>
              </div>
              <span class="font-semibold text-brand-dark">{{ seg.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { workshops, statusVariant } = useWorkshops()
const { activeEducators } = useEducators()
const { storyboards } = useStoryboards()

// Date formatting
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function formatShortDate(dateStr: string): string {
  if (!dateStr) return '--'
  const parts = dateStr.split('-')
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  return `${DAY_SHORT[d.getDay()]}, ${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

// Computed data
const programados = computed(() =>
  workshops.value
    .filter(w => w.status === 'programado')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5),
)

const completados = computed(() =>
  workshops.value
    .filter(w => w.status === 'completado')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3),
)

const totalWorkshops = computed(() => workshops.value.length)

const teamMembers = computed(() => activeEducators.value.slice(0, 4))

const statusSegments = computed(() => {
  const statuses = [
    { status: 'programado', label: 'Programados', color: 'bg-blue-500' },
    { status: 'completado', label: 'Completados', color: 'bg-green-500' },
    { status: 'cancelado', label: 'Cancelados', color: 'bg-red-400' },
    { status: 'borrador', label: 'Borrador', color: 'bg-gray-300' },
  ]
  const total = totalWorkshops.value
  return statuses.map(s => {
    const count = workshops.value.filter(w => w.status === s.status).length
    return {
      ...s,
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
    }
  })
})

// Stat cards
const stats = computed(() => [
  {
    label: 'Total Talleres',
    value: totalWorkshops.value,
    icon: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25',
    iconBg: 'bg-brand-primary-50',
    iconColor: 'text-brand-primary-600',
    accentColor: 'bg-brand-primary',
  },
  {
    label: 'Programados',
    value: workshops.value.filter(w => w.status === 'programado').length,
    icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    accentColor: 'bg-blue-500',
  },
  {
    label: 'Educadores Activos',
    value: activeEducators.value.length,
    icon: 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z',
    iconBg: 'bg-brand-secondary-50',
    iconColor: 'text-brand-secondary-600',
    accentColor: 'bg-brand-secondary',
  },
  {
    label: 'Storyboards',
    value: storyboards.value.length,
    icon: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z',
    iconBg: 'bg-brand-purple-50',
    iconColor: 'text-brand-purple-600',
    accentColor: 'bg-brand-purple',
  },
])

// Quick actions
const quickActions = [
  {
    label: 'Nuevo Taller',
    sub: 'Crear y programar',
    to: '/dashboard/workshops/new',
    hoverBg: 'bg-brand-primary-50/60 hover:bg-brand-primary-50',
    iconBg: 'bg-brand-primary',
    subColor: 'text-brand-primary-600',
    icon: 'M12 4.5v15m7.5-7.5h-15',
  },
  {
    label: 'Agregar Educador',
    sub: 'Registrar miembro',
    to: '/dashboard/educators',
    hoverBg: 'bg-brand-secondary-50/60 hover:bg-brand-secondary-50',
    iconBg: 'bg-brand-secondary',
    subColor: 'text-brand-secondary-600',
    icon: 'M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z',
  },
  {
    label: 'Explorar Storyboards',
    sub: 'Biblioteca de contenido',
    to: '/dashboard/storyboards',
    hoverBg: 'bg-brand-purple-50/60 hover:bg-brand-purple-50',
    iconBg: 'bg-brand-purple',
    subColor: 'text-brand-purple-600',
    icon: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25',
  },
]
</script>
