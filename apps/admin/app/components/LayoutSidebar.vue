<template>
  <!-- Mobile overlay -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-40 bg-scrim lg:hidden"
        @click="$emit('close')"
      />
    </Transition>
  </Teleport>

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-surface transition-all duration-200 ease-in-out',
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      isCollapsed ? 'w-64 lg:w-19' : 'w-64',
    ]"
  >
    <!-- Logo (el mock no lleva borde debajo: el switcher va pegado) -->
    <div :class="[
      'flex h-17 shrink-0 items-center',
      isCollapsed ? 'justify-between px-5 lg:justify-center lg:px-0' : 'justify-between px-5',
    ]">
      <UiLogo label="Admin" :show-text="!isCollapsed" :class="isCollapsed ? 'lg:hidden' : ''" />
      <UiLogo v-if="isCollapsed" variant="isotipo" class="hidden lg:flex" />
      <!-- Mobile close -->
      <UiButton
        variant="outline"
        size="sm"
        icon="close"
        icon-only
        :label="t('common.close')"
        class="lg:hidden"
        @click="$emit('close')"
      />
    </div>

    <!-- Switcher: ELEGIR contexto. Separado del menú, que es NAVEGAR dentro del contexto. -->
    <div class="shrink-0 px-3.5 pb-3.5 pt-2">
      <LayoutSwitcher />
    </div>

    <!-- Navegación: el sidebar es el ESPEJO del contexto activo — muestra SOLO la sección
         del tipo actual (platform / organización / comunidad), nunca secciones apiladas.
         El lugar actual lo pinta el kit (ui-nav-item con aria-current): sin estilos propios. -->
    <nav class="scrollbar-thin flex-1 overflow-y-auto px-3.5 pb-4 pt-1">
      <div v-if="seccion">
        <p :class="['eyebrow mb-2 px-3', isCollapsed ? 'lg:hidden' : '']">
          {{ t(seccion.titleKey) }}
        </p>
        <div class="space-y-1">
          <NuxtLink
            v-for="item in seccion.items"
            :key="item.path"
            :to="item.path"
            :title="isCollapsed ? t(item.labelKey) : undefined"
            :aria-current="isActive(item.path) ? 'page' : undefined"
            :class="['ui-nav-item', isCollapsed && 'lg:justify-center lg:px-0']"
            @click="$emit('close')"
          >
            <UiIcon :name="item.icon" />
            <span :class="isCollapsed ? 'lg:hidden' : ''">{{ t(item.labelKey) }}</span>
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Bottom: solo lo global (la sesión), idéntico en los tres contextos. Salir es coral. -->
    <div :class="[
      'shrink-0 border-t border-line',
      isCollapsed ? 'px-3.5 py-3 lg:px-2' : 'px-3.5 py-3',
    ]">
      <button
        type="button"
        data-tone="coral"
        :title="isCollapsed ? t('nav.signOut') : undefined"
        :class="[
          'ui-nav-item group w-full hover:bg-(--tone-wash) hover:text-(--tone-strong)',
          isCollapsed && 'lg:justify-center lg:px-0',
        ]"
        @click="handleSignOut"
      >
        <UiIcon name="logout" class="group-hover:text-(--tone-icon)" />
        <span :class="isCollapsed ? 'lg:hidden' : ''">{{ t('nav.signOut') }}</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'

defineProps<{
  isOpen: boolean
  isCollapsed: boolean
}>()

defineEmits<{
  close: []
}>()

const { t } = useT()
const route = useRoute()
const { tipo, esSuperadmin, comunidadActiva, administraOrgActiva } = useContexto()

interface NavItem { path: string, labelKey: string, icon: UiIconName }

// Operar una comunidad: lo que hace el admin y el colaborador por igual. La misma pantalla
// sirve a ambos; lo único que cambia es qué comunidades trae el switcher.
const comunidadNav: NavItem[] = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: 'grid' },
  { path: '/dashboard/storyboards', labelKey: 'nav.storyboards', icon: 'book' },
  { path: '/dashboard/workshops', labelKey: 'nav.workshops', icon: 'clapperboard' },
  { path: '/dashboard/planner', labelKey: 'nav.planner', icon: 'calendar' },
  { path: '/dashboard/educators', labelKey: 'nav.educators', icon: 'users' },
  { path: '/dashboard/colaboradores', labelKey: 'nav.collaborators', icon: 'user-plus' },
  { path: '/dashboard/participantes', labelKey: 'nav.participants', icon: 'heart' },
  { path: '/dashboard/casa', labelKey: 'nav.homeContent', icon: 'sparkles' },
  { path: '/dashboard/configuracion', labelKey: 'nav.settings', icon: 'settings' },
]

// Nivel organización: el detalle de la org (lectura), sus comunidades, administradores, jornadas y lo
// que ofrece para casa (con su perfil público).
const orgNav: NavItem[] = [
  { path: '/organizacion', labelKey: 'nav.dashboard', icon: 'grid' },
  { path: '/organizacion/comunidades', labelKey: 'nav.communities', icon: 'home' },
  { path: '/organizacion/administradores', labelKey: 'nav.admins', icon: 'users' },
  { path: '/organizacion/jornadas', labelKey: 'nav.jornadas', icon: 'calendar' },
  { path: '/organizacion/casa', labelKey: 'nav.homeContent', icon: 'sparkles' },
]

const platformNav: NavItem[] = [
  { path: '/platform', labelKey: 'nav.dashboard', icon: 'grid' },
  { path: '/platform/organizaciones', labelKey: 'nav.organizations', icon: 'building' },
  { path: '/platform/licencias', labelKey: 'nav.licenses', icon: 'license' },
  { path: '/platform/storyboards', labelKey: 'nav.storyboards', icon: 'book' },
  { path: '/platform/invitaciones', labelKey: 'nav.invitations', icon: 'mail' },
]

// Una sección a la vez, la del tipo actual. Si el acceso que ese tipo requiere no está
// (p. ej. bandeja /invitaciones de alguien sin comunidad), no hay nada que navegar.
const seccion = computed(() => {
  if (tipo.value === 'platform') {
    return esSuperadmin.value ? { titleKey: 'nav.platform', items: platformNav } : null
  }
  if (tipo.value === 'organizacion') {
    return administraOrgActiva.value ? { titleKey: 'ctx.org', items: orgNav } : null
  }
  return comunidadActiva.value ? { titleKey: 'ctx.community', items: comunidadNav } : null
})

function isActive(path: string) {
  // Los "home" de sección matchean exacto: por prefijo se comerían a sus hermanos.
  if (path === '/dashboard' || path === '/organizacion' || path === '/platform') return route.path === path
  return route.path.startsWith(path)
}

async function handleSignOut() {
  if (isSupabaseConfigured()) {
    const { signOut } = useAuth()
    await signOut()
  }
  else {
    navigateTo('/login')
  }
}
</script>
