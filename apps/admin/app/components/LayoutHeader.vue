<template>
  <!-- Barra de la app: todos sus controles miden lo mismo (--ph-control) y comparten la base
       del kit. El buscador es un campo; sobre, menú y colapso, botones neutros. -->
  <header class="ui-appbar sticky top-0 z-30 flex h-15 shrink-0 items-center justify-between border-b border-line bg-surface px-4 lg:px-8">
    <div class="flex min-w-0 items-center gap-2.5">
      <!-- Mobile menu button -->
      <UiButton
        variant="outline"
        icon="menu"
        icon-only
        :label="t('nav.menu')"
        class="lg:hidden"
        @click="$emit('toggleSidebar')"
      />

      <!-- Sidebar collapse toggle (desktop) -->
      <UiButton
        variant="outline"
        icon="sidebar"
        icon-only
        :label="isCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')"
        :title="isCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')"
        class="hidden lg:inline-flex"
        @click="toggleCollapsed"
      />

      <!-- Breadcrumb: el contexto en gris, la página actual en tinta -->
      <div class="flex min-w-0 items-center gap-2 text-body font-semibold text-muted">
        <span class="hidden truncate sm:inline">{{ crumbA }}</span>
        <UiIcon name="chevron-right" class="hidden size-3.5 shrink-0 text-disabled sm:block" />
        <span class="truncate font-extrabold text-ink">{{ crumbB }}</span>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <!-- Search (desktop only) — command palette visual: el campo del kit con su atajo -->
      <div class="search-box hidden w-64 md:flex">
        <UiIcon name="search" />
        <span class="text-body font-bold text-disabled">{{ t('common.search') }}…</span>
        <kbd class="ml-auto rounded-chip bg-sunken px-1.5 py-0.5 font-sans text-micro font-bold text-muted">⌘K</kbd>
      </div>

      <!-- Invitaciones: UNA responsabilidad. No es una campana de "notificaciones" genéricas —
           por eso el icono es un sobre y despliega la lista en vez de teletransportarte.
           Lo pendiente es novedad: el contador va en uva. -->
      <RekaPopoverRoot v-model:open="invsAbierto">
        <span class="relative inline-flex">
          <RekaPopoverTrigger as-child>
            <UiButton
              variant="outline"
              icon="mail"
              icon-only
              :label="t('inbox.title')"
              :title="t('inbox.title')"
            />
          </RekaPopoverTrigger>
          <span
            v-if="numPendientes"
            data-tone="grape"
            class="pointer-events-none absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-surface bg-(--tone-fill) px-1 text-micro font-black tabular-nums text-(--tone-on)"
          >
            {{ numPendientes > 9 ? '9+' : numPendientes }}
          </span>
        </span>

        <RekaPopoverPortal>
          <!-- Menú del kit dentro del portal de Reka (ui-listbox-floating). -->
          <RekaPopoverContent
            align="end"
            :side-offset="8"
            class="ui-listbox ui-listbox-floating w-80"
          >
            <div class="flex items-center justify-between px-3 py-2">
              <p class="eyebrow">{{ t('inbox.title') }}</p>
              <NuxtLink
                to="/invitaciones"
                data-tone="sky"
                class="ui-link text-caption"
                @click="invsAbierto = false"
              >
                {{ t('common.viewAll') }}
              </NuxtLink>
            </div>

            <p v-if="!pendientes.length" class="px-3 py-7 text-center text-caption text-subtle">
              {{ t('inbox.noPending') }}
            </p>

            <template v-else>
              <NuxtLink
                v-for="inv in pendientes.slice(0, 5)"
                :key="inv.id"
                to="/invitaciones"
                class="ui-option justify-start gap-2.5 py-2"
                @click="invsAbierto = false"
              >
                <UiSymbol size="sm" icon="mail" tone="grape" />
                <span class="min-w-0">
                  <span class="block truncate">{{ tituloInv(inv) }}</span>
                  <span class="block truncate text-caption font-semibold text-muted">{{ subtituloInv(inv) }}</span>
                </span>
              </NuxtLink>
            </template>
          </RekaPopoverContent>
        </RekaPopoverPortal>
      </RekaPopoverRoot>

      <!-- Menú de la cuenta: el mismo componente en Admin, Player y Educators -->
      <UiUserMenu
        :name="userName"
        :short-name="userNameShort"
        :detail="userEmail"
        :items="[
          { key: 'profile', label: t('nav.profile'), icon: 'user' },
          { key: 'help', label: t('nav.help'), icon: 'help' },
        ]"
        :sign-out-label="t('nav.signOut')"
        @select="handleMenuAction"
        @sign-out="handleSignOut"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
