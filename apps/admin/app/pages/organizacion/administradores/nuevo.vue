<template>
  <div class="max-w-[640px] mx-auto">
    <UiPageHeader :title="t('admins.newTitle')" :description="t('admins.newDesc')" />
    <form class="card p-6 space-y-4" @submit.prevent="handleSubmit">
      <UiInput id="email" v-model="form.email" type="email" :label="t('admins.email')" :placeholder="t('admins.emailPh')" required />

      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1.5">
          <label class="block text-sm font-semibold text-gray-700">{{ t('admins.language') }}</label>
          <UiSelect v-model="form.idioma" :options="idiomaOpciones" size="md" />
        </div>
        <UiInput id="expira" v-model="form.expira" type="date" :label="t('admins.expiresLabel')" :min="hoy" />
      </div>

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

      <div class="flex items-center justify-end gap-2 pt-2">
        <UiButton variant="outline" size="sm" type="button" @click="volver">{{ t('common.cancel') }}</UiButton>
        <UiButton size="sm" type="submit" :loading="saving">{{ t('admins.submit') }}</UiButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', titleKey: 'admins.newTitle' })

const { t } = useT()
const { esTitularOrgActiva } = useContexto()
const { invitarAdministrador } = useOrganizacion()
const { toast } = useToast()

// Invitar co-admins es del titular; cualquier otro cae de vuelta a la lista. (La RLS de
// 0006 lo exige también en la base: esto solo evita mostrar un formulario que fallaría.)
if (!esTitularOrgActiva.value) {
  navigateTo('/organizacion/administradores', { replace: true })
}

const saving = ref(false)
const error = ref('')

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
  email: '',
  idioma: 'es',
  expira: enTreintaDias(),
})

function volver() {
  navigateTo('/organizacion/administradores')
}

async function handleSubmit() {
  error.value = ''
  if (!form.value.email.trim()) {
    error.value = t('admins.emailRequired')
    return
  }

  saving.value = true
  const { error: err } = await invitarAdministrador({
    email: form.value.email.trim(),
    idioma: form.value.idioma,
    expira_en: form.value.expira ? new Date(form.value.expira).toISOString() : null,
  })
  saving.value = false

  if (err) {
    error.value = err
    return
  }
  toast.success(t('admins.sent'))
  volver()
}
</script>
