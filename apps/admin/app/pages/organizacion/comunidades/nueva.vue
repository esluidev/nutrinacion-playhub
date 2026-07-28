<template>
  <div class="max-w-[640px] mx-auto">
    <UiPageHeader :title="t('coms.newTitle')" />

    <!-- El cupo lo exige el trigger 0007 en la base; aquí se avisa ANTES de llenar el form -->
    <div v-if="!cupoOk" class="card p-4 mb-[18px] flex items-center gap-3 border-amber-200 bg-amber-50/60">
      <svg class="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      <p class="text-[13px] font-bold text-amber-700">{{ motivoSinAlta }}</p>
    </div>

    <form class="space-y-[18px]" @submit.prevent="handleSave">
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
