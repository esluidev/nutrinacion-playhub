<template>
  <div class="max-w-[640px] mx-auto">
    <UiPageHeader :title="t('coms.editTitle')" />
    <div v-if="loading" class="ui-panel p-10 text-center text-body font-semibold text-subtle">{{ t('common.loading') }}</div>

    <form v-else class="space-y-5" @submit.prevent="handleSave">
      <div class="ui-panel ui-panel-body space-y-4">
        <h2 class="ui-title">{{ t('coms.section') }}</h2>

        <UiInput id="nombre" v-model="form.nombre" :label="t('coms.name')" :placeholder="t('coms.namePh')" required />

        <UiTextarea id="descripcion" v-model="form.descripcion" :label="t('coms.description')" :rows="2" />

        <div class="grid gap-4 sm:grid-cols-2">
          <UiInput id="correo" v-model="form.correo" type="email" :label="t('coms.email')" placeholder="sede@organizacion.com" />
          <UiInput id="telefono" v-model="form.telefono" :label="t('coms.phone')" placeholder="+503 0000 0000" />
        </div>

        <UiSelect v-model="form.pais" :options="paisOpciones" :label="t('coms.country')" :placeholder="t('coms.countryPh')" />
      </div>

      <UiAlert v-if="error" tone="danger">{{ error }}</UiAlert>

      <div class="flex items-center justify-end gap-2 pt-1 pb-2">
        <UiButton tone="neutral" size="sm" type="button" @click="navigateTo('/organizacion/comunidades')">{{ t('common.cancel') }}</UiButton>
        <UiButton size="sm" type="submit" :loading="saving">{{ t('common.save') }}</UiButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', titleKey: 'coms.editTitle' })

const { t } = useT()
const route = useRoute()
const id = Number(route.params.id)
const { get, update } = useComunidades()
const { listPaises } = usePlatform()
const { fetchUser } = useAuth()

const paises = ref<{ codigo: string, nombre: Record<string, string>, bandera: string | null }[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const form = ref({
  nombre: '', descripcion: '', correo: '', telefono: '',
  pais: null as string | null,
  organizacion_id: 0,
})

const paisOpciones = computed(() =>
  paises.value.map(p => ({ value: p.codigo, label: `${p.bandera ?? ''} ${p.nombre?.es ?? p.codigo}`.trim() })))

onMounted(async () => {
  paises.value = await listPaises()
  const data = await get(id) as Record<string, unknown> | null
  if (data) {
    form.value = {
      nombre: (data.nombre as string) ?? '',
      descripcion: (data.descripcion as string) ?? '',
      correo: (data.correo as string) ?? '',
      telefono: (data.telefono as string) ?? '',
      pais: (data.pais as string) ?? null,
      organizacion_id: (data.organizacion_id as number) ?? 0,
    }
  }
  loading.value = false
})

async function handleSave() {
  error.value = ''
  if (!form.value.nombre.trim()) {
    error.value = t('coms.nameRequired')
    return
  }
  if (!form.value.pais) {
    error.value = t('coms.countryRequired')
    return
  }

  saving.value = true
  const { error: err } = await update(id, { ...form.value, pais: form.value.pais })
  saving.value = false

  if (err) {
    error.value = err
    return
  }

  // El nombre puede haber cambiado: el switcher lo lee de la superficie de acceso.
  await fetchUser()
  navigateTo('/organizacion/comunidades')
}
</script>
