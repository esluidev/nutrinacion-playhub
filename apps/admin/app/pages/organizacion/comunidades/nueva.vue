<template>
  <div class="max-w-[640px] mx-auto">
    <UiPageHeader :title="t('coms.newTitle')" />

    <!-- El cupo lo exige el trigger 0007 en la base; aquí se avisa ANTES de llenar el form -->
    <UiAlert v-if="!cupoOk" tone="warning" class="mb-5">{{ motivoSinAlta }}</UiAlert>

    <form class="space-y-5" @submit.prevent="handleSave">
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
        <UiButton size="sm" type="submit" :loading="saving" :disabled="!cupoOk">{{ t('common.create') }}</UiButton>
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
const { getCupoComunidades } = useOrganizacion()
const { fetchUser } = useAuth()

const paises = ref<{ codigo: string, nombre: Record<string, string>, bandera: string | null }[]>([])
const saving = ref(false)
const error = ref('')

// Mientras carga se asume ok; si el cupo está lleno, el submit se apaga y se avisa.
const cupo = ref<{ max: number | null, usadas: number } | null>(null)
const cupoOk = computed(() =>
  cupo.value === null || (cupo.value.max !== null && cupo.value.usadas < cupo.value.max))
const motivoSinAlta = computed(() =>
  cupo.value?.max === null ? t('coms.sinLicencia') : t('coms.cupoLleno'))

const form = ref({ nombre: '', descripcion: '', correo: '', telefono: '', pais: null as string | null })

const paisOpciones = computed(() =>
  paises.value.map(p => ({ value: p.codigo, label: `${p.bandera ?? ''} ${p.nombre?.es ?? p.codigo}`.trim() })))

onMounted(async () => {
  const [lista, c] = await Promise.all([listPaises(), getCupoComunidades()])
  paises.value = lista
  cupo.value = c
})

async function handleSave() {
  error.value = ''
  if (!orgActiva.value) return
  if (!form.value.nombre.trim()) {
    error.value = t('coms.nameRequired')
    return
  }
  if (!form.value.pais) {
    error.value = t('coms.countryRequired')
    return
  }

  saving.value = true
  const { id, error: err } = await create({ ...form.value, pais: form.value.pais, organizacion_id: orgActiva.value.id })
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
