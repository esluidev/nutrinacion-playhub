<template>
  <!-- En tableta y escritorio la app mide el alto del dispositivo: la cabecera queda fija y el
       contenido se desplaza dentro de main; la semana y el mes ocupan justo el alto restante. -->
  <div class="flex min-h-dvh flex-col bg-canvas md:h-dvh">
    <!-- Una sola barra, con las piezas de la de Admin: el logo, dónde está y la cuenta. Las migas son
         la navegación: «Mis talleres» lleva de vuelta. En el teléfono, dentro de una página, el
         logo deja su sitio a la vuelta y al título. -->
    <header class="ui-appbar app-topbar sticky top-0 z-30 shrink-0 border-b border-line bg-surface">
      <div class="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-2 md:px-8">
        <UiButton
          v-if="pagina !== null"
          to="/"
          variant="outline"
          icon="chevron-left"
          icon-only
          :label="t('nav.talleres')"
          class="sm:hidden"
        />
        <NuxtLink to="/" :class="['shrink-0', pagina !== null && 'hidden sm:block']" :aria-label="t('nav.talleres')">
          <UiLogo size="sm" :label="t('app.name')" />
        </NuxtLink>
        <nav :class="['min-w-0 items-center gap-2 text-body font-semibold text-muted sm:border-l sm:border-line sm:pl-4', pagina !== null ? 'flex' : 'hidden sm:flex']" :aria-label="t('nav.migas')">
          <template v-if="pagina !== null">
            <NuxtLink to="/" class="hidden shrink-0 hover:text-ink sm:inline">{{ t('nav.talleres') }}</NuxtLink>
            <UiIcon name="chevron-right" class="hidden size-3.5 shrink-0 text-disabled sm:block" />
          </template>
          <span class="truncate font-extrabold text-ink" aria-current="page">{{ pagina ?? t('nav.talleres') }}</span>
        </nav>
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

    <main class="app-main mx-auto flex w-full max-w-[1440px] flex-1 flex-col pb-10 pt-5 md:min-h-0 md:overflow-y-auto md:px-8 md:pb-6 md:pt-7">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { lugarDeTrabajo, nombreCompleto } from '~/utils/sesion'

const { t } = useT()
const { educador, salir } = useSesion()
const { taller } = useTalleres()
const route = useRoute()

// La página dentro de «Mis talleres»: su perfil o un taller (su preparación y su cierre). En el
// inicio, ninguna.
const pagina = computed<string | null>(() => {
  if (route.path === '/cuenta') return t('cuenta.titulo')
  const id = route.params.id
  return typeof id === 'string' ? taller(id)?.storyboard.titulo ?? '' : null
})

// Bajo el nombre: su organización o, si trabaja en varias, cuántas.
const dondeTrabaja = computed(() => {
  if (!educador.value) return undefined
  const lugar = lugarDeTrabajo(educador.value)
  if ('nombre' in lugar) return lugar.nombre
  return lugar.organizaciones ? t('sesion.organizaciones', { n: lugar.organizaciones }) : undefined
})
</script>
