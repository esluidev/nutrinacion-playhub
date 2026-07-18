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
      'fixed inset-y-0 left-0 bg-white border-r border-gray-200/80 z-50 flex flex-col transition-all duration-300 ease-in-out',
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      isCollapsed ? 'w-64 lg:w-16' : 'w-64',
    ]"
  >
    <!-- Logo -->
    <div :class="[
      'h-16 flex items-center border-b border-gray-100 shrink-0',
      isCollapsed ? 'px-5 justify-between lg:justify-center lg:px-0' : 'px-5 justify-between',
    ]">
      <UiLogo :show-text="!isCollapsed" :class="isCollapsed ? 'lg:hidden' : ''" />
      <div v-if="isCollapsed" class="hidden lg:flex items-center justify-center">
        <div class="w-9 h-9 rounded-lg bg-brand-purple flex items-center justify-center">
          <span class="text-white font-display font-bold text-lg leading-none">S</span>
        </div>
      </div>
      <!-- Mobile close -->
      <button class="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100" @click="$emit('close')">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto px-3 pt-5 pb-4">
      <p :class="[
        'text-[10px] font-bold tracking-widest text-gray-300 uppercase mb-3',
        isCollapsed ? 'lg:hidden' : '',
        'px-3',
      ]">
        Menu
      </p>

      <div class="space-y-1">
        <NuxtLink
          v-for="item in navigation"
          :key="item.path"
          :to="item.path"
          :title="isCollapsed ? item.label : undefined"
          :class="[
            'group flex items-center rounded-xl text-sm font-medium transition-all duration-150 relative',
            isCollapsed ? 'gap-3 lg:justify-center lg:px-0 lg:py-2.5 px-3 py-2.5' : 'gap-3 px-3 py-2.5',
            isActive(item.path)
              ? 'bg-brand-purple-50 text-brand-purple-700 font-semibold'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700',
          ]"
          @click="$emit('close')"
        >
          <!-- Active indicator bar -->
          <span
            v-if="isActive(item.path)"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-brand-purple-500"
          />
          <!-- Icon -->
          <span :class="[
            'flex items-center justify-center shrink-0 transition-colors',
            isCollapsed ? 'lg:w-9 lg:h-9 lg:rounded-lg' : '',
            isActive(item.path)
              ? 'text-brand-purple-600'
              : 'text-gray-400 group-hover:text-gray-500',
          ]">
            <svg xmlns="http://www.w3.org/2000/svg" :class="isCollapsed ? 'w-[20px] h-[20px] lg:w-5 lg:h-5' : 'w-[20px] h-[20px]'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
            </svg>
          </span>
          <span :class="isCollapsed ? 'lg:hidden' : ''">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>

    <!-- Bottom -->
    <div :class="[
      'border-t border-gray-100 shrink-0 space-y-1',
      isCollapsed ? 'px-3 py-3 lg:px-2 lg:py-3' : 'px-3 py-3',
    ]">
      <button
        :title="isCollapsed ? 'Cerrar Sesion' : undefined"
        :class="[
          'group w-full flex items-center rounded-xl text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-150',
          isCollapsed ? 'gap-3 lg:justify-center lg:px-0 lg:py-2.5 px-3 py-2.5' : 'gap-3 px-3 py-2.5',
        ]"
        @click="handleSignOut"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-[20px] h-[20px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
        </svg>
        <span :class="isCollapsed ? 'lg:hidden' : ''">Cerrar Sesion</span>
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

const route = useRoute()
const { signOut } = useAuth()

const navigation = [
  {
    path: '/',
    label: 'Dashboard',
    icon: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z',
  },
  {
    path: '/storyboards',
    label: 'Storyboards',
    icon: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25',
  },
  {
    path: '/sprites',
    label: 'Sprites',
    icon: 'm2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z',
  },
  {
    path: '/primitives',
    label: 'Primitivas',
    icon: 'M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z',
  },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

async function handleSignOut() {
  await signOut()
}
</script>
