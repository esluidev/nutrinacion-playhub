<template>
  <div class="max-w-[640px] mx-auto">
    <UiPageHeader :title="t('admins.editTitle')" :description="t('admins.editDesc')" />

    <div v-if="loading" class="card p-10 text-center text-sm text-gray-400">{{ t('common.loading') }}</div>

    <form v-else-if="admin" class="card p-6 space-y-4" @submit.prevent="handleSave">
      <div class="grid grid-cols-2 gap-3">
        <UiInput id="nombre" v-model="form.nombre" :label="t('auth.invite.firstName')" required />
        <UiInput id="apellido" v-model="form.apellido" :label="t('auth.invite.lastName')" />
      </div>

      <!-- El correo vive atado a la cuenta (auth): aquí solo se muestra -->
      <div class="space-y-1.5">
        <label class="block text-sm font-semibold text-gray-700">{{ t('admins.email') }}</label>
        <p class="input flex items-center !bg-gray-50 text-gray-500 cursor-not-allowed select-all">{{ admin.perfil?.email ?? '—' }}</p>
        <p class="text-[11.5px] text-gray-400">{{ t('admins.emailLocked') }}</p>
      </div>

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

      <div class="flex items-center justify-end gap-2 pt-2">
        <UiButton variant="outline" size="sm" type="button" @click="volver">{{ t('common.cancel') }}</UiButton>
        <UiButton size="sm" type="submit" :loading="saving">{{ t('common.save') }}</UiButton>
      </div>
    </form>

    <div v-else class="card p-10 text-center text-sm text-gray-500">
      {{ t('admins.notFound') }}
      <NuxtLink to="/organizacion/administradores" class="text-brand-primary-700 font-semibold ml-1">{{ t('platform.orgDetail.back') }}</NuxtLink>
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
