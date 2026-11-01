<template>
  <div class="mx-auto max-w-2xl">
    <UiPageHeader :title="t('collabs.newTitle')" :description="t('collabs.newDesc', { org })" />

    <form class="ui-panel p-6" @submit.prevent="submit">
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <!-- La organización la fija el contexto: aquí no se elige -->
        <div class="sm:col-span-2">
          <UiInput :model-value="org" :label="t('collabs.fOrg')" disabled :hint="t('collabs.fOrgHint')" />
        </div>
        <UiInput v-model="form.nombre" :label="t('collabs.fFirst')" required />
        <UiInput v-model="form.apellido" :label="t('collabs.fLast')" optional />
        <div class="sm:col-span-2">
          <UiInput v-model="form.email" type="email" :label="t('collabs.fEmail')" :placeholder="t('collabs.fEmailPh')" required />
        </div>
        <UiSelect v-model="form.idioma" :label="t('collabs.fLanguage')" :options="idiomaOptions" />
        <UiInput v-model="form.expira" type="date" :label="t('collabs.fExpires')" :min="hoy" />
      </div>
    </form>

    <UiAlert v-if="error" tone="danger" class="mt-4">{{ error }}</UiAlert>

    <!-- Crear la invitación la envía por correo y muestra su enlace para copiarlo (decisión 012) -->
    <div class="mt-5 flex items-center justify-end gap-3">
      <UiButton variant="outline" @click="navigateTo('/organizacion/colaboradores')">{{ t('common.cancel') }}</UiButton>
      <UiButton type="button" :loading="saving" @click="submit">{{ t('collabs.submit') }}</UiButton>
    </div>

    <InvitacionEnlace :invitacion="creada" :nombre="form.nombre" @done="navigateTo('/organizacion/colaboradores')" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { t } = useT()
const { orgActiva, administraOrgActiva } = useContexto()
const { invitar } = useColaboradores()

// Invitar es del admin de la org (la RLS lo exige igual): el colaborador no ve esta página.
if (isSupabaseConfigured() && !administraOrgActiva.value) {
  navigateTo('/organizacion', { replace: true })
}

const org = computed(() => orgActiva.value?.nombre ?? t('common.myOrg'))

// Días del calendario local; la invitación vence al final del día elegido.
const hoy = hoyLocal()

const form = reactive({
  email: '',
  nombre: '',
  apellido: '',
  idioma: 'es',
  expira: hoyLocal(30),
})

const idiomaOptions = computed(() => [
  { value: 'es', label: t('lang.es') },
  { value: 'en', label: t('lang.en') },
])

const saving = ref(false)
const error = ref('')
const creada = ref<{ id: number, token: string, email: string | null } | null>(null)

async function submit() {
  error.value = ''
  if (!form.nombre.trim()) {
    error.value = t('platform.invs.nameRequired')
    return
  }
  if (!form.email.trim()) {
    error.value = t('collabs.emailRequired')
    return
  }

  saving.value = true
  const { id, token, error: err } = await invitar({
    email: form.email.trim(),
    nombre: form.nombre,
    apellido: form.apellido,
    idioma: form.idioma,
    expira_en: form.expira ? finDelDia(form.expira) : null,
  })
  saving.value = false

  if (err) {
    error.value = err
    return
  }
  if (id !== null && token) creada.value = { id, token, email: form.email.trim() }
}
</script>
