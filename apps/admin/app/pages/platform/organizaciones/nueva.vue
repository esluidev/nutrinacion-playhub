<template>
  <div class="max-w-[640px] mx-auto">
    <UiPageHeader :title="t('platform.orgs.newTitle')" />
    <form class="space-y-[18px]" @submit.prevent="handleSave">
      <div class="card p-6 space-y-4">
        <h2 class="section-title">{{ t('platform.orgs.dataSection') }}</h2>

        <UiInput id="nombre" v-model="form.nombre" :label="t('platform.orgs.name')" placeholder="Colegio San Jose" required />

        <div class="space-y-1.5">
          <label class="block text-sm font-semibold text-gray-700">{{ t('platform.orgs.type') }}</label>
          <UiSelect v-model="form.tipo_id" :options="tipoOpciones" size="md" :placeholder="t('platform.orgs.typePh')" />
        </div>

        <UiInput id="correo" v-model="form.correo" type="email" :label="t('platform.orgs.email')" :placeholder="t('platform.orgs.emailPh')" />

        <div class="grid gap-4 sm:grid-cols-2">
          <UiInput id="telefono" v-model="form.telefono" :label="t('platform.orgs.phone')" :placeholder="t('platform.orgs.phonePh')" />
          <UiInput id="website" v-model="form.website" type="url" :label="t('platform.orgs.website')" :placeholder="t('platform.orgs.websitePh')" />
        </div>
      </div>

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

      <div class="flex items-center justify-end gap-2 pt-1 pb-2">
        <UiButton variant="outline" size="sm" type="button" @click="navigateTo('/platform/organizaciones')">{{ t('common.cancel') }}</UiButton>
        <UiButton size="sm" type="submit" :loading="saving">{{ t('common.create') }}</UiButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', titleKey: 'platform.orgs.newTitle' })

const { t } = useT()
const { listTiposOrganizacion, createOrganizacion } = usePlatform()

const tipos = ref<{ id: number, codigo: string, nombre: Record<string, string> }[]>([])
const saving = ref(false)
const error = ref('')

const tipoOpciones = computed(() => tipos.value.map(x => ({ value: x.id, label: x.nombre?.es ?? x.codigo })))

const form = ref({ nombre: '', correo: '', telefono: '', website: '', tipo_id: null as number | null })

onMounted(async () => {
  tipos.value = await listTiposOrganizacion()
})

async function handleSave() {
  error.value = ''
  if (!form.value.nombre.trim()) {
    error.value = t('platform.orgs.nameRequired')
    return
  }

  saving.value = true
  const { id, error: err } = await createOrganizacion({
    nombre: form.value.nombre,
    correo: form.value.correo,
    telefono: form.value.telefono,
    website: form.value.website,
    tipo_id: form.value.tipo_id,
  })
  saving.value = false

  if (err) {
    error.value = err
    return
  }
  navigateTo(`/platform/organizaciones/${id}`)
}
</script>
