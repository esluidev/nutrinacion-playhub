<template>
  <div class="max-w-3xl mx-auto">
    <form class="space-y-5" @submit.prevent="handleSave">
      <div class="card p-6 space-y-4">
        <h2 class="section-title">{{ t('coms.section') }}</h2>

        <UiInput id="nombre" v-model="form.nombre" :label="t('coms.name')" :placeholder="t('coms.namePh')" required />

        <div class="space-y-1.5">
          <label for="descripcion" class="block text-sm font-semibold text-gray-700">{{ t('coms.description') }}</label>
          <textarea id="descripcion" v-model="form.descripcion" rows="2" class="input !h-auto py-2" />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <UiInput id="correo" v-model="form.correo" type="email" :label="t('coms.email')" placeholder="sede@organizacion.com" />
          <UiInput id="telefono" v-model="form.telefono" :label="t('coms.phone')" placeholder="+503 0000 0000" />
        </div>

        <div class="space-y-1.5">
          <label class="block text-sm font-semibold text-gray-700">{{ t('coms.country') }}</label>
          <UiSelect v-model="form.pais" :options="paisOpciones" size="md" :placeholder="t('coms.countryPh')" />
        </div>
      </div>

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

      <div class="flex items-center justify-end gap-2 pt-1 pb-2">
        <UiButton variant="outline" size="sm" type="button" @click="navigateTo('/organizacion/comunidades')">{{ t('common.cancel') }}</UiButton>
        <UiButton size="sm" type="submit" :loading="saving">{{ t('common.create') }}</UiButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', titleKey: 'coms.newTitle' })

const { t } = useT()
const { orgActiva, setContexto } = useContexto()
const { create } = useComunidades()
const { listPaises } = usePlatform()
const { fetchUser } = useAuth()

const paises = ref<{ codigo: string, nombre: Record<string, string>, bandera: string | null }[]>([])
const saving = ref(false)
const error = ref('')

const form = ref({ nombre: '', descripcion: '', correo: '', telefono: '', pais: null as string | null })

const paisOpciones = computed(() =>
  paises.value.map(p => ({ value: p.codigo, label: `${p.bandera ?? ''} ${p.nombre?.es ?? p.codigo}`.trim() })))

onMounted(async () => {
  paises.value = await listPaises()
})

async function handleSave() {
  error.value = ''
  if (!orgActiva.value) return
  if (!form.value.nombre.trim()) {
    error.value = t('coms.nameRequired')
    return
  }

  saving.value = true
  const { id, error: err } = await create({ ...form.value, organizacion_id: orgActiva.value.id })
  saving.value = false

  if (err) {
    error.value = err
    return
  }

  // La comunidad nueva amplía la superficie de acceso: hay que recargarla para que el switcher
  // la vea. Y como es el destino natural de "acabo de crearla", entramos directo.
  await fetchUser()
  setContexto(orgActiva.value.id, id)
  navigateTo('/dashboard')
}
</script>
