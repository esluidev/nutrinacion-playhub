<template>
  <div>
    <UiPageHeader :title="greeting" :description="headerDesc">
      <template #actions>
        <UiButton @click="navigateTo('/dashboard/workshops/new')">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.25">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo Taller
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- Stat Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-[18px] mb-7">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="card card-hover px-6 py-[22px] flex flex-col gap-3.5"
      >
        <div class="flex items-center justify-between">
          <span class="text-[12.5px] font-bold text-[#7d8d81]">{{ stat.label }}</span>
          <div :class="['w-[34px] h-[34px] rounded-[10px] flex items-center justify-center', stat.iconBg, stat.iconColor]">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" :d="stat.icon" />
            </svg>
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-[34px] font-display font-semibold text-brand-dark leading-none">{{ stat.value }}</span>
          <span class="text-xs font-semibold text-gray-400">{{ stat.sub }}</span>
        </div>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-[22px] items-start">
      <!-- Left column (2/3) -->
      <div class="lg:col-span-2 space-y-[22px]">
        <!-- Proximos Talleres -->
        <div class="card overflow-hidden">
          <div class="px-6 py-5 flex items-center justify-between">
            <h3 class="text-base font-display font-semibold text-brand-dark">Próximos talleres</h3>
            <a class="inline-flex items-center gap-1 text-[13px] font-bold text-brand-primary-700 hover:text-brand-primary-800 cursor-pointer" @click="navigateTo('/dashboard/planner')">
              Abrir planificador
              <svg xmlns="http://www.w3.org/2000/svg" class="w-[13px] h-[13px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.25">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </a>
          </div>

          <div
            v-for="workshop in programados"
            :key="workshop.id"
            class="px-6 py-[15px] flex items-center gap-4 border-t border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
            @click="navigateTo('/dashboard/workshops/' + workshop.id)"
          >
            <div
              :class="[
                'w-[46px] h-[50px] rounded-[13px] flex flex-col items-center justify-center gap-0.5 shrink-0',
                isToday(workshop.date) ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-600',
              ]"
            >
              <span class="text-[10px] font-extrabold tracking-wide leading-none">{{ dowShort(workshop.date) }}</span>
              <span class="text-[19px] font-display font-semibold leading-tight">{{ domNum(workshop.date) }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[14.5px] font-bold text-gray-800 truncate">{{ workshop.title }}</p>
              <p class="text-[12.5px] text-gray-500 truncate mt-0.5">{{ workshop.time }} · {{ workshop.location }}</p>
            </div>
            <div class="flex items-center gap-2.5 shrink-0">
              <div :class="['w-[26px] h-[26px] rounded-full flex items-center justify-center text-[9px] font-extrabold text-white', workshop.avatarBg]">
                {{ workshop.initials }}
              </div>
              <span class="text-[12.5px] font-semibold text-gray-600 hidden sm:block">{{ workshop.educator }}</span>
            </div>
          </div>
          <div v-if="!programados.length" class="px-6 py-8 text-center text-sm text-gray-400 border-t border-gray-100">
            No hay talleres programados
          </div>
        </div>

        <!-- Completados Recientemente -->
        <div class="card overflow-hidden">
          <div class="px-6 py-5 flex items-center justify-between">
            <h3 class="text-base font-display font-semibold text-brand-dark">Completados recientemente</h3>
            <a class="text-[13px] font-bold text-brand-primary-700 hover:text-brand-primary-800 cursor-pointer" @click="navigateTo('/dashboard/workshops')">
              Ver todos
            </a>
          </div>

          <div
            v-for="workshop in completados"
            :key="workshop.id"
            class="px-6 py-[15px] flex items-center gap-4 border-t border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
            @click="navigateTo('/dashboard/workshops/' + workshop.id)"
          >
            <div class="w-[38px] h-[38px] rounded-[12px] bg-brand-primary-50 text-brand-primary-700 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.25">
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[14.5px] font-bold text-gray-800 truncate">{{ workshop.title }}</p>
              <p class="text-[12.5px] text-gray-500 truncate mt-0.5">{{ workshop.location }}</p>
            </div>
            <span class="text-[12.5px] font-semibold text-gray-500 shrink-0">{{ formatShortDate(workshop.date) }}</span>
          </div>
          <div v-if="!completados.length" class="px-6 py-8 text-center text-sm text-gray-400 border-t border-gray-100">
            No hay talleres completados
          </div>
        </div>
      </div>

      <!-- Right column (1/3) -->
      <div class="space-y-[22px]">
        <!-- Acciones Rapidas -->
        <div class="card p-[22px]">
          <h3 class="text-base font-display font-semibold text-brand-dark mb-4">Acciones rápidas</h3>
          <div class="space-y-2">
            <button
              v-for="action in quickActions"
              :key="action.label"
              class="w-full flex items-center gap-3 p-3.5 rounded-[13px] border border-gray-100 bg-brand-tint hover:border-brand-primary-200 hover:bg-brand-primary-50/60 transition-all text-left"
              @click="navigateTo(action.to)"
            >
              <div :class="['w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0', action.iconBg]">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.25">
                  <path stroke-linecap="round" stroke-linejoin="round" :d="action.icon" />
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-gray-800 font-bold text-[13.5px] leading-tight">{{ action.label }}</p>
                <p class="text-[12px] text-gray-500 mt-0.5">{{ action.sub }}</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Equipo -->
        <div class="card p-[22px]">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-display font-semibold text-brand-dark">Equipo</h3>
            <a class="text-[13px] font-bold text-brand-primary-700 hover:text-brand-primary-800 cursor-pointer" @click="navigateTo('/dashboard/educators')">
              Ver todos
            </a>
          </div>
          <div class="space-y-3.5">
            <div
              v-for="edu in teamMembers"
              :key="edu.id"
              class="flex items-center gap-3"
            >
              <div :class="['w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] font-extrabold text-white shrink-0', edu.avatarBg]">
                {{ edu.initials }}
              </div>
              <div class="min-w-0">
                <p class="text-[13.5px] font-bold text-gray-800 truncate">{{ edu.nombre }}</p>
                <p class="text-[12px] text-gray-500">{{ edu.profesion }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Estado de Talleres -->
        <div class="card p-[22px]">
          <h3 class="text-base font-display font-semibold text-brand-dark mb-4">Estado de talleres</h3>

          <!-- Segmented bar -->
          <div class="h-[9px] rounded-full flex overflow-hidden gap-0.5 mb-4 bg-gray-100">
            <div
              v-for="seg in statusSegments"
              :key="seg.status"
              :class="['h-full rounded-full', seg.color]"
              :style="{ width: (seg.percent || 0.5) + '%' }"
            />
          </div>

          <!-- Legend -->
          <div class="space-y-[9px]">
            <div
              v-for="seg in statusSegments"
              :key="'legend-' + seg.status"
              class="flex items-center justify-between text-[12.5px]"
            >
              <div class="flex items-center gap-2">
                <span :class="['w-2 h-2 rounded-full', seg.color]" />
                <span class="text-gray-600 font-semibold">{{ seg.label }}</span>
              </div>
              <span class="font-extrabold text-gray-800">{{ seg.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
function isToday(dateStr: string): boolean {
  if (!dateStr) return false
  const d = parseDate(dateStr)
  const hoy = new Date()
  return d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth() && d.getDate() === hoy.getDate()
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

const totalWorkshops = computed(() => workshops.value.length)

const teamMembers = computed(() => activeEducators.value.slice(0, 4))

const statusSegments = computed(() => {
  const statuses = [
    { status: 'programado', label: 'Programados', color: 'bg-blue-500' },
    { status: 'completado', label: 'Completados', color: 'bg-brand-primary-500' },
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
    label: 'Total de talleres',
    value: totalWorkshops.value,
    sub: 'este mes',
    icon: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25',
    iconBg: 'bg-brand-primary-50',
    iconColor: 'text-brand-primary-700',
  },
  {
    label: 'Programados',
    value: workshops.value.filter(w => w.status === 'programado').length,
    sub: 'esta semana',
    icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    label: 'Educadores activos',
    value: activeEducators.value.length,
    sub: '',
    icon: 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z',
    iconBg: 'bg-brand-secondary-50',
    iconColor: 'text-brand-secondary-600',
  },
  {
    label: 'Storyboards',
    value: storyboards.value.length,
    sub: 'disponibles',
    icon: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z',
    iconBg: 'bg-brand-purple-50',
    iconColor: 'text-brand-purple-600',
  },
])

// Quick actions
const quickActions = [
  {
    label: 'Nuevo Taller',
    sub: 'Crear y programar',
    to: '/dashboard/workshops/new',
    iconBg: 'bg-brand-primary',
    icon: 'M12 4.5v15m7.5-7.5h-15',
  },
  {
    label: 'Agregar Educador',
    sub: 'Registrar miembro del equipo',
    to: '/dashboard/educators/nuevo',
    iconBg: 'bg-brand-secondary',
    icon: 'M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z',
  },
  {
    label: 'Explorar Storyboards',
    sub: 'Biblioteca de contenido',
    to: '/dashboard/storyboards',
    iconBg: 'bg-brand-purple',
    icon: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25',
  },
]
</script>