defineEmits<{
  toggleSidebar: []
}>()

const { t } = useT()
const route = useRoute()
const { isCollapsed, toggleCollapsed } = useSidebar()
const { orgActiva, tipo } = useContexto()

// Invitaciones pendientes dirigidas a mi correo (estado compartido con la página /invitaciones).
// Solo con Supabase configurado: useInvitaciones() crea el cliente al invocarse. En dev sin
// backend, el header sigue renderizando (misma lógica de guarda que useAuth abajo).
const inv = isSupabaseConfigured() ? useInvitaciones() : null
const pendientes = computed(() => inv?.pendientes.value ?? [])
const tituloInv = inv?.titulo ?? (() => '')
const subtituloInv = inv?.subtitulo ?? (() => '')
const numPendientes = computed(() => pendientes.value.length)
const invsAbierto = ref(false)

if (inv) {
  const { user: authUser } = useAuth()
  // El header vive toda la sesión, así que es el lugar natural para el canal de Realtime
  // (0010): una invitación nueva actualiza el sobre sin recargar. El correo puede no estar
  // en el primer render, por eso va con watch y no con un onMounted suelto.
  watch(() => authUser.value?.email, (email) => {
    if (!email) return
    inv.refreshPendientes()
    inv.suscribir(email)
  }, { immediate: true })

  onUnmounted(() => inv.desuscribir())
}


const userName = computed(() => {
  if (isSupabaseConfigured()) {
    const { user } = useAuth()
    const p = user.value?.perfil
    const nombre = [p?.nombre, p?.apellido].filter(Boolean).join(' ').trim()
    if (nombre) return nombre
    return user.value?.email?.split('@')[0] || t('common.myOrg')
  }
  return 'Nutrinacion Demo'
})

const userEmail = computed(() => {
  if (isSupabaseConfigured()) {
    const { user } = useAuth()
    return user.value?.email || 'admin@nutrinacion.com'
  }
  return 'admin@nutrinacion.com'
})

// La pill muestra el nombre abreviado ("Luis R."); el dropdown, el nombre completo.
const userNameShort = computed(() => {
  const partes = userName.value.split(' ').filter(Boolean)
  if (partes.length < 2) return userName.value
  return `${partes[0]} ${partes[1]!.charAt(0).toUpperCase()}.`
})

const pages: Record<string, { titleKey: string }> = {
  '/organizacion': { titleKey: 'nav.dashboard' },
  '/organizacion/workshops': { titleKey: 'nav.workshops' },
  '/organizacion/workshops/new': { titleKey: 'workshops.newTitle' },
  '/organizacion/planner': { titleKey: 'nav.planner' },
  '/organizacion/educators': { titleKey: 'nav.educators' },
  '/organizacion/colaboradores': { titleKey: 'nav.collaborators' },
  '/organizacion/storyboards': { titleKey: 'nav.storyboards' },
  '/organizacion/administradores': { titleKey: 'nav.admins' },
  '/perfil': { titleKey: 'nav.profile' },
  '/invitaciones': { titleKey: 'inbox.title' },
  '/platform/organizaciones': { titleKey: 'nav.organizations' },
  '/platform/licencias': { titleKey: 'nav.licenses' },
  '/platform/storyboards': { titleKey: 'nav.storyboards' },
  '/platform/invitaciones': { titleKey: 'nav.invitations' },
}

// Breadcrumb: A = contexto donde estás parado (por TIPO, no por estado), B = página actual.
const crumbA = computed(() => {
  if (tipo.value === 'platform') return t('nav.platform')
  return orgActiva.value?.nombre ?? t('app.name')
})
const crumbB = computed(() => {
  const tk = route.meta.titleKey as string | undefined
  if (tk) return t(tk)
  const p = pages[route.path]
  if (p) return t(p.titleKey)
  // Rutas dinámicas (detalles, formularios anidados): cae a la sección padre.
  const seccion = Object.keys(pages)
    .filter(k => route.path.startsWith(k + '/'))
    .sort((a, b) => b.length - a.length)[0]
  return seccion ? t(pages[seccion]!.titleKey) : t('app.name')
})

function handleMenuAction(action: string) {
  if (action === 'profile') navigateTo('/perfil')
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
