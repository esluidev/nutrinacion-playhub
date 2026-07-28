<template>
  <!-- Los controles del header usan la familia de grises FRÍOS del mock (#f4f5f7/#e9ebee,
       la del fondo de página), no los neutrales verdosos del contenido. -->
  <header class="sticky top-0 z-30 h-[60px] bg-white border-b border-[#e6e9ea] px-4 lg:px-8 flex items-center justify-between shrink-0">
    <div class="flex items-center gap-2.5 min-w-0">
      <!-- Mobile menu button -->
      <button
        class="lg:hidden w-9 h-9 rounded-[9px] flex items-center justify-center text-[#7d8d81] hover:bg-brand-bg transition-colors -ml-1.5"
        @click="$emit('toggleSidebar')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
        </svg>
      </button>

      <!-- Sidebar collapse toggle (desktop) -->
      <button
        class="hidden lg:flex w-9 h-9 rounded-[9px] items-center justify-center text-[#7d8d81] hover:bg-brand-bg hover:text-gray-700 transition-colors -ml-2"
        :title="isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'"
        @click="toggleCollapsed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-[19px] h-[19px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25v13.5m5.5-13.5h9.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5h-9.5m0-13.5a1.5 1.5 0 0 0-1.5 1.5v10.5a1.5 1.5 0 0 0 1.5 1.5m0-13.5v13.5" />
        </svg>
      </button>

      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-[13px] font-semibold text-gray-500 min-w-0">
        <span class="hidden sm:inline truncate">{{ crumbA }}</span>
        <svg class="hidden sm:block w-[13px] h-[13px] text-gray-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span class="text-gray-700 truncate">{{ crumbB }}</span>
      </div>
    </div>

    <div class="flex items-center gap-2.5">
      <!-- Search (desktop only) — command palette visual -->
      <div class="hidden md:flex items-center gap-2 bg-brand-bg rounded-[10px] px-3.5 h-[38px] w-[260px] box-border">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-[15px] h-[15px] text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <span class="text-[13px] text-gray-400">{{ t('common.search') }}…</span>
        <span class="ml-auto text-[10px] font-bold text-gray-400 bg-[#e9ebee] rounded-[5px] px-1.5 py-0.5">⌘K</span>
      </div>

      <!-- Invitaciones: UNA responsabilidad. No es una campana de "notificaciones" genéricas —
           por eso el icono es un sobre y despliega la lista en vez de teletransportarte. -->
      <RekaPopoverRoot v-model:open="invsAbierto">
        <RekaPopoverTrigger as-child>
          <button
            class="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[#7d8d81] bg-brand-bg hover:bg-[#e9ebee] transition-colors relative"
            :title="t('inbox.title')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            <span
              v-if="numPendientes"
              class="absolute top-1.5 right-[7px] min-w-[16px] h-4 px-1 bg-brand-coral text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-brand-bg"
            >
              {{ numPendientes > 9 ? '9+' : numPendientes }}
            </span>
          </button>
        </RekaPopoverTrigger>

        <RekaPopoverPortal>
          <RekaPopoverContent
            align="end"
            :side-offset="8"
            class="w-80 bg-white rounded-[14px] border border-gray-200 shadow-menu z-50 overflow-hidden p-1.5"
          >
            <div class="px-3 py-2 flex items-center justify-between">
              <p class="text-[11px] font-extrabold tracking-wider text-gray-400 uppercase">{{ t('inbox.title') }}</p>
              <NuxtLink
                to="/invitaciones"
                class="text-xs font-bold text-brand-primary-700 hover:underline"
                @click="invsAbierto = false"
              >
                {{ t('common.viewAll') }}
              </NuxtLink>
            </div>

            <p v-if="!pendientes.length" class="px-3.5 py-7 text-xs text-gray-400 text-center">
              {{ t('inbox.noPending') }}
            </p>

            <div v-else class="max-h-80 overflow-y-auto">
              <NuxtLink
                v-for="inv in pendientes.slice(0, 5)"
                :key="inv.id"
                to="/invitaciones"
                class="block px-3 py-2.5 rounded-[10px] hover:bg-gray-50 transition-colors"
                @click="invsAbierto = false"
              >
                <p class="text-sm font-bold text-gray-800 truncate">{{ tituloInv(inv) }}</p>
                <p class="text-xs text-gray-400 truncate">{{ subtituloInv(inv) }}</p>
              </NuxtLink>
            </div>
          </RekaPopoverContent>
        </RekaPopoverPortal>
      </RekaPopoverRoot>

      <!-- User Menu -->
      <div class="relative">
        <button
          class="flex items-center gap-2.5 rounded-[12px] pl-2 pr-3.5 h-[38px] bg-brand-bg hover:bg-[#e9ebee] transition-colors"
          @click="userMenuOpen = !userMenuOpen"
        >
          <div class="w-7 h-7 rounded-[8px] bg-brand-primary flex items-center justify-center shrink-0">
            <span class="text-white font-extrabold text-xs">{{ userInitial }}</span>
          </div>
          <div class="text-left hidden sm:block">
            <p class="text-[12px] font-bold text-brand-dark leading-tight">{{ userNameShort }}</p>
            <p class="text-[10px] text-gray-400 leading-tight truncate max-w-[140px]">{{ userEmail }}</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" :class="['w-3.5 h-3.5 text-gray-400 hidden sm:block transition-transform', userMenuOpen ? 'rotate-180' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        <!-- Dropdown -->
        <Transition
          enter-active-class="transition ease-out duration-150"
          enter-from-class="opacity-0 scale-95 -translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-1"
        >
          <div
            v-if="userMenuOpen"
            class="absolute right-0 top-full mt-2 w-[238px] bg-white rounded-[14px] border border-gray-200 shadow-menu p-1.5 z-50"
          >
            <div class="flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-100 mb-1.5">
              <div class="w-9 h-9 rounded-[10px] bg-brand-primary flex items-center justify-center shrink-0">
                <span class="text-white font-extrabold text-sm">{{ userInitial }}</span>
              </div>
              <div class="min-w-0">
                <p class="text-[13px] font-extrabold text-brand-dark truncate">{{ userName }}</p>
                <p class="text-[11px] text-gray-400 mt-px truncate">{{ userEmail }}</p>
              </div>
            </div>

            <button
              class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              @click="handleMenuAction('profile')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              {{ t('nav.profile') }}
            </button>

            <button
              class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              @click="handleMenuAction('help')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
              </svg>
              {{ t('nav.help') }}
            </button>

            <div class="my-1.5 border-t border-gray-100" />

            <button
              class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13px] font-bold text-red-600 hover:bg-red-50 transition-colors"
              @click="handleSignOut"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              {{ t('nav.signOut') }}
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineEmits<{
  toggleSidebar: []
}>()

