<template>
  <header class="ui-appbar sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface px-4 lg:px-6">
    <div class="flex items-center gap-3">
      <UiButton class="-ml-1 lg:hidden" variant="ghost" icon="menu" icon-only label="Abrir menú" @click="$emit('toggleSidebar')" />
      <UiButton
        class="-ml-1 hidden lg:inline-flex"
        variant="ghost"
        icon="sidebar"
        icon-only
        :label="isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'"
        @click="toggleCollapsed"
      />
      <div>
        <p class="ui-title leading-tight">{{ pageTitle }}</p>
        <p v-if="pageDescription" class="ui-caption hidden sm:block">{{ pageDescription }}</p>
      </div>
    </div>
    <UiUserMenu
      v-if="usuario"
      :name="usuario.nombre"
      :detail="usuario.email"
      sign-out-label="Cerrar sesión"
      @sign-out="salir"
    />
  </header>
</template>

<script setup lang="ts">
defineEmits<{ toggleSidebar: [] }>()

const route = useRoute()
const { isCollapsed, toggleCollapsed } = useSidebar()
const { usuario, salir } = useSesion()

const pageTitle = computed(() => 'Storyboards')
const pageDescription = computed(() => (/^\/storyboards\/[^/]+\/[^/]+/.test(route.path)
  ? 'Detalle del storyboard'
  : 'Lo que compila Player: se registra y se publica desde aquí; la guía se escribe en Admin.'))
</script>
