<template>
  <!-- Con alguien jugando: una sola barra, como la de Educators (en densidad compact, con botones de 40). A la
       izquierda, el logo, que lleva a su inicio. A la derecha, «Inicio» y «Unirme» y el menú del kit con quién juega
       (su animal y su nombre): editar su perfil y cambiar de perfil. Sin «Cerrar sesión»: lo del adulto (la cuenta,
       «País e idioma», instalar) está en la barra de la familia, en «¿Quién juega?» (layouts/familia.vue). -->
  <div class="flex min-h-dvh flex-col bg-canvas">
    <header data-density="compact" class="ui-appbar app-topbar sticky top-0 z-30 shrink-0 border-b border-line bg-surface">
      <div class="mx-auto flex h-15 max-w-[1440px] items-center gap-3 px-4 md:px-8">
        <NuxtLink :to="actual ? '/inicio' : '/'" class="shrink-0" :aria-label="t('app.name')">
          <UiLogo size="sm" :label="t('app.corto')" />
        </NuxtLink>
        <div class="ml-auto flex items-center gap-2">
          <!-- Volver a su inicio y unirse a un taller con el código del educador; en el teléfono, solo sus iconos -->
          <template v-if="actual">
            <UiButton to="/inicio" variant="outline" icon="home" :label="t('menu.inicio')" class="max-sm:hidden">{{ t('menu.inicio') }}</UiButton>
            <UiButton to="/inicio" variant="outline" icon="home" icon-only :label="t('menu.inicio')" class="sm:hidden" />
            <UiButton to="/code" variant="outline" icon="users" :label="t('menu.unirme')" class="max-sm:hidden">{{ t('menu.unirme') }}</UiButton>
            <UiButton to="/code" variant="outline" icon="users" icon-only :label="t('menu.unirme')" class="sm:hidden" />
          </template>
          <UiUserMenu
            v-if="actual"
            :name="actual.nombre"
            :avatar="dibujoDe(actual.avatar)"
            :avatar-tone="tonoDe(actual.avatar)"
            :items="menu"
            :sign-out="false"
            :menu-label="t('menu.cuenta')"
          />
        </div>
      </div>
    </header>

    <main class="app-main mx-auto flex w-full max-w-[1440px] flex-1 flex-col pt-5 md:px-8 md:pt-7">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { t } = useT()
const { actual } = useHogar()

const menu = computed(() => [
  ...(actual.value ? [{ key: 'editar', label: t('menu.editarPerfil'), icon: 'pencil' as const, to: `/perfiles/${actual.value.id}` }] : []),
  { key: 'perfil', label: t('menu.perfil'), icon: 'users' as const, to: '/' },
])
</script>
