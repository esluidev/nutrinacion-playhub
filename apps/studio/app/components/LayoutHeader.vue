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
      <div class="w-px h-6 bg-gray-200 hidden sm:block" />

      <!-- User Menu -->
      <div class="relative">
        <button
          class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 -mr-2 hover:bg-gray-50 transition-colors"
          @click="userMenuOpen = !userMenuOpen"
        >
          <div class="text-right hidden sm:block">
            <p class="text-[13px] font-semibold text-brand-dark leading-tight">StoryPlay Studio</p>
            <p class="text-[11px] text-gray-400">{{ userEmail }}</p>
          </div>
          <div class="w-8 h-8 rounded-full bg-brand-purple flex items-center justify-center">
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
            class="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-lg py-1.5 z-50"
          >
            <button
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              @click="handleSignOut"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              Cerrar Sesion
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

const route = useRoute()
const userMenuOpen = ref(false)
const { isCollapsed, toggleCollapsed } = useSidebar()
const { user, signOut } = useAuth()

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

const userEmail = computed(() => user.value?.email ?? 'admin@nutrinacion.com')
const userInitial = computed(() => userEmail.value.charAt(0).toUpperCase())

const pages: Record<string, { title: string; description?: string }> = {
  '/': { title: 'Dashboard', description: 'Resumen general de StoryPlay Studio' },
  '/storyboards': { title: 'Storyboards', description: 'Biblioteca de contenido educativo' },
  '/primitives': { title: 'Primitivas', description: 'Catalogo de componentes del design system' },
}

const pageTitle = computed(() => {
  // Dynamic routes: storyboard detail, scene detail, primitives playground
  if (route.path.startsWith('/storyboards/')) return 'Storyboards'
  if (route.path.startsWith('/primitives/')) return 'Primitivas'
  return pages[route.path]?.title ?? 'StoryPlay Studio'
})

const pageDescription = computed(() => {
  if (route.path.startsWith('/storyboards/') && route.path.includes('/scenes/')) return 'Detalle de escena'
  if (route.path.match(/^\/storyboards\/[^/]+\/[^/]+$/)) return 'Detalle de storyboard'
  if (route.path.startsWith('/storyboards/')) return 'Biblioteca de contenido educativo'
  if (route.path.startsWith('/primitives/')) return 'Playground de primitiva'
  return pages[route.path]?.description
})

async function handleSignOut() {
  userMenuOpen.value = false
  await signOut()
}
</script>
