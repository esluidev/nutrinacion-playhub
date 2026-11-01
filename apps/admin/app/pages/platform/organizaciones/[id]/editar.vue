<template>
  <div class="max-w-[640px] mx-auto">
    <UiPageHeader :title="t('platform.orgs.editTitle')" />
    <div v-if="loading" class="ui-panel p-10 text-center font-semibold text-subtle">{{ t('common.loading') }}</div>

    <form v-else class="space-y-5" @submit.prevent="handleSave">
      <section class="ui-panel">
        <div class="ui-panel-header">
          <h2 class="ui-title">{{ t('platform.orgs.dataSection') }}</h2>
        </div>
        <div class="ui-panel-body space-y-4">
          <UiInput id="nombre" v-model="form.nombre" :label="t('platform.orgs.name')" placeholder="Colegio San Jose" required />

          <UiSelect v-model="form.tipo_id" :options="tipoOpciones" :label="t('platform.orgs.type')" :placeholder="t('platform.orgs.typePh')" />

          <!-- Los países donde opera: deciden qué storyboards estándar tiene (decisión 011) -->
          <PaisesSelector v-model="form.paises" :label="t('platform.orgs.countries')" :hint="t('platform.orgs.countriesHint')" :error="errorPaises" />

          <UiInput id="correo" v-model="form.correo" type="email" :label="t('platform.orgs.email')" :placeholder="t('platform.orgs.emailPh')" />

          <div class="grid gap-4 sm:grid-cols-2">
            <UiInput id="telefono" v-model="form.telefono" :label="t('platform.orgs.phone')" :placeholder="t('platform.orgs.phonePh')" />
            <UiInput id="website" v-model="form.website" type="url" :label="t('platform.orgs.website')" :placeholder="t('platform.orgs.websitePh')" />
          </div>
        </div>
      </section>

      <UiAlert v-if="error" tone="danger">{{ error }}</UiAlert>

      <!-- Una sola acción principal (lima); cancelar, neutro -->
      <div class="flex items-center justify-end gap-3 pb-2">
        <UiButton tone="neutral" type="button" @click="navigateTo(`/platform/organizaciones/${id}`)">{{ t('common.cancel') }}</UiButton>
        <UiButton type="submit" :loading="saving">{{ t('common.save') }}</UiButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', titleKey: 'platform.orgs.editTitle' })

const { t, locale } = useT()
const route = useRoute()
const id = Number(route.params.id)
const { getOrganizacion, listTiposOrganizacion, updateOrganizacion } = usePlatform()

const tipos = ref<{ id: number, codigo: string, nombre: Record<string, string> }[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const errorPaises = ref('')

const tipoOpciones = computed(() => tipos.value.map(x => ({ value: x.id, label: x.nombre?.[locale.value] ?? x.nombre?.es ?? x.codigo })))

const form = ref({ nombre: '', correo: '', telefono: '', website: '', tipo_id: null as number | null, paises: [] as string[] })

onMounted(async () => {
  tipos.value = await listTiposOrganizacion()
  const { data } = await getOrganizacion(id)
  if (data) {
    form.value = {
      nombre: data.nombre ?? '',
      correo: data.correo ?? '',
      telefono: data.telefono ?? '',
      website: data.website ?? '',
      tipo_id: data.tipo_id ?? null,
      paises: [...(data.paises ?? [])],
    }
  }
  loading.value = false
})

async function handleSave() {
  error.value = ''
  errorPaises.value = ''
  if (!form.value.nombre.trim()) {
    error.value = t('platform.orgs.nameRequired')
    return
  }
  if (!form.value.paises.length) {
    errorPaises.value = t('platform.orgs.countriesRequired')
    return
  }

  saving.value = true
  const { error: err } = await updateOrganizacion(id, {
    nombre: form.value.nombre,
    correo: form.value.correo,
    telefono: form.value.telefono,
    website: form.value.website,
    tipo_id: form.value.tipo_id,
    paises: form.value.paises,
  })
  saving.value = false

  if (err) {
    error.value = err
    return
  }
  navigateTo(`/platform/organizaciones/${id}`)
}
</script>
