<template>
  <div class="max-w-[640px] mx-auto">
    <UiPageHeader :title="t('platform.lics.newTitle')" />
    <form class="space-y-5" @submit.prevent="handleSave">
      <section class="ui-panel">
        <div class="ui-panel-header">
          <h2 class="ui-title">{{ t('platform.lics.section') }}</h2>
        </div>
        <div class="ui-panel-body space-y-4">
          <UiSelect v-model="form.organizacion_id" :options="orgOpciones" :label="t('platform.lics.org')" :placeholder="t('platform.lics.orgPh')" :disabled="orgLocked" />

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

      <!-- Una sola acción principal (lima); cancelar, neutro -->
      <div class="flex items-center justify-end gap-3 pb-2">
        <UiButton tone="neutral" type="button" @click="volver">{{ t('common.cancel') }}</UiButton>
        <UiButton type="submit" :loading="saving">{{ t('platform.lics.create') }}</UiButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Enums } from '~/utils/db'
definePageMeta({ layout: 'dashboard', titleKey: 'platform.lics.newTitle' })

const { t } = useT()
const route = useRoute()
const { listOrganizacionesSimple, createLicencia } = usePlatform()

const orgs = ref<{ id: number, nombre: string }[]>([])
const saving = ref(false)
const error = ref('')

const preOrg = route.query.org ? Number(route.query.org) : null
const orgLocked = computed(() => preOrg !== null)

const orgOpciones = computed(() => orgs.value.map(o => ({ value: o.id, label: o.nombre })))
const estadoOpciones = computed(() => [
  { value: 'ACTIVA', label: t('state.ACTIVA') },
  { value: 'TRIAL', label: t('state.TRIAL') },
  { value: 'SUSPENDIDA', label: t('state.SUSPENDIDA') },
  { value: 'VENCIDA', label: t('state.VENCIDA') },
])

function hoy() {
  return hoyLocal()
}

const form = ref({
  organizacion_id: preOrg as number | null,
  estado: 'ACTIVA' as Enums<'estado_licencia'>,
  fecha_inicio: hoy(),
  fecha_fin: '' as string,
  notas: '',
})

onMounted(async () => {
  orgs.value = await listOrganizacionesSimple()
})

function volver() {
  navigateTo(preOrg ? `/platform/organizaciones/${preOrg}` : '/platform/licencias')
}

async function handleSave() {
  error.value = ''
  if (!form.value.organizacion_id) {
    error.value = t('platform.lics.pickOrg')
    return
  }

  saving.value = true
  const { error: err } = await createLicencia({
    organizacion_id: form.value.organizacion_id,
    estado: form.value.estado,
    fecha_inicio: form.value.fecha_inicio || hoy(),
    fecha_fin: form.value.fecha_fin || null,
    notas: form.value.notas,
  })
  saving.value = false

  if (err) {
    error.value = err
    return
  }
  volver()
}
</script>
