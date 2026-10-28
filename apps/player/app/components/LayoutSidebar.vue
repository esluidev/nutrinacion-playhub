<template>
  <!-- Fondo en móvil -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-40 lg:hidden" :style="{ background: 'var(--color-scrim)' }" @click="$emit('close')" />
    </Transition>
  </Teleport>

  <aside
    :class="[
      'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-surface transition-all duration-300 ease-in-out',
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      isCollapsed ? 'w-64 lg:w-16' : 'w-64',
    ]"
  >
    <!-- Logo: completo con la barra abierta, el isotipo con la barra colapsada -->
    <div :class="['flex h-16 shrink-0 items-center border-b border-line', isCollapsed ? 'justify-between px-5 lg:justify-center lg:px-0' : 'justify-between px-5']">
      <UiLogo size="sm" label="Player" :class="isCollapsed && 'lg:hidden'" />
      <UiLogo v-if="isCollapsed" variant="isotipo" size="sm" class="hidden lg:flex" />
      <UiButton class="lg:hidden" variant="ghost" icon="close" icon-only label="Cerrar menú" @click="$emit('close')" />
    </div>

    <nav class="flex-1 overflow-y-auto px-3 pb-4 pt-5" aria-label="Secciones">
      <p :class="['eyebrow mb-3 px-3', isCollapsed && 'lg:hidden']">Menú</p>
      <div class="space-y-1">
        <NuxtLink
          v-for="item in navigation"
          :key="item.path"
          :to="item.path"
          :title="isCollapsed ? item.label : undefined"
          :aria-current="isActive(item.path) ? 'page' : undefined"
          :class="['ui-nav-item', isCollapsed && 'lg:justify-center lg:px-0']"
          @click="$emit('close')"
        >
          <UiIcon :name="item.icon" />
          <span :class="isCollapsed && 'lg:hidden'">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>

  </aside>
</template>

<script setup lang="ts">
defineProps<{ isOpen: boolean, isCollapsed: boolean }>()
defineEmits<{ close: [] }>()

const route = useRoute()

const navigation = [
  { path: '/storyboards', label: 'Storyboards', icon: 'book' as const },
]

const isActive = (path: string) => route.path.startsWith(path)
</script>
