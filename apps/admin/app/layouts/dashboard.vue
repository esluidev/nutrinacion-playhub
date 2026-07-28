<template>
  <div class="min-h-screen bg-brand-bg">
    <LayoutSidebar :is-open="sidebarOpen" :is-collapsed="isCollapsed" @close="sidebarOpen = false" />

    <div :class="[
      'flex flex-col min-h-screen transition-all duration-200 ease-in-out',
      isCollapsed ? 'lg:pl-[76px]' : 'lg:pl-64',
    ]">
      <LayoutHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <!-- max-w: el mock está diseñado a 1440; sin tope, en monitores anchos el
           contenido se desparrama y el diseño se ve chico y disperso. -->
      <main class="flex-1 p-5 lg:p-8">
        <div class="max-w-[1440px] mx-auto w-full">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const sidebarOpen = ref(false)
const { isCollapsed, toggleCollapsed } = useSidebar()

const route = useRoute()
watch(() => route.path, () => {
  sidebarOpen.value = false
})
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
