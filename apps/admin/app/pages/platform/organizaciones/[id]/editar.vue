<template>
  <div class="max-w-3xl mx-auto">
    <div v-if="loading" class="card p-10 text-center text-sm text-gray-400">{{ t('common.loading') }}</div>

    <form v-else class="space-y-5" @submit.prevent="handleSave">
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
        <UiButton variant="outline" size="sm" type="button" @click="navigateTo(`/platform/organizaciones/${id}`)">{{ t('common.cancel') }}</UiButton>
        <UiButton size="sm" type="submit" :loading="saving">{{ t('common.save') }}</UiButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', titleKey: 'platform.orgs.editTitle' })

const { t } = useT()
const route = useRoute()
const id = Number(route.params.id)
const { getOrganizacion, listTiposOrganizacion, updateOrganizacion } = usePlatform()

const tipos = ref<{ id: number, codigo: string, nombre: Record<string, string> }[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const tipoOpciones = computed(() => tipos.value.map(x => ({ value: x.id, label: x.nombre?.es ?? x.codigo })))

const form = ref({ nombre: '', correo: '', telefono: '', website: '', tipo_id: null as number | null })

onMounted(async () => {
  tipos.value = await listTiposOrganizacion()
  const { data } = await getOrganizacion(id)
  if (data) {
    form.value = {
      nombre: (data as any).nombre ?? '',
      correo: (data as any).correo ?? '',
      telefono: (data as any).telefono ?? '',
      website: (data as any).website ?? '',
      tipo_id: (data as any).tipo_id ?? null,
    }
  }
  loading.value = false
})

async function handleSave() {
  error.value = ''
  if (!form.value.nombre.trim()) {
    error.value = t('platform.orgs.nameRequired')
    return
  }

  saving.value = true
  const { error: err } = await updateOrganizacion(id, {
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
