<template>
  <div>
    <!-- Pendientes: lo accionable primero -->
    <div class="mb-8">
      <h2 class="section-title mb-3">{{ t('inbox.pending') }}</h2>
      <UiDataTable
        :columns="colsPendientes"
        :rows="pendientes"
        :row-key="(i) => i.id"
        :loading="loading"
        :empty-text="t('inbox.noPending')"
      >
        <template #cell-invitacion="{ row }">
          <p class="font-semibold text-brand-dark">{{ titulo(row) }}</p>
          <p class="text-xs text-gray-400">{{ subtitulo(row) }}</p>
        </template>
        <template #cell-vence="{ row }">
          <span class="text-xs text-gray-400">{{ row.expira_en ? fechaCorta(row.expira_en) : '—' }}</span>
        </template>
        <template #cell-acciones="{ row }">
          <button
            class="text-xs text-brand-primary-600 font-semibold hover:underline disabled:opacity-40"
            :disabled="!!respondiendo"
            @click="responderA(row, 'aceptar')"
          >
            {{ t('inbox.accept') }}
          </button>
          <button
            class="text-xs text-gray-500 font-semibold hover:underline ml-3 disabled:opacity-40"
            :disabled="!!respondiendo"
            @click="responderA(row, 'rechazar')"
          >
            {{ t('inbox.decline') }}
          </button>
        </template>
      </UiDataTable>
    </div>

    <!-- Historial: lo ya resuelto -->
    <div>
      <h2 class="section-title mb-3">{{ t('inbox.history') }}</h2>
      <UiDataTable
        :columns="colsHistorial"
        :rows="historial"
        :row-key="(i) => i.id"
        :loading="loading"
        :empty-text="t('inbox.noHistory')"
      >
        <template #cell-invitacion="{ row }">
          <p class="font-medium text-brand-dark">{{ titulo(row) }}</p>
          <p class="text-xs text-gray-400">{{ subtitulo(row) }}</p>
        </template>
        <template #cell-estado="{ row }">
          <UiBadge :variant="estadoVariant(row)">{{ t('state.' + estadoReal(row)) }}</UiBadge>
        </template>
        <template #cell-fecha="{ row }">
          <span class="text-xs text-gray-400">{{ fechaCorta(row.created_at) }}</span>
        </template>
      </UiDataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InvitacionMia } from '~/composables/useInvitaciones'

definePageMeta({ layout: 'dashboard', titleKey: 'inbox.title', descKey: 'inbox.desc' })

const { t, locale } = useT()
const { pendientes, vigente, titulo, subtitulo, listMias, refreshPendientes, responder } = useInvitaciones()
const { setContexto } = useContexto()
const { toast } = useToast()

const todas = ref<InvitacionMia[]>([])
const loading = ref(true)
const respondiendo = ref<number | null>(null)

// Historial = todo lo que ya no es accionable (aceptada, rechazada, revocada… o vencida).
const historial = computed(() => todas.value.filter(i => !vigente(i)))

const colsPendientes = computed(() => [
  { key: 'invitacion', label: t('inbox.colFrom') },
  { key: 'vence', label: t('platform.invs.colExpires') },
  { key: 'acciones', label: '', align: 'right' as const },
])
const colsHistorial = computed(() => [
  { key: 'invitacion', label: t('inbox.colFrom') },
  { key: 'estado', label: t('platform.invs.colState') },
  { key: 'fecha', label: t('inbox.colDate') },
])

// Una invitación PENDIENTE que ya pasó su fecha se muestra como EXPIRADA aunque la BD no lo sepa.
function estadoReal(i: InvitacionMia) {
  return i.estado === 'PENDIENTE' && !vigente(i) ? 'EXPIRADA' : i.estado
}
function estadoVariant(i: InvitacionMia): 'green' | 'blue' | 'red' | 'gray' {
  const map: Record<string, 'green' | 'blue' | 'red' | 'gray'> = {
    USADA: 'green', PENDIENTE: 'blue', RECHAZADA: 'gray', REVOCADA: 'red', EXPIRADA: 'gray',
  }
  return map[estadoReal(i)] ?? 'gray'
}

async function cargar() {
  loading.value = true
  todas.value = await listMias()
  await refreshPendientes()
  loading.value = false
}

onMounted(cargar)

async function responderA(i: InvitacionMia, accion: 'aceptar' | 'rechazar') {
  respondiendo.value = i.id
  const { error: err } = await responder(i.token, accion)
  respondiendo.value = null

  if (err) {
    toast.error(err)
    return
  }

  if (accion === 'rechazar') {
    toast.info(t('inbox.declined'))
  }
  else {
    // Aceptar cambia lo que puedes tocar. En vez de dejar que la persona lo descubra sola,
    // el aviso le dice qué ganó y le ofrece ir directo — el contexto ya quedó cargado.
    toast.success(t('inbox.accepted'), {
      accion: {
        label: t('coms.enter'),
        onClick: () => {
          if (!i.organizaciones) return
          setContexto(i.organizaciones.id, i.comunidades?.id ?? null)
          navigateTo(i.comunidades ? '/dashboard' : '/organizacion/comunidades')
        },
      },
    })
  }
  await cargar()
}

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
