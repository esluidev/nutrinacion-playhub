<template>
  <!-- En tableta y escritorio la app mide el alto del dispositivo: la cabecera queda fija y el
       contenido se desplaza dentro de main; el calendario ocupa justo el alto restante. -->
  <div class="flex min-h-dvh flex-col bg-canvas md:h-dvh">
    <!-- Cabecera de la app original: logo a la izquierda y, a la derecha, el saludo con el menú de la cuenta -->
    <header class="ui-appbar app-topbar sticky top-0 z-30 shrink-0 border-b border-line bg-surface">
      <div class="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-2 md:px-8">
        <NuxtLink to="/" :aria-label="t('nav.talleres')"><UiLogo size="sm" :label="t('app.name')" /></NuxtLink>
        <!-- Menú de la cuenta: el mismo componente en Admin, Player y Educators -->
        <UiUserMenu
          class="ml-auto"
          :name="educador ? nombreCompleto(educador) : ''"
          :short-name="educador?.nombre"
          :detail="dondeTrabaja"
          :items="[{ key: 'perfil', label: t('menu.perfil'), icon: 'user', to: '/cuenta' }]"
          :sign-out-label="t('menu.salir')"
          :menu-label="t('menu.cuenta')"
          @sign-out="salir"
        />
      </div>
    </header>

    <main class="app-main mx-auto flex w-full max-w-[1440px] flex-1 flex-col pb-10 pt-4 md:min-h-0 md:overflow-y-auto md:px-8 md:pb-6 md:pt-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { lugarDeTrabajo, nombreCompleto } from '~/utils/sesion'

const { t } = useT()
const { educador, salir } = useSesion()

// Bajo el nombre: su comunidad, su organización si tiene varias comunidades de una, o cuántas.
const dondeTrabaja = computed(() => {
  if (!educador.value) return undefined
  const lugar = lugarDeTrabajo(educador.value)
  if ('nombre' in lugar) return lugar.nombre
  return lugar.comunidades ? t('sesion.comunidades', { n: lugar.comunidades }) : undefined
})
</script>
