<template>
  <div class="max-w-[640px] mx-auto">
    <UiPageHeader :title="t('admins.editTitle')" :description="t('admins.editDesc')" />

    <div v-if="loading" class="ui-panel p-10 text-center text-body font-semibold text-subtle">{{ t('common.loading') }}</div>

    <form v-else-if="admin" class="ui-panel ui-panel-body space-y-4" @submit.prevent="handleSave">
      <div class="grid grid-cols-2 gap-3">
        <UiInput id="nombre" v-model="form.nombre" :label="t('auth.invite.firstName')" required />
        <UiInput id="apellido" v-model="form.apellido" :label="t('auth.invite.lastName')" />
      </div>

      <!-- El correo vive atado a la cuenta (auth): aquí solo se muestra -->
      <div>
        <label class="field-label">{{ t('admins.email') }}</label>
        <p class="field flex cursor-not-allowed select-all items-center bg-canvas text-muted">{{ admin.perfil?.email ?? '—' }}</p>
        <p class="field-help">{{ t('admins.emailLocked') }}</p>
      </div>

      <UiAlert v-if="error" tone="danger">{{ error }}</UiAlert>

      <div class="flex items-center justify-end gap-2 pt-2">
        <UiButton tone="neutral" size="sm" type="button" @click="volver">{{ t('common.cancel') }}</UiButton>
        <UiButton size="sm" type="submit" :loading="saving">{{ t('common.save') }}</UiButton>
      </div>
    </form>

    <div v-else class="ui-panel ui-text p-10 text-center">
      {{ t('admins.notFound') }}
      <NuxtLink to="/organizacion/administradores" class="ui-link ml-1" data-tone="sky">{{ t('platform.orgDetail.back') }}</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdminDeOrg } from '~/composables/useOrganizacion'

definePageMeta({ layout: 'dashboard', titleKey: 'admins.editTitle' })

const { t } = useT()
const route = useRoute()
const { esSuperadmin, esTitularOrgActiva } = useContexto()
const { getAdministrador, updateAdministrador } = useOrganizacion()
const { toast } = useToast()

// Editar admins es del titular o del superadmin (mismo gate que las acciones de la lista).
if (!esSuperadmin.value && !esTitularOrgActiva.value) {
  navigateTo('/organizacion/administradores', { replace: true })
}

const id = Number(route.params.id)
const admin = ref<AdminDeOrg | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const form = ref({ nombre: '', apellido: '' })

onMounted(async () => {
  admin.value = await getAdministrador(id)
  if (admin.value?.perfil) {
    form.value = {
      nombre: admin.value.perfil.nombre ?? '',
      apellido: admin.value.perfil.apellido ?? '',
    }
  }
  loading.value = false
})

function volver() {
  navigateTo('/organizacion/administradores')
}

async function handleSave() {
  error.value = ''
  if (!admin.value?.perfil) return
  if (!form.value.nombre.trim()) {
    error.value = t('admins.nameRequired')
    return
  }

  saving.value = true
  const { error: err } = await updateAdministrador(admin.value.perfil.id, form.value)
  saving.value = false

  if (err) {
    error.value = err
    return
  }
  toast.success(t('admins.saved'))
  volver()
}
</script>
