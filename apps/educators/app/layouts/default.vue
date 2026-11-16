<template>
  <!-- Se desplaza la página y la cabecera queda fija arriba (sticky). Solo la semana y el mes de
       «Mis talleres», en tableta y escritorio, miden el alto del dispositivo para ocupar justo el que
       queda bajo la cabecera: ahí el contenido se desplaza dentro de main. -->
  <div :class="['flex min-h-dvh flex-col bg-canvas', altoFijo && 'md:h-dvh']">
    <!-- Una sola barra, la misma de Admin: mismas piezas, misma altura (60) y en densidad compact,
         aunque el resto de Educators sea touch; sus botones miden 40, el mínimo táctil, y siguen con
         el comportamiento táctil del kit. Las migas son la navegación: «Mis talleres» lleva de vuelta.
         En el teléfono, dentro de una página, el logo deja su sitio a la vuelta y al título. -->
    <header data-density="compact" class="ui-appbar app-topbar sticky top-0 z-30 shrink-0 border-b border-line bg-surface">
      <div class="mx-auto flex h-15 max-w-[1440px] items-center gap-3 px-4 md:px-8">
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
        <div class="ml-auto flex items-center gap-3">
          <!-- Inicio a la vista: no todos saben que el logo lleva ahí. En el teléfono, dentro de una
               página, ya está el botón para volver. -->
          <UiButton
            to="/"
            variant="outline"
            icon="home"
            icon-only
            :label="t('nav.talleres')"
            :title="t('nav.talleres')"
            :class="pagina !== null && 'max-sm:hidden'"
          />
          <!-- Menú de la cuenta: el mismo componente en Admin, Player y Educators; bajo el nombre, el correo -->
          <UiUserMenu
            :name="educador ? nombreCompleto(educador) : ''"
            :short-name="educador?.nombre"
            :detail="educador?.correo"
            :items="[{ key: 'perfil', label: t('menu.perfil'), icon: 'user', to: '/cuenta' }]"
            :sign-out-label="t('menu.salir')"
            :menu-label="t('menu.cuenta')"
            @sign-out="salir"
          />
        </div>
      </div>
    </header>

    <main :class="['app-main mx-auto flex w-full max-w-[1440px] flex-1 flex-col pb-10 pt-5 md:px-8 md:pb-6 md:pt-7', altoFijo && 'md:min-h-0 md:overflow-y-auto']">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { nombreCompleto } from '~/utils/sesion'

const { t } = useT()
const { educador, salir } = useSesion()
const { taller } = useTalleres()
const { vista } = useCalendario()
const route = useRoute()

// La semana y el mes de «Mis talleres» ocupan justo el alto que queda bajo la cabecera; el resto de
// las páginas (el día, la ficha, el cierre, el perfil) se desplaza entero, con la barra en la página.
const altoFijo = computed(() => route.path === '/' && vista.value !== 'dia')

// La página dentro de «Mis talleres»: su perfil o un taller (su preparación y su cierre). En el
// inicio, ninguna.
const pagina = computed<string | null>(() => {
  if (route.path === '/cuenta') return t('cuenta.titulo')
  const id = route.params.id
  return typeof id === 'string' ? taller(id)?.titulo ?? '' : null
})
</script>
