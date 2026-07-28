<template>
  <div class="max-w-[640px] mx-auto">
    <UiPageHeader :title="t('platform.lics.editTitle')" />
    <div v-if="loading" class="card p-10 text-center text-sm text-gray-400">{{ t('common.loading') }}</div>

    <div v-else-if="!cargada" class="card p-10 text-center text-sm text-gray-500">
      {{ t('platform.lics.notFound') }}
      <NuxtLink to="/platform/licencias" class="text-brand-primary-600 font-semibold ml-1">{{ t('platform.orgDetail.back') }}</NuxtLink>
    </div>

    <form v-else class="space-y-5" @submit.prevent="handleSave">
      <div class="card p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="section-title">{{ t('platform.lics.section') }}</h2>
          <span class="text-sm text-gray-500">{{ orgNombre }}</span>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <UiInput id="max_com" v-model.number="form.max_comunidades" type="number" :label="t('platform.lics.communities')" />
          <UiInput id="max_edu" v-model.number="form.max_educadores" type="number" :label="t('platform.lics.educators')" />
          <UiInput id="max_per" v-model.number="form.max_personalizados" type="number" :label="t('platform.lics.custom')" />
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div class="space-y-1.5">
            <label class="block text-sm font-semibold text-gray-700">{{ t('platform.lics.state') }}</label>
            <UiSelect v-model="form.estado" :options="estadoOpciones" size="md" />
          </div>
          <UiInput id="fecha_inicio" v-model="form.fecha_inicio" type="date" :label="t('platform.lics.start')" />
          <UiInput id="fecha_fin" v-model="form.fecha_fin" type="date" :label="t('platform.lics.end')" :min="form.fecha_inicio" />
        </div>

        <div class="space-y-1.5">
          <label class="block text-sm font-semibold text-gray-700">{{ t('platform.lics.countriesLabel') }}</label>
          <p class="text-xs text-gray-400 mb-1">{{ t('platform.lics.countriesHint') }}</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="p in paises"
              :key="p.codigo"
              type="button"
              :class="['chip', form.paises.includes(p.codigo) ? 'chip-active' : 'chip-inactive']"
              @click="togglePais(p.codigo)"
            >
              <span class="mr-1">{{ p.bandera }}</span>{{ p.nombre?.es ?? p.codigo }}
            </button>
          </div>
        </div>

        <div class="space-y-1.5">
          <label for="notas" class="block text-sm font-semibold text-gray-700">{{ t('platform.lics.notes') }}</label>
          <textarea id="notas" v-model="form.notas" rows="2" class="input !h-auto py-2" :placeholder="t('platform.lics.notesPh')" />
        </div>
      </div>

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

      <div class="flex items-center justify-between gap-2 pt-1 pb-2">
        <UiButton variant="danger" size="sm" type="button" :loading="deleting" @click="handleDelete">
          {{ t('common.delete') }}
        </UiButton>
        <div class="flex items-center gap-2">
          <UiButton variant="outline" size="sm" type="button" @click="navigateTo('/platform/licencias')">{{ t('common.cancel') }}</UiButton>
          <UiButton size="sm" type="submit" :loading="saving">{{ t('common.save') }}</UiButton>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', titleKey: 'platform.lics.editTitle' })

const { t } = useT()
const route = useRoute()
const id = Number(route.params.id)
const { getLicencia, listPaises, updateLicencia, deleteLicencia } = usePlatform()

const paises = ref<{ codigo: string, nombre: Record<string, string>, bandera: string | null }[]>([])
const loading = ref(true)
const cargada = ref(false)
const saving = ref(false)
const deleting = ref(false)
const error = ref('')
const orgNombre = ref('')

const estadoOpciones = computed(() => [
  { value: 'ACTIVA', label: t('state.ACTIVA') },
  { value: 'TRIAL', label: t('state.TRIAL') },
  { value: 'SUSPENDIDA', label: t('state.SUSPENDIDA') },
  { value: 'VENCIDA', label: t('state.VENCIDA') },
])

const form = ref({
  max_comunidades: 0,
  max_educadores: 0,
  max_personalizados: 0,
  estado: 'ACTIVA',
  fecha_inicio: '',
  fecha_fin: '' as string,
  paises: [] as string[],
  notas: '',
})

onMounted(async () => {
  paises.value = await listPaises()
  const lic = await getLicencia(id) as any
  if (lic) {
    cargada.value = true
    orgNombre.value = lic.organizaciones?.nombre ?? ''
    form.value = {
      max_comunidades: lic.max_comunidades,
      max_educadores: lic.max_educadores,
      max_personalizados: lic.max_personalizados,
      estado: lic.estado,
      fecha_inicio: lic.fecha_inicio ?? '',
      fecha_fin: lic.fecha_fin ?? '',
      paises: lic.paises ?? [],
      notas: lic.notas ?? '',
    }
  }
  loading.value = false
})

function togglePais(codigo: string) {
  const arr = form.value.paises
  const i = arr.indexOf(codigo)
  if (i === -1) arr.push(codigo)
  else arr.splice(i, 1)
}

async function handleSave() {
  error.value = ''
  saving.value = true
  const { error: err } = await updateLicencia(id, {
    max_comunidades: Number(form.value.max_comunidades) || 0,
    max_educadores: Number(form.value.max_educadores) || 0,
    max_personalizados: Number(form.value.max_personalizados) || 0,
    estado: form.value.estado,
    fecha_inicio: form.value.fecha_inicio,
    fecha_fin: form.value.fecha_fin || null,
    paises: form.value.paises,
    notas: form.value.notas,
  })
  saving.value = false
  if (err) {
    error.value = err
    return
  }
  navigateTo('/platform/licencias')
}

async function handleDelete() {
  if (!confirm(t('platform.lics.confirmDelete'))) return
  deleting.value = true
  const { error: err } = await deleteLicencia(id)
  deleting.value = false
  if (err) {
    error.value = err
    return
  }
  navigateTo('/platform/licencias')
}
</script>
