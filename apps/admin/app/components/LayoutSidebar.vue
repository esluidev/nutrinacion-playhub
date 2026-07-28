<template>
  <!-- Mobile overlay -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/30 z-40 lg:hidden"
        @click="$emit('close')"
      />
    </Transition>
  </Teleport>

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed inset-y-0 left-0 bg-white border-r border-gray-200 z-50 flex flex-col transition-all duration-200 ease-in-out',
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      isCollapsed ? 'w-64 lg:w-[76px]' : 'w-64',
    ]"
  >
    <!-- Logo (el mock no lleva borde debajo: el switcher va pegado) -->
    <div :class="[
      'h-[68px] flex items-center shrink-0',
      isCollapsed ? 'px-5 justify-between lg:justify-center lg:px-0' : 'px-5 justify-between',
    ]">
      <UiLogo :show-text="!isCollapsed" :class="isCollapsed ? 'lg:hidden' : ''" />
      <div v-if="isCollapsed" class="hidden lg:flex items-center justify-center">
        <div class="w-[38px] h-[38px] rounded-[11px] bg-brand-primary shadow-btn flex items-center justify-center">
          <span class="text-white font-display font-semibold text-[19px] leading-none">N</span>
        </div>
      </div>
      <!-- Mobile close -->
      <button class="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100" @click="$emit('close')">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Switcher: ELEGIR contexto. Separado del menú, que es NAVEGAR dentro del contexto. -->
    <div class="px-3.5 pt-2 pb-3.5 shrink-0">
      <LayoutSwitcher />
    </div>

    <!-- Navegación: el sidebar es el ESPEJO del contexto activo — muestra SOLO la sección
         del tipo actual (platform / organización / comunidad), nunca secciones apiladas. -->
    <nav class="flex-1 overflow-y-auto scrollbar-thin px-3.5 pt-1 pb-4">
      <div v-if="seccion">
        <p :class="['text-[10px] font-extrabold tracking-[0.13em] uppercase mb-2 px-3 text-gray-400', isCollapsed ? 'lg:hidden' : '']">
          {{ t(seccion.titleKey) }}
        </p>
        <div class="space-y-[3px]">
          <NuxtLink
            v-for="item in seccion.items"
            :key="item.path"
            :to="item.path"
            :title="isCollapsed ? t(item.labelKey) : undefined"
            :class="[
              'group flex items-center rounded-btn text-[13.5px] transition-all duration-150',
              isCollapsed ? 'gap-[11px] lg:justify-center lg:px-0 lg:py-2.5 px-3 py-[9.5px]' : 'gap-[11px] px-3 py-[9.5px]',
              isActive(item.path)
                ? 'bg-brand-primary-50 text-brand-primary-800 font-semibold shadow-[inset_0_0_0_1px_theme(colors.brand.primary.100)]'
                : 'text-[#5a6b5f] font-semibold hover:bg-[#f4f8f4] hover:text-gray-800',
            ]"
            @click="$emit('close')"
          >
            <span :class="[
              'flex items-center justify-center shrink-0 transition-colors',
              isActive(item.path) ? 'text-brand-primary-700' : 'text-gray-400 group-hover:text-gray-500',
            ]">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-[19px] h-[19px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
              </svg>
            </span>
            <span :class="isCollapsed ? 'lg:hidden' : ''">{{ t(item.labelKey) }}</span>
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Bottom: solo lo global (la sesión), idéntico en los tres contextos -->
    <div :class="[
      'border-t border-gray-100 shrink-0',
      isCollapsed ? 'px-3.5 py-3 lg:px-2 lg:py-3' : 'px-3.5 py-3',
    ]">
      <button
        :title="isCollapsed ? t('nav.signOut') : undefined"
        :class="[
          'group w-full flex items-center rounded-btn text-[13.5px] font-semibold text-[#7d8d81] hover:bg-red-50 hover:text-red-600 transition-all duration-150',
          isCollapsed ? 'gap-[11px] lg:justify-center lg:px-0 lg:py-2.5 px-3 py-[9.5px]' : 'gap-[11px] px-3 py-[9.5px]',
        ]"
        @click="handleSignOut"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-[19px] h-[19px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
        </svg>
        <span :class="isCollapsed ? 'lg:hidden' : ''">{{ t('nav.signOut') }}</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean
  isCollapsed: boolean
}>()

defineEmits<{
  close: []
}>()

const { t } = useT()
const route = useRoute()
const { tipo, esSuperadmin, comunidadActiva, administraOrgActiva } = useContexto()

interface NavItem { path: string, labelKey: string, icon: string }

// Operar una comunidad: lo que hace el admin y el colaborador por igual. La misma pantalla
// sirve a ambos; lo único que cambia es qué comunidades trae el switcher.
const comunidadNav: NavItem[] = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z' },
  { path: '/dashboard/storyboards', labelKey: 'nav.storyboards', icon: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25' },
  { path: '/dashboard/workshops', labelKey: 'nav.workshops', icon: 'M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18' },
  { path: '/dashboard/planner', labelKey: 'nav.planner', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z' },
  { path: '/dashboard/educators', labelKey: 'nav.educators', icon: 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z' },
  { path: '/dashboard/colaboradores', labelKey: 'nav.collaborators', icon: 'M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z' },
  { path: '/dashboard/configuracion', labelKey: 'nav.settings', icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z' },
]

// Nivel organización: el detalle de la org (lectura), sus comunidades y sus administradores.
const orgNav: NavItem[] = [
  { path: '/organizacion', labelKey: 'nav.dashboard', icon: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z' },
  { path: '/organizacion/comunidades', labelKey: 'nav.communities', icon: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21' },
  { path: '/organizacion/administradores', labelKey: 'nav.admins', icon: 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z' },
]

const platformNav: NavItem[] = [
  { path: '/platform', labelKey: 'nav.dashboard', icon: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z' },
  { path: '/platform/organizaciones', labelKey: 'nav.organizations', icon: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z' },
  { path: '/platform/licencias', labelKey: 'nav.licenses', icon: 'M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z' },
  { path: '/platform/invitaciones', labelKey: 'nav.invitations', icon: 'M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75' },
]

// Una sección a la vez, la del tipo actual. Si el acceso que ese tipo requiere no está
// (p. ej. bandeja /invitaciones de alguien sin comunidad), no hay nada que navegar.
const seccion = computed(() => {
  if (tipo.value === 'platform') {
    return esSuperadmin.value ? { titleKey: 'nav.platform', items: platformNav } : null
  }
  if (tipo.value === 'organizacion') {
    return administraOrgActiva.value ? { titleKey: 'ctx.org', items: orgNav } : null
  }
  return comunidadActiva.value ? { titleKey: 'ctx.community', items: comunidadNav } : null
})

function isActive(path: string) {
  // Los "home" de sección matchean exacto: por prefijo se comerían a sus hermanos.
  if (path === '/dashboard' || path === '/organizacion' || path === '/platform') return route.path === path
  return route.path.startsWith(path)
}

async function handleSignOut() {
  if (isSupabaseConfigured()) {
    const { signOut } = useAuth()
    await signOut()
  }
  else {
    navigateTo('/login')
  }
}
</script>