const { t } = useT()
const route = useRoute()
const userMenuOpen = ref(false)
const { isCollapsed, toggleCollapsed } = useSidebar()
const { comunidadActiva, orgActiva, tipo } = useContexto()

// Invitaciones pendientes dirigidas a mi correo (estado compartido con la página /invitaciones).
// Solo con Supabase configurado: useInvitaciones() crea el cliente al invocarse. En dev sin
// backend, el header sigue renderizando (misma lógica de guarda que useAuth abajo).
const inv = isSupabaseConfigured() ? useInvitaciones() : null
const pendientes = computed(() => inv?.pendientes.value ?? [])
const tituloInv = inv?.titulo ?? (() => '')
const subtituloInv = inv?.subtitulo ?? (() => '')
const numPendientes = computed(() => pendientes.value.length)
const invsAbierto = ref(false)

if (inv) {
  const { user: authUser } = useAuth()
  watch(() => authUser.value?.email, (email) => {
    if (email) inv.refreshPendientes()
  }, { immediate: true })
}

// Close menu on route change
watch(() => route.path, () => {
  userMenuOpen.value = false
})

// Close menu on click outside
function onClickOutside(e: Event) {
  const target = e.target as HTMLElement
  if (!target.closest('.relative')) {
    userMenuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

const userName = computed(() => {
  if (isSupabaseConfigured()) {
    const { user } = useAuth()
    const p = user.value?.perfil
    const nombre = [p?.nombre, p?.apellido].filter(Boolean).join(' ').trim()
    if (nombre) return nombre
    return user.value?.email?.split('@')[0] || t('common.myOrg')
  }
  return 'Nutrinacion Demo'
})

const userEmail = computed(() => {
  if (isSupabaseConfigured()) {
    const { user } = useAuth()
    return user.value?.email || 'admin@nutrinacion.com'
  }
  return 'admin@nutrinacion.com'
})

const userInitial = computed(() => (userName.value || userEmail.value).charAt(0).toUpperCase())

// La pill muestra el nombre abreviado ("Luis R."); el dropdown, el nombre completo.
const userNameShort = computed(() => {
  const partes = userName.value.split(' ').filter(Boolean)
  if (partes.length < 2) return userName.value
  return `${partes[0]} ${partes[1]!.charAt(0).toUpperCase()}.`
})

const pages: Record<string, { titleKey: string }> = {
  '/dashboard': { titleKey: 'nav.dashboard' },
  '/dashboard/storyboards': { titleKey: 'nav.storyboards' },
  '/dashboard/workshops': { titleKey: 'nav.workshops' },
  '/dashboard/workshops/new': { titleKey: 'dash.newWorkshop' },
  '/dashboard/planner': { titleKey: 'nav.planner' },
  '/dashboard/educators': { titleKey: 'nav.educators' },
  '/dashboard/colaboradores': { titleKey: 'nav.collaborators' },
  '/dashboard/configuracion': { titleKey: 'nav.settings' },
  '/dashboard/perfil': { titleKey: 'nav.profile' },
  '/organizacion/comunidades': { titleKey: 'nav.communities' },
  '/organizacion/administradores': { titleKey: 'nav.admins' },
  '/platform/organizaciones': { titleKey: 'nav.organizations' },
  '/platform/licencias': { titleKey: 'nav.licenses' },
  '/platform/invitaciones': { titleKey: 'nav.invitations' },
}

// Breadcrumb: A = contexto donde estás parado (por TIPO, no por estado), B = página actual.
const crumbA = computed(() => {
  if (tipo.value === 'platform') return t('nav.platform')
  if (tipo.value === 'organizacion') return orgActiva.value?.nombre ?? t('ctx.org')
  return comunidadActiva.value?.nombre ?? orgActiva.value?.nombre ?? t('app.name')
})
const crumbB = computed(() => {
  const tk = route.meta.titleKey as string | undefined
  if (tk) return t(tk)
  const p = pages[route.path]
  if (p) return t(p.titleKey)
  // Rutas dinámicas (detalles, formularios anidados): cae a la sección padre.
  const seccion = Object.keys(pages)
    .filter(k => route.path.startsWith(k + '/'))
    .sort((a, b) => b.length - a.length)[0]
  return seccion ? t(pages[seccion]!.titleKey) : t('app.name')
})

function handleMenuAction(action: string) {
  userMenuOpen.value = false
  if (action === 'profile') navigateTo('/dashboard/perfil')
}

async function handleSignOut() {
  userMenuOpen.value = false
  if (isSupabaseConfigured()) {
    const { signOut } = useAuth()
    await signOut()
  }
  else {
    navigateTo('/login')
  }
}
</script>
