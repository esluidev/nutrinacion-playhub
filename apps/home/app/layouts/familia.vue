<template>
  <!-- Lo de la familia, fuera del juego de un niño (Luis, 2026-11-27: el contexto es distinto): «¿Quién juega?», agregar
       un perfil, la cuenta y «País e idioma». La misma barra de arriba que con alguien jugando (layouts/default.vue),
       pero a la derecha el menú del adulto: entrar o crear la cuenta (con ella, «Mi cuenta» y «Cerrar sesión»), «País e
       idioma» e «Instalar app» donde el navegador instala con un toque. -->
  <div class="flex min-h-dvh flex-col bg-canvas">
    <header data-density="compact" class="ui-appbar app-topbar sticky top-0 z-30 shrink-0 border-b border-line bg-surface">
      <div class="mx-auto flex h-15 max-w-[1440px] items-center gap-3 px-4 md:px-8">
        <NuxtLink to="/" class="shrink-0" :aria-label="t('app.name')">
          <UiLogo size="sm" :label="t('app.corto')" />
        </NuxtLink>
        <div class="ml-auto flex items-center gap-2">
          <UiUserMenu
            :name="t('familia.nombre')"
            :detail="cuenta?.correo"
            :items="menu"
            :sign-out="Boolean(cuenta)"
            :sign-out-label="t('cuenta.salir')"
            :menu-label="t('familia.menu')"
            @select="(clave: string) => { if (clave === 'instalar') instalar() }"
            @sign-out="salir"
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
const { cuenta, salir } = useCuenta()
const { puedeInstalar, instalar } = useInstalarApp()

const menu = computed(() => [
  ...(cuenta.value
    ? [{ key: 'cuenta', label: t('menu.miCuenta'), icon: 'user' as const, to: '/cuenta' }]
    : [
        { key: 'entrar', label: t('menu.entrar'), icon: 'user' as const, to: '/cuenta' },
        { key: 'crear', label: t('menu.crearCuenta'), icon: 'user-plus' as const, to: '/cuenta/codigo' },
      ]),
  { key: 'ajustes', label: t('menu.ajustes'), icon: 'globe' as const, to: '/ajustes' },
  ...(puedeInstalar.value ? [{ key: 'instalar', label: t('ajustes.instalar'), icon: 'download' as const }] : []),
])
</script>
