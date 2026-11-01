<template>
  <div class="max-w-[640px] mx-auto">
    <UiPageHeader :title="t('admins.newTitle')" :description="t('admins.newDesc')" />
    <form class="ui-panel ui-panel-body space-y-4" @submit.prevent="handleSubmit">
      <div class="grid grid-cols-2 gap-3">
        <UiInput id="nombre" v-model="form.nombre" :label="t('platform.invs.firstName')" required />
        <UiInput id="apellido" v-model="form.apellido" :label="t('platform.invs.lastName')" optional />
      </div>
      <UiInput id="email" v-model="form.email" type="email" :label="t('admins.email')" :placeholder="t('admins.emailPh')" required />

      <div class="grid grid-cols-2 gap-3">
        <UiSelect v-model="form.idioma" :options="idiomaOpciones" :label="t('admins.language')" />
        <UiInput id="expira" v-model="form.expira" type="date" :label="t('admins.expiresLabel')" :min="hoy" />
      </div>

      <UiAlert v-if="error" tone="danger">{{ error }}</UiAlert>

      <!-- Crear la invitación muestra su enlace: Admin no envía correos (decisión 009) -->
      <div class="flex items-center justify-end gap-2 pt-2">
        <UiButton tone="neutral" size="sm" type="button" @click="volver">{{ t('common.cancel') }}</UiButton>
        <UiButton size="sm" type="submit" :loading="saving">{{ t('admins.submit') }}</UiButton>
      </div>
    </form>

    <InvitacionEnlace :token="token" :nombre="form.nombre" @done="volver" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', titleKey: 'admins.newTitle' })

const { t } = useT()
const { esTitularOrgActiva } = useContexto()
const { invitarAdministrador } = useOrganizacion()

// Invitar co-admins es del titular; cualquier otro cae de vuelta a la lista. (La RLS de
// 0005 lo exige también en la base: esto solo evita mostrar un formulario que fallaría.)
if (!esTitularOrgActiva.value) {
  navigateTo('/organizacion/administradores', { replace: true })
}

const saving = ref(false)
const error = ref('')
const token = ref<string | null>(null)

const idiomaOpciones = computed(() => [
  { value: 'es', label: t('lang.es') },
  { value: 'en', label: t('lang.en') },
])

// Días del calendario local; la invitación vence al final del día elegido.
const hoy = hoyLocal()

const form = ref({
  email: '',
  nombre: '',
  apellido: '',
  idioma: 'es',
  expira: hoyLocal(30),
})

function volver() {
  navigateTo('/organizacion/administradores')
}

async function handleSubmit() {
  error.value = ''
  if (!form.value.nombre.trim()) {
    error.value = t('platform.invs.nameRequired')
    return
  }
  if (!form.value.email.trim()) {
    error.value = t('admins.emailRequired')
    return
  }

  saving.value = true
  const { token: nuevo, error: err } = await invitarAdministrador({
    email: form.value.email.trim(),
    nombre: form.value.nombre,
    apellido: form.value.apellido,
    idioma: form.value.idioma,
    expira_en: form.value.expira ? finDelDia(form.value.expira) : null,
  })
  saving.value = false

  if (err) {
    error.value = err
    return
  }
  token.value = nuevo
}
</script>
