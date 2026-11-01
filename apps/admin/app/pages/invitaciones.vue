<template>
  <div>
    <UiPageHeader :title="t('inbox.title')" :description="t('inbox.desc')" />

    <!-- Pendientes: lo accionable primero. Aceptar es la acción principal (lima); rechazar, neutra. -->
    <div class="mb-8">
      <h2 class="ui-title mb-3">{{ t('inbox.pending') }}</h2>
      <UiDataTable
        :columns="colsPendientes"
        :rows="pendientes"
        :row-key="(i) => i.id"
        :loading="loading"
        :empty-text="t('inbox.noPending')"
      >
        <template #cell-invitacion="{ row }">
          <p class="font-extrabold text-ink">{{ titulo(row) }}</p>
          <p class="ui-caption">{{ subtitulo(row) }}</p>
        </template>
        <template #cell-vence="{ row }">
          <span class="ui-caption">{{ row.expira_en ? fechaCorta(row.expira_en, locale) : '—' }}</span>
        </template>
        <template #cell-acciones="{ row }">
          <div class="flex justify-end gap-2">
            <UiButton
              size="sm"
              icon="check"
              :disabled="!!respondiendo"
              @click="responderA(row, 'aceptar')"
            >
              {{ t('inbox.accept') }}
            </UiButton>
            <UiButton
              size="sm"
              variant="outline"
              :disabled="!!respondiendo"
              @click="responderA(row, 'rechazar')"
            >
              {{ t('inbox.decline') }}
            </UiButton>
          </div>
        </template>
      </UiDataTable>
    </div>

    <!-- Historial: lo ya resuelto -->
    <div>
      <h2 class="ui-title mb-3">{{ t('inbox.history') }}</h2>
      <UiDataTable
        :columns="colsHistorial"
        :rows="historial"
        :row-key="(i) => i.id"
        :loading="loading"
        :empty-text="t('inbox.noHistory')"
      >
        <template #cell-invitacion="{ row }">
          <p class="font-extrabold text-ink">{{ titulo(row) }}</p>
          <p class="ui-caption">{{ subtitulo(row) }}</p>
        </template>
        <template #cell-estado="{ row }">
          <UiBadge :tone="estadoTone(row)">{{ t('state.' + estadoReal(row)) }}</UiBadge>
        </template>
        <template #cell-fecha="{ row }">
          <span class="ui-caption">{{ fechaCorta(row.created_at, locale) }}</span>
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
const { setOrg } = useContexto()
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
// Color = significado, el mismo que en Platform (utils/tonos.ts).
function estadoTone(i: InvitacionMia) {
  return invitacionTone(estadoReal(i))
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
        label: t('inbox.enter'),
        onClick: () => {
          if (!i.organizaciones) return
          setOrg(i.organizaciones.id)
          navigateTo('/organizacion')
        },
      },
    })
  }
  await cargar()
}

</script>
