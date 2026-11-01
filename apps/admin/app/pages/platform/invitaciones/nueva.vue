<template>
  <div class="max-w-[640px] mx-auto">
    <UiPageHeader :title="t('platform.invs.newTitle')" />
    <form class="ui-panel ui-panel-body space-y-4" @submit.prevent="handleSubmit">
      <UiSelect v-model="form.organizacion_id" :options="orgOpciones" :label="t('platform.invs.org')" :placeholder="t('platform.invs.orgPh')" :disabled="orgLocked" />

      <div class="grid grid-cols-2 gap-3">
        <UiInput id="nombre" v-model="form.nombre" :label="t('platform.invs.firstName')" required />
        <UiInput id="apellido" v-model="form.apellido" :label="t('platform.invs.lastName')" optional />
      </div>
      <UiInput id="email" v-model="form.email" type="email" :label="t('platform.invs.email')" :placeholder="t('platform.invs.emailPh')" required />

      <!-- Titular: quien firma el contrato; uno por organización -->
      <div v-if="form.organizacion_id">
        <UiCheckbox v-model="form.titular" :label="t('platform.invs.titular')" />
        <p class="field-help mt-1.5">
          {{ !titularActual
            ? t('platform.invs.titularNone')
            : form.titular ? t('platform.invs.titularTransfer', { nombre: titularActual }) : t('platform.invs.titularCurrent', { nombre: titularActual }) }}
        </p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <UiSelect v-model="form.idioma" :options="idiomaOpciones" :label="t('platform.invs.language')" />
        <UiInput id="expira" v-model="form.expira" type="date" :label="t('platform.invs.expires')" :min="hoy" />
      </div>

      <UiAlert v-if="error" tone="danger">{{ error }}</UiAlert>

      <!-- Una sola acción principal (lima); cancelar, neutro. Crear la invitación muestra su enlace:
           Admin no envía correos (decisión 009) -->
      <div class="flex items-center justify-end gap-3 pt-2">
        <UiButton tone="neutral" type="button" @click="volver">{{ t('common.cancel') }}</UiButton>
        <UiButton type="submit" icon="link" :loading="saving">{{ t('platform.invs.submit') }}</UiButton>
      </div>
    </form>

    <InvitacionEnlace :token="token" :nombre="form.nombre" @done="volver" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', titleKey: 'platform.invs.newTitle' })

const { t } = useT()
const route = useRoute()
const { listOrganizacionesSimple, createInvitacionAdmin, titularDe } = usePlatform()

const orgs = ref<{ id: number, nombre: string }[]>([])
const saving = ref(false)
const error = ref('')
const token = ref<string | null>(null)

const preOrg = route.query.org ? Number(route.query.org) : null
const orgLocked = computed(() => preOrg !== null)

const orgOpciones = computed(() => orgs.value.map(o => ({ value: o.id, label: o.nombre })))
const idiomaOpciones = computed(() => [
  { value: 'es', label: t('lang.es') },
  { value: 'en', label: t('lang.en') },
])

// Días del calendario local; la invitación vence al final del día elegido.
const hoy = hoyLocal()

function enTreintaDias() {
  return hoyLocal(30)
}

const form = ref({
  organizacion_id: preOrg as number | null,
  email: '',
  nombre: '',
  apellido: '',
  titular: false,
  idioma: 'es',
  expira: enTreintaDias(),
})

// Sin titular, la invitación es de titular por defecto; si ya hay uno, se avisa de que pasaría.
const titularActual = ref<string | null>(null)
watch(() => form.value.organizacion_id, async (orgId) => {
  titularActual.value = orgId ? await titularDe(orgId) : null
  form.value.titular = !!orgId && !titularActual.value
}, { immediate: true })

onMounted(async () => {
  orgs.value = await listOrganizacionesSimple()
})

function volver() {
  navigateTo(preOrg ? `/platform/organizaciones/${preOrg}` : '/platform/invitaciones')
}

async function handleSubmit() {
  error.value = ''

  if (!form.value.organizacion_id) {
    error.value = t('platform.invs.pickOrg')
    return
  }
  if (!form.value.nombre.trim()) {
    error.value = t('platform.invs.nameRequired')
    return
  }
  if (!form.value.email.trim()) {
    error.value = t('platform.invs.emailRequired')
    return
  }

  saving.value = true
  const { data, error: err } = await createInvitacionAdmin({
    organizacion_id: form.value.organizacion_id,
    email: form.value.email.trim(),
    nombre: form.value.nombre,
    apellido: form.value.apellido,
    titular: form.value.titular,
    idioma: form.value.idioma,
    expira_en: form.value.expira ? finDelDia(form.value.expira) : null,
  })
  saving.value = false

  if (err) {
    error.value = err
    return
  }
  token.value = data?.token ?? null
}
</script>
