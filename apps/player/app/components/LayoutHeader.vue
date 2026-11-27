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
    <!-- «Instalar app» solo donde el navegador la instala con un toque, y la instala al pulsarlo. -->
    <UiUserMenu
      v-if="usuario"
      :name="usuario.nombre"
      :detail="usuario.email"
      :items="puedeInstalar ? [{ key: 'instalar', label: 'Instalar app', icon: 'download' }] : []"
      sign-out-label="Cerrar sesión"
      @select="(clave: string) => { if (clave === 'instalar') instalar() }"
      @sign-out="salir"
    />
  </header>
</template>

<script setup lang="ts">
defineEmits<{ toggleSidebar: [] }>()

const route = useRoute()
const { isCollapsed, toggleCollapsed } = useSidebar()
const { usuario, salir } = useSesion()
const { puedeInstalar, instalar } = useInstalarApp()

const pageTitle = computed(() => (route.path.startsWith('/hogar') ? 'App del hogar' : 'Storyboards'))
const pageDescription = computed(() => {
  if (route.path.startsWith('/hogar/unidades/')) return 'Unidad de estudio'
  if (route.path.startsWith('/hogar')) return 'Lo que ven las familias: las unidades de estudio y los storyboards sueltos.'
  if (/^\/storyboards\/[^/]+\/[^/]+\/guia/.test(route.path)) return 'Guía del educador'
  if (/^\/storyboards\/[^/]+\/[^/]+/.test(route.path)) return 'Detalle del storyboard'
  return 'Lo que compila Player: aquí se registra, se publica y se escribe su guía.'
})
</script>
