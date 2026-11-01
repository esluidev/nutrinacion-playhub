<template>
  <div class="max-w-[640px] mx-auto">
    <UiPageHeader :title="t('platform.lics.editTitle')" />
    <div v-if="loading" class="ui-panel p-10 text-center font-semibold text-subtle">{{ t('common.loading') }}</div>

    <div v-else-if="!cargada" class="ui-panel p-10 text-center font-semibold text-muted">
      {{ t('platform.lics.notFound') }}
      <NuxtLink to="/platform/licencias" class="ui-link ml-1" data-tone="sky">{{ t('platform.orgDetail.back') }}</NuxtLink>
    </div>

    <form v-else class="space-y-5" @submit.prevent="handleSave">
      <section class="ui-panel">
        <div class="ui-panel-header">
          <h2 class="ui-title">{{ t('platform.lics.section') }}</h2>
          <div v-if="orgNombre" class="flex min-w-0 items-center gap-2">
            <!-- La organización, con su tono estable (el mismo que en las tablas de Platform) -->
            <UiSymbol size="sm" :tone="uiToneFor(orgNombre)">{{ orgNombre.charAt(0).toUpperCase() }}</UiSymbol>
            <span class="truncate font-semibold text-muted">{{ orgNombre }}</span>
          </div>
        </div>
        <div class="ui-panel-body space-y-4">
          <!-- La licencia es el contrato: estado, vigencia y notas (decisión 011). Sin cupos ni
               países: los países donde opera son de la organización. -->
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <UiSelect v-model="form.estado" :options="estadoOpciones" :label="t('platform.lics.state')" />
            <UiInput id="fecha_inicio" v-model="form.fecha_inicio" type="date" :label="t('platform.lics.start')" />
            <UiInput id="fecha_fin" v-model="form.fecha_fin" type="date" :label="t('platform.lics.end')" :min="form.fecha_inicio" />
          </div>

          <UiTextarea id="notas" v-model="form.notas" :rows="2" :label="t('platform.lics.notes')" :placeholder="t('platform.lics.notesPh')" />
        </div>
      </section>

      <UiAlert v-if="error" tone="danger">{{ error }}</UiAlert>

      <!-- Eliminar en coral, aparte; a la derecha, cancelar neutro y una sola acción principal (lima) -->
      <div class="flex items-center justify-between gap-3 pb-2">
        <UiButton tone="coral" icon="trash" type="button" @click="borrando = true">
          {{ t('common.delete') }}
        </UiButton>
        <div class="flex items-center gap-3">
          <UiButton tone="neutral" type="button" @click="navigateTo('/platform/licencias')">{{ t('common.cancel') }}</UiButton>
          <UiButton type="submit" :loading="saving">{{ t('common.save') }}</UiButton>
        </div>
      </div>
    </form>

    <UiConfirmDialog
      :open="borrando"
      :title="t('platform.lics.deleteTitle')"
      :confirm-label="t('common.delete')"
      :loading="deleting"
      @update:open="(v) => borrando = v"
      @confirm="handleDelete"
    >
      <p>{{ t('platform.lics.deleteWarn', { org: orgNombre || '—', vigencia }) }}</p>
      <p class="mt-3">{{ t('platform.lics.deleteEffect') }}</p>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import type { Enums } from '~/utils/db'
definePageMeta({ layout: 'dashboard', titleKey: 'platform.lics.editTitle' })

const { t } = useT()
const route = useRoute()
const id = Number(route.params.id)
const { getLicencia, updateLicencia, deleteLicencia } = usePlatform()

const loading = ref(true)
const cargada = ref(false)
const saving = ref(false)
const deleting = ref(false)
const error = ref('')
const orgNombre = ref('')

const estadoOpciones = computed(() => [
  { value: 'ACTIVA', label: t('state.ACTIVA') },
  { value: 'TRIAL', label: t('state.TRIAL') },
  { value: 'SUSPENDIDA', label: t('state.SUSPENDIDA') },
  { value: 'VENCIDA', label: t('state.VENCIDA') },
])

const form = ref({
  estado: 'ACTIVA' as Enums<'estado_licencia'>,
  fecha_inicio: '',
  fecha_fin: '' as string,
  notas: '',
})

onMounted(async () => {
  const lic = await getLicencia(id) as any
  if (lic) {
    cargada.value = true
    orgNombre.value = lic.organizaciones?.nombre ?? ''
    form.value = {
      estado: lic.estado,
      fecha_inicio: lic.fecha_inicio ?? '',
      fecha_fin: lic.fecha_fin ?? '',
      notas: lic.notas ?? '',
    }
  }
  loading.value = false
})

async function handleSave() {
  error.value = ''
  saving.value = true
  const { error: err } = await updateLicencia(id, {
    estado: form.value.estado,
    fecha_inicio: form.value.fecha_inicio,
    fecha_fin: form.value.fecha_fin || null,
    notas: form.value.notas,
  })
  saving.value = false
  if (err) {
    error.value = err
    return
  }
  navigateTo('/platform/licencias')
}

// ── Eliminar ─────────────────────────────────────────────────────────────────
const borrando = ref(false)
const { locale } = useT()
const vigencia = computed(() => form.value.fecha_inicio
  ? `${fechaCorta(form.value.fecha_inicio, locale.value)} — ${form.value.fecha_fin ? fechaCorta(form.value.fecha_fin, locale.value) : t('platform.lics.noExpiry')}`
  : '—')

async function handleDelete() {
  deleting.value = true
  const { error: err } = await deleteLicencia(id)
  deleting.value = false
  if (err) {
    borrando.value = false
    error.value = err
    return
  }
  useToast().toast.success(t('platform.lics.deleted'))
  navigateTo('/platform/licencias')
}
</script>
