<template>
  <div v-if="workshop" class="max-w-[980px] mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-3.5 mb-6 flex-wrap">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-display font-semibold text-brand-dark tracking-[-0.01em] truncate">
            {{ workshop.title }}
          </h1>
          <UiBadge :variant="statusVariant(workshop.status)" dot class="shrink-0">
            {{ workshop.statusLabel }}
          </UiBadge>
        </div>
        <p class="text-[13px] text-gray-500 font-semibold mt-1">{{ subtitulo }}</p>
      </div>

      <div class="flex items-center gap-[9px] shrink-0">
        <button
          v-if="workshop.status === 'programado'"
          class="inline-flex items-center h-10 px-4 rounded-btn border-[1.5px] border-red-200 text-red-600 bg-white text-[13px] font-bold hover:bg-red-50 transition-colors"
          @click="cancelar"
        >
          Cancelar Taller
        </button>

        <!-- Menú ⋯ -->
        <RekaPopoverRoot v-model:open="menuAbierto">
          <RekaPopoverTrigger as-child>
            <button class="w-10 h-10 rounded-btn border-[1.5px] border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-[18px] h-[18px]">
                <path d="M12 6.75a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM12 13.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM12 20.25a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
              </svg>
            </button>
          </RekaPopoverTrigger>
          <RekaPopoverPortal>
            <RekaPopoverContent align="end" :side-offset="6" class="w-[230px] bg-white border border-gray-200 rounded-[12px] shadow-dropdown p-1.5 z-50">
              <button
                class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[9px] text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                @click="duplicar"
              >
                <svg class="w-[15px] h-[15px] text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.5a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5" />
                </svg>
                Duplicar taller
              </button>
              <div class="h-px bg-gray-100 my-1 mx-2" />
              <button
                class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[9px] text-[13px] font-bold text-red-600 hover:bg-red-50 transition-colors"
                @click="menuAbierto = false; eliminando = true"
              >
                <UiIcon name="delete" class="w-[15px] h-[15px]" />
                Eliminar taller
              </button>
              <p class="text-[11px] text-gray-400 font-semibold leading-normal mx-3 mt-1.5 mb-2">
                Cancelar mantiene el registro como CANCELADO; eliminar lo quita permanentemente.
              </p>
            </RekaPopoverContent>
          </RekaPopoverPortal>
        </RekaPopoverRoot>
      </div>
    </div>

    <!-- Card principal -->
    <div class="card overflow-hidden">
      <!-- Barra de info -->
      <div class="px-6 py-5 bg-brand-tint border-b border-gray-100">
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[18px]">
          <div v-for="info in infoBar" :key="info.label" class="flex flex-col gap-[5px]">
            <div class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" :d="info.icon" />
              </svg>
              <span class="text-[11px] text-gray-500 font-bold uppercase tracking-[0.05em]">{{ info.label }}</span>
            </div>
            <span class="text-[13px] font-extrabold text-gray-800 leading-[1.35]">{{ info.value }}</span>
          </div>
        </div>
      </div>

      <!-- Storyboard vinculado -->
      <div class="px-6 py-[22px]">
        <p class="text-[10px] font-extrabold tracking-[0.1em] uppercase text-gray-400 mb-3.5">Storyboard vinculado</p>
        <div v-if="storyboard" class="flex items-start gap-[15px]">
          <div :class="['w-[54px] h-[54px] rounded-[15px] flex items-center justify-center shrink-0', storyboard.coverBg]">
            <svg class="w-[26px] h-[26px] text-white/90" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[15px] font-extrabold text-gray-800">{{ storyboard.title }}</p>
            <p class="text-[12.5px] font-semibold text-gray-500 mt-[3px] mb-3">
              {{ storyboard.category }} · {{ storyboard.plan }} · {{ storyboard.duration }} · {{ storyboard.scenesCount }} escenas · {{ storyboard.targetAge }}
            </p>
            <a
              class="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand-primary-700 hover:text-brand-primary-800 cursor-pointer"
              @click="navigateTo('/dashboard/storyboards/' + storyboard.id)"
            >
              <svg class="w-[13px] h-[13px]" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Ver storyboard
            </a>
          </div>
        </div>
        <div v-else class="text-sm text-gray-400">Storyboard no disponible</div>
      </div>

      <!-- Educador asignado -->
      <div class="border-t border-gray-100 px-6 py-[22px]">
        <p class="text-[10px] font-extrabold tracking-[0.1em] uppercase text-gray-400 mb-3.5">Educador asignado</p>
        <div v-if="educator" class="flex items-start gap-[15px]">
          <div :class="['w-[46px] h-[46px] rounded-[14px] flex items-center justify-center text-[15px] font-extrabold text-white shrink-0', educator.avatarBg]">
            {{ educator.initials }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[14.5px] font-extrabold text-gray-800">{{ educator.nombre }}</p>
            <p class="text-[12.5px] font-semibold text-gray-500 mt-0.5 mb-3">{{ educator.profesion }}</p>
            <div class="flex flex-col gap-[7px]">
              <div class="flex items-center gap-[9px] text-[12.5px] font-semibold text-gray-600">
                <svg class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                {{ educator.email }}
              </div>
              <div class="flex items-center gap-[9px] text-[12.5px] font-semibold text-gray-600">
                <svg class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
                {{ educator.telefono }}
              </div>
            </div>
            <div v-if="educator.grupo" class="mt-3">
              <span class="inline-flex items-center text-[11.5px] font-bold px-[11px] py-1 rounded-full bg-gray-100 text-gray-600">{{ educator.grupo }}</span>
            </div>
          </div>
        </div>
        <div v-else class="text-sm text-gray-400">Educador no asignado</div>

        <!-- El taller puede tener VARIOS asignados (directos o vía grupo) -->
        <div v-if="workshop.asignados.length > 1" class="mt-4 flex items-center gap-2 flex-wrap">
          <span class="text-[11px] text-gray-400 font-bold uppercase tracking-[0.05em]">También asignados:</span>
          <span
            v-for="a in workshop.asignados.slice(1)"
            :key="a.id"
            class="inline-flex items-center gap-1.5 text-[11.5px] font-bold px-[11px] py-1 rounded-full bg-gray-100 text-gray-600"
          >
            {{ a.nombre }}<template v-if="a.grupo"> · {{ a.grupo }}</template>
          </span>
        </div>
      </div>

      <!-- Notas -->
      <div v-if="workshop.notes" class="border-t border-gray-100 px-6 py-[22px]">
        <p class="text-[10px] font-extrabold tracking-[0.1em] uppercase text-gray-400 mb-3">Notas</p>
        <p class="text-[13.5px] text-gray-600 font-semibold leading-[1.65]">{{ workshop.notes }}</p>
      </div>
    </div>

    <!-- Eliminar: permanente, se confirma en serio -->
    <UiConfirmDialog
      :open="eliminando"
      title="Eliminar Taller"
      confirm-label="Eliminar Definitivamente"
      :loading="eliminandoEnCurso"
      @update:open="(v) => eliminando = v"
      @confirm="confirmarEliminar"
    >
      <p>Esta acción es permanente y no se puede deshacer. Se eliminará "{{ workshop.title }}" junto con sus asignaciones de educadores. Si solo quieres suspenderlo, usa "Cancelar Taller".</p>
    </UiConfirmDialog>
  </div>

  <!-- Cargando (la lista llega async al refrescar la página) -->
  <div v-else-if="cargando" class="card p-10 text-center text-sm text-gray-400">Cargando…</div>

  <!-- Not Found -->
  <div v-else class="card p-16 flex flex-col items-center justify-center text-center">
    <div class="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
      <svg class="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
      </svg>
    </div>
    <h3 class="font-display font-semibold text-brand-dark text-lg mb-2">Taller no encontrado</h3>
    <p class="text-sm text-gray-400 max-w-sm leading-relaxed">
      El taller que buscas no existe o ha sido eliminado.
    </p>
    <UiButton variant="outline" size="sm" class="mt-5" @click="navigateTo('/dashboard/workshops')">
      Volver a Talleres
    </UiButton>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const { getWorkshop, statusVariant, loading: cargando, cancelarTaller, duplicarTaller, eliminarTaller } = useWorkshops()
const { getStoryboard } = useStoryboards()
const { getEducator } = useEducators()
const { comunidadActiva } = useContexto()
const { toast } = useToast()

const menuAbierto = ref(false)
const eliminando = ref(false)
const eliminandoEnCurso = ref(false)

const workshopId = Number(route.params.id)
const workshop = computed(() => getWorkshop(workshopId))

async function cancelar() {
  const { error } = await cancelarTaller(workshopId)
  if (error) {
    toast.error(error)
    return
  }
  toast.success('Taller cancelado.')
}

async function duplicar() {
  menuAbierto.value = false
  const { id, error } = await duplicarTaller(workshopId)
  if (error) {
    toast.error(error)
    return
  }
  toast.success('Taller duplicado como borrador.')
  if (id) navigateTo(`/dashboard/workshops/${id}`)
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
  toast.success('Taller eliminado.')
  navigateTo('/dashboard/workshops')
}
const storyboard = computed(() => workshop.value ? getStoryboard(workshop.value.storyboardId) : undefined)
const educator = computed(() => workshop.value ? getEducator(workshop.value.educatorId) : undefined)

const subtitulo = computed(() => {
  const com = comunidadActiva.value?.nombre
  return com ? `Comunidad ${com}`.replace('Comunidad Comunidad', 'Comunidad') : 'Tu comunidad'
})

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const formattedDate = computed(() => {
  if (!workshop.value?.date) return '—'
  const parts = workshop.value.date.split('-')
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
})

const infoBar = computed(() => [
  { label: 'Fecha', value: formattedDate.value, icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5' },
  { label: 'Horario', value: workshop.value?.time || '—', icon: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
  { label: 'Ubicación', value: workshop.value?.location || '—', icon: 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z' },
  { label: 'Capacidad', value: workshop.value?.capacity ? `${workshop.value.capacity} participantes` : '—', icon: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z' },
  { label: 'Modalidad', value: workshop.value?.modalidad === 'ASIGNADO' ? 'Asignado' : 'Presencial', icon: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21' },
])
</script>
