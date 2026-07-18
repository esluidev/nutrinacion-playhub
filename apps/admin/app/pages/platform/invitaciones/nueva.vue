<template>
  <div class="max-w-xl mx-auto">
    <form class="card p-6 space-y-4" @submit.prevent="handleSubmit">
      <div class="space-y-1.5">
        <label class="block text-sm font-semibold text-gray-700">{{ t('platform.invs.org') }}</label>
        <UiSelect v-model="form.organizacion_id" :options="orgOpciones" size="md" :placeholder="t('platform.invs.orgPh')" :disabled="orgLocked" />
      </div>

      <UiInput id="email" v-model="form.email" type="email" :label="t('platform.invs.email')" :placeholder="t('platform.invs.emailPh')" required />

      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1.5">
          <label class="block text-sm font-semibold text-gray-700">{{ t('platform.invs.language') }}</label>
          <UiSelect v-model="form.idioma" :options="idiomaOpciones" size="md" />
        </div>
        <UiInput id="expira" v-model="form.expira" type="date" :label="t('platform.invs.expires')" :min="hoy" />
      </div>

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
      <p v-if="ok" class="text-sm text-brand-primary-600">{{ t('platform.invs.sent') }}</p>

      <div class="flex items-center justify-end gap-2 pt-2">
        <UiButton variant="outline" size="sm" type="button" @click="volver">{{ t('common.cancel') }}</UiButton>
        <UiButton size="sm" type="submit" :loading="saving">{{ t('platform.invs.submit') }}</UiButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', titleKey: 'platform.invs.newTitle' })

const { t } = useT()
const route = useRoute()
const { listOrganizacionesSimple, createInvitacionAdmin } = usePlatform()

const orgs = ref<{ id: number, nombre: string }[]>([])
const saving = ref(false)
const error = ref('')
const ok = ref(false)

const preOrg = route.query.org ? Number(route.query.org) : null
const orgLocked = computed(() => preOrg !== null)

const orgOpciones = computed(() => orgs.value.map(o => ({ value: o.id, label: o.nombre })))
const idiomaOpciones = computed(() => [
  { value: 'es', label: t('lang.es') },
  { value: 'en', label: t('lang.en') },
])

const hoy = new Date().toISOString().slice(0, 10)

function enTreintaDias() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

const form = ref({
  organizacion_id: preOrg as number | null,
  email: '',
  idioma: 'es',
  expira: enTreintaDias(),
})

onMounted(async () => {
  orgs.value = await listOrganizacionesSimple()
})

function volver() {
  navigateTo(preOrg ? `/platform/organizaciones/${preOrg}` : '/platform/invitaciones')
}

async function handleSubmit() {
  error.value = ''
  ok.value = false

  if (!form.value.organizacion_id) {
    error.value = t('platform.invs.pickOrg')
    return
  }
  if (!form.value.email.trim()) {
    error.value = t('platform.invs.emailRequired')
    return
  }

  saving.value = true
  const { error: err } = await createInvitacionAdmin({
    organizacion_id: form.value.organizacion_id,
    email: form.value.email.trim(),
    idioma: form.value.idioma,
    expira_en: form.value.expira ? new Date(form.value.expira).toISOString() : null,
  })
  saving.value = false

  if (err) {
    error.value = err
    return
  }
  ok.value = true
  setTimeout(volver, 900)
}
</script>
