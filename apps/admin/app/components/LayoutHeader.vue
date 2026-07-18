<template>
  <header class="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 px-4 lg:px-6 flex items-center justify-between shrink-0">
    <div class="flex items-center gap-3">
      <!-- Mobile menu button -->
      <button
        class="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors -ml-1"
        @click="$emit('toggleSidebar')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
        </svg>
      </button>

      <!-- Sidebar collapse toggle (desktop) -->
      <button
        class="hidden lg:flex w-9 h-9 rounded-lg items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors -ml-1"
        :title="isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'"
        @click="toggleCollapsed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" :class="['w-5 h-5 transition-transform duration-300', isCollapsed ? 'rotate-180' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
        </svg>
      </button>

      <div>
        <h1 class="text-lg font-display font-bold text-brand-dark leading-tight">
          {{ pageTitle }}
        </h1>
        <p v-if="pageDescription" class="text-xs text-gray-400 hidden sm:block">
          {{ pageDescription }}
        </p>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <!-- Search (desktop only) -->
      <div class="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 w-56">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          :placeholder="t('common.search')"
          class="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
        >
      </div>

      <!-- Invitaciones: UNA responsabilidad. No es una campana de "notificaciones" genéricas —
           por eso el icono es un sobre y despliega la lista en vez de teletransportarte. -->
      <RekaPopoverRoot v-model:open="invsAbierto">
        <RekaPopoverTrigger as-child>
          <button
            class="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors relative"
            :title="t('inbox.title')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            <span
              v-if="numPendientes"
              class="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-brand-coral text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {{ numPendientes > 9 ? '9+' : numPendientes }}
            </span>
          </button>
        </RekaPopoverTrigger>

        <RekaPopoverPortal>
          <RekaPopoverContent
            align="end"
            :side-offset="8"
            class="w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden"
          >
            <div class="px-3.5 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <p class="text-[11px] font-bold tracking-wider text-gray-400 uppercase">{{ t('inbox.title') }}</p>
              <NuxtLink
                to="/invitaciones"
                class="text-xs font-semibold text-brand-primary-600 hover:underline"
                @click="invsAbierto = false"
              >
                {{ t('common.viewAll') }}
              </NuxtLink>
            </div>

            <p v-if="!pendientes.length" class="px-3.5 py-7 text-xs text-gray-400 text-center">
              {{ t('inbox.noPending') }}
            </p>

            <div v-else class="max-h-80 overflow-y-auto divide-y divide-gray-50">
              <NuxtLink
                v-for="inv in pendientes.slice(0, 5)"
                :key="inv.id"
                to="/invitaciones"
                class="block px-3.5 py-2.5 hover:bg-gray-50 transition-colors"
                @click="invsAbierto = false"
              >
                <p class="text-sm font-medium text-brand-dark truncate">{{ tituloInv(inv) }}</p>
                <p class="text-xs text-gray-400 truncate">{{ subtituloInv(inv) }}</p>
              </NuxtLink>
            </div>
          </RekaPopoverContent>
        </RekaPopoverPortal>
      </RekaPopoverRoot>

      <div class="w-px h-6 bg-gray-200 hidden sm:block" />

      <!-- User Menu -->
      <div class="relative">
        <button
          class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 -mr-2 hover:bg-gray-50 transition-colors"
          @click="userMenuOpen = !userMenuOpen"
        >
          <div class="text-right hidden sm:block">
            <p class="text-[13px] font-semibold text-brand-dark leading-tight">{{ workspaceName }}</p>
            <p class="text-[11px] text-gray-400">{{ userEmail }}</p>
          </div>
          <div class="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center">
            <span class="text-white font-bold text-xs">
              {{ userInitial }}
            </span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" :class="['w-4 h-4 text-gray-400 hidden sm:block transition-transform', userMenuOpen ? 'rotate-180' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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
            class="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg py-1.5 z-50"
          >
            <!-- User info (mobile) -->
            <div class="px-4 py-3 border-b border-gray-100 sm:hidden">
              <p class="text-sm font-semibold text-brand-dark">{{ workspaceName }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ userEmail }}</p>
            </div>

            <button
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              @click="handleMenuAction('profile')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              {{ t('nav.profile') }}
            </button>

            <button
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              @click="handleMenuAction('settings')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              {{ t('nav.settings') }}
            </button>

            <button
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              @click="handleMenuAction('help')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
              </svg>
              {{ t('nav.help') }}
            </button>

            <div class="my-1.5 border-t border-gray-100" />

            <button
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              @click="handleSignOut"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
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

// Invitaciones pendientes dirigidas a mi correo (estado compartido con la página /invitaciones).
// Se recarga en cuanto hay sesión resuelta: en el primer arranque el header puede montarse
// antes de que useAuth termine, así que dispara por el correo, no por onMounted.
const { pendientes, refreshPendientes, titulo: tituloInv, subtitulo: subtituloInv } = useInvitaciones()
const numPendientes = computed(() => pendientes.value.length)
const invsAbierto = ref(false)

if (isSupabaseConfigured()) {
  const { user: authUser } = useAuth()
  watch(() => authUser.value?.email, (email) => {
    if (email) refreshPendientes()
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

const workspaceName = computed(() => {
  if (isSupabaseConfigured()) {
    const { user } = useAuth()
    return user.value?.organizaciones[0]?.nombre
      || user.value?.comunidades[0]?.nombre
      || t('common.myOrg')
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

const userInitial = computed(() => userEmail.value.charAt(0).toUpperCase())

const pages: Record<string, { titleKey: string; descKey?: string }> = {
  '/dashboard': { titleKey: 'nav.dashboard', descKey: 'dash.dashboardDesc' },
  '/dashboard/storyboards': { titleKey: 'nav.storyboards', descKey: 'dash.storyboardsDesc' },
  '/dashboard/workshops': { titleKey: 'nav.workshops', descKey: 'dash.workshopsDesc' },
  '/dashboard/workshops/new': { titleKey: 'dash.newWorkshop', descKey: 'dash.newWorkshopDesc' },
  '/dashboard/planner': { titleKey: 'nav.planner', descKey: 'dash.plannerDesc' },
  '/dashboard/educators': { titleKey: 'nav.educators', descKey: 'dash.educatorsDesc' },
}

// Las páginas fijan su título vía definePageMeta({ titleKey, descKey }); si no, se usa el map.
const pageTitle = computed(() => {
  const tk = route.meta.titleKey as string | undefined
  if (tk) return t(tk)
  const p = pages[route.path]
  return p ? t(p.titleKey) : t('app.name')
})
const pageDescription = computed(() => {
  const dk = route.meta.descKey as string | undefined
  if (dk) return t(dk)
  const p = pages[route.path]
  return p?.descKey ? t(p.descKey) : undefined
})

function handleMenuAction(action: string) {
  userMenuOpen.value = false
  if (action === 'settings') navigateTo('/dashboard/settings')
  if (action === 'profile') navigateTo('/dashboard/settings')
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
