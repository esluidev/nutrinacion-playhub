<template>
  <div class="min-h-screen bg-brand-bg">
    <LayoutSidebar :is-open="sidebarOpen" :is-collapsed="isCollapsed" @close="sidebarOpen = false" />

    <div :class="[
      'flex flex-col min-h-screen transition-all duration-300 ease-in-out',
      isCollapsed ? 'lg:pl-16' : 'lg:pl-64',
    ]">
      <LayoutHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <main class="flex-1 p-4 lg:p-6">
        <div class="mx-auto w-full max-w-[1440px]">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const sidebarOpen = ref(false)
const { isCollapsed } = useSidebar()

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
