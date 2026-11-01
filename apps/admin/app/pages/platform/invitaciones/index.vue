<template>
  <div>
    <UiPageHeader :title="t('platform.invs.title')" :description="t('platform.invs.desc')">
      <template #actions>
        <UiButton icon="plus" to="/platform/invitaciones/nueva">{{ t('platform.invs.new') }}</UiButton>
      </template>
    </UiPageHeader>

    <UiDataTable
      :columns="columns"
      :rows="invitaciones"
      :row-key="(i) => i.id"
      :loading="loading"
      :page="page"
      :total="total"
      :page-size="PAGE_SIZE"
      :empty-text="hayFiltros ? t('platform.invs.emptyFiltered') : t('platform.invs.empty')"
      @update:page="page = $event"
    >
      <!-- Búsqueda y filtro en servidor: viven en la barra integrada de la tabla -->
      <template #toolbar>
        <UiSearchInput v-model="q" :placeholder="t('platform.invs.searchPh')" max-width="xs" />
        <UiSelect v-model="estadoFiltro" variant="toolbar" :prefix="t('platform.invs.colState')" :options="estadoOpciones" />
      </template>

      <template #cell-organizacion="{ row }">
        <NuxtLink
          v-if="row.organizaciones"
          :to="`/platform/organizaciones/${row.organizaciones.id}`"
          class="group flex min-w-0 items-center gap-3"
          data-tone="sky"
        >
          <!-- La organización no significa nada por sí misma: tono estable según su nombre -->
          <UiSymbol size="md" :tone="uiToneFor(row.organizaciones.nombre)" class="font-black text-(--tone-strong)">
            {{ row.organizaciones.nombre.charAt(0).toUpperCase() }}
          </UiSymbol>
          <!-- Enlace: en tinta como el resto de nombres; al pasar, cielo (los enlaces son cielo) -->
          <p class="truncate font-extrabold text-ink underline-offset-4 transition-colors group-hover:text-(--tone-strong) group-hover:underline">{{ row.organizaciones.nombre }}</p>
        </NuxtLink>
        <span v-else>—</span>
      </template>
      <template #cell-email="{ row }">
        <!-- A quién se invitó: su nombre y, debajo, su correo; si sigue pendiente, cómo quedó el envío -->
        <p v-if="nombreInvitado(row)" class="truncate font-extrabold text-ink">{{ nombreInvitado(row) }}</p>
        <p v-if="row.email" :class="['truncate font-semibold text-muted', nombreInvitado(row) && 'text-caption']">{{ row.email }}</p>
        <p v-else class="font-semibold italic text-subtle">{{ t('platform.invs.openLink') }}</p>
        <InvitacionCorreo v-if="row.email && row.estado === 'PENDIENTE'" :enviado-en="row.correo_enviado_en" :error="row.correo_error" />
      </template>
      <template #cell-estado="{ row }">
        <UiBadge :tone="invitacionTone(row.estado)" dot>{{ t('state.' + row.estado) }}</UiBadge>
      </template>
      <template #cell-vence="{ row }">
        <span class="text-caption font-semibold text-muted">{{ row.expira_en ? fechaCorta(row.expira_en, locale) : '—' }}</span>
      </template>
      <template #cell-acciones="{ row }">
        <!-- Acciones de tabla: neutras. Copiar confirma con el check durante un momento; reenviar el
             correo y revocar, mientras siga pendiente -->
        <div class="flex items-center justify-end gap-2">
          <UiButton
            tone="neutral"
            size="sm"
            :icon="copiado === row.token ? 'check' : 'link'"
            icon-only
            :label="copiado === row.token ? t('platform.invs.copied') : t('platform.invs.copyLink')"
            :title="copiado === row.token ? t('platform.invs.copied') : t('platform.invs.copyLink')"
            @click="copiarLink(row.token)"
          />
          <UiButton
            v-if="row.email && row.estado === 'PENDIENTE'"
            tone="neutral"
            size="sm"
            icon="send"
            icon-only
            :loading="reenviando === row.id"
            :label="t('invMail.resend')"
            :title="t('invMail.resend')"
            @click="reenviar(row)"
          />
          <UiButton
            v-if="row.estado === 'PENDIENTE'"
            tone="neutral"
            size="sm"
            icon="close"
            icon-only
            :label="t('platform.invs.revoke')"
            :title="t('platform.invs.revoke')"
            @click="revocar(row.id)"
          />
        </div>
      </template>
    </UiDataTable>
  </div>
</template>

<script setup lang="ts">
import type { InvitacionResumen } from '~/composables/usePlatform'
import { PAGE_SIZE } from '~/utils/paginacion'

definePageMeta({ layout: 'dashboard', titleKey: 'platform.invs.title', descKey: 'platform.invs.desc' })

const { t, locale } = useT()
const { listInvitacionesAdmin, revokeInvitacion } = usePlatform()

const invitaciones = ref<InvitacionResumen[]>([])
const total = ref(0)
const loading = ref(true)
const page = ref(1)
const q = ref('')
const estadoFiltro = ref('todas')
const copiado = ref<string | null>(null)

// «Reenviar correo»: toast del resultado y la página se vuelve a leer con el estado nuevo.
const { reenviando, reenviar } = useReenvioInvitacion(load)

const columns = computed(() => [
  { key: 'organizacion', label: t('platform.invs.colOrg') },
  // La más ancha: a quién se invitó y cómo quedó su correo
  { key: 'email', label: t('platform.invs.colInvitee'), grow: true },
  { key: 'estado', label: t('platform.invs.colState') },
  { key: 'vence', label: t('platform.invs.colExpires') },
  { key: 'acciones', label: t('platform.invs.colActions'), align: 'right' as const },
])

const estadoOpciones = computed(() => [
  { value: 'todas', label: t('common.all') },
  { value: 'PENDIENTE', label: t('state.PENDIENTE') },
  { value: 'USADA', label: t('state.USADA') },
  { value: 'REVOCADA', label: t('state.REVOCADA') },
  { value: 'EXPIRADA', label: t('state.EXPIRADA') },
])

const hayFiltros = computed(() => !!q.value || estadoFiltro.value !== 'todas')

async function load() {
  loading.value = true
  const { data, total: tt } = await listInvitacionesAdmin({
    q: q.value.trim() || undefined,
    estado: estadoFiltro.value,
    page: page.value,
  })
  invitaciones.value = data
  total.value = tt
  loading.value = false
}

onMounted(load)

function resetYCargar() {
  if (page.value !== 1) page.value = 1
  else load()
}

watch(estadoFiltro, resetYCargar)
watch(page, load)

let searchTimer: ReturnType<typeof setTimeout>
watch(q, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(resetYCargar, 300)
})

async function revocar(id: number) {
  await revokeInvitacion(id)
  await load()
}

async function copiarLink(token: string) {
  if (!(await copiarTexto(`${window.location.origin}/invitacion/${token}`))) {
    useToast().toast.error(t('invLink.copyFailed'))
    return
  }
  copiado.value = token
  setTimeout(() => (copiado.value = null), 1500)
}

</script>
