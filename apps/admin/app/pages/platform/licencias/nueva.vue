<template>
  <div class="max-w-[640px] mx-auto">
    <UiPageHeader :title="t('platform.lics.newTitle')" />
    <form class="space-y-[18px]" @submit.prevent="handleSave">
      <div class="card p-6 space-y-4">
        <h2 class="section-title">{{ t('platform.lics.section') }}</h2>

        <div class="space-y-1.5">
          <label class="block text-sm font-semibold text-gray-700">{{ t('platform.lics.org') }}</label>
          <UiSelect v-model="form.organizacion_id" :options="orgOpciones" size="md" :placeholder="t('platform.lics.orgPh')" :disabled="orgLocked" />
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

      <div class="flex items-center justify-end gap-2 pt-1 pb-2">
        <UiButton variant="outline" size="sm" type="button" @click="volver">{{ t('common.cancel') }}</UiButton>
        <UiButton size="sm" type="submit" :loading="saving">{{ t('platform.lics.create') }}</UiButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', titleKey: 'platform.lics.newTitle' })

const { t } = useT()
const route = useRoute()
const { listOrganizacionesSimple, listPaises, createLicencia } = usePlatform()

const orgs = ref<{ id: number, nombre: string }[]>([])
const paises = ref<{ codigo: string, nombre: Record<string, string>, bandera: string | null }[]>([])
const saving = ref(false)
const error = ref('')

const preOrg = route.query.org ? Number(route.query.org) : null
const orgLocked = computed(() => preOrg !== null)

const orgOpciones = computed(() => orgs.value.map(o => ({ value: o.id, label: o.nombre })))
const estadoOpciones = computed(() => [
  { value: 'ACTIVA', label: t('state.ACTIVA') },
  { value: 'TRIAL', label: t('state.TRIAL') },
  { value: 'SUSPENDIDA', label: t('state.SUSPENDIDA') },
  { value: 'VENCIDA', label: t('state.VENCIDA') },
])

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

const form = ref({
  organizacion_id: preOrg as number | null,
  max_comunidades: 1,
  max_educadores: 10,
  max_personalizados: 0,
  estado: 'ACTIVA',
  fecha_inicio: hoy(),
  fecha_fin: '' as string,
  paises: [] as string[],
  notas: '',
})

onMounted(async () => {
  orgs.value = await listOrganizacionesSimple()
  paises.value = await listPaises()
})

function togglePais(codigo: string) {
  const arr = form.value.paises
  const i = arr.indexOf(codigo)
  if (i === -1) arr.push(codigo)
  else arr.splice(i, 1)
}

function volver() {
  navigateTo(preOrg ? `/platform/organizaciones/${preOrg}` : '/platform/licencias')
}

async function handleSave() {
  error.value = ''
  if (!form.value.organizacion_id) {
    error.value = t('platform.lics.pickOrg')
    return
  }

  saving.value = true
  const { error: err } = await createLicencia({
    organizacion_id: form.value.organizacion_id,
    max_comunidades: Number(form.value.max_comunidades) || 0,
    max_educadores: Number(form.value.max_educadores) || 0,
    max_personalizados: Number(form.value.max_personalizados) || 0,
    estado: form.value.estado,
    fecha_inicio: form.value.fecha_inicio || hoy(),
    fecha_fin: form.value.fecha_fin || null,
    paises: form.value.paises,
    notas: form.value.notas,
  })
  saving.value = false

  if (err) {
    error.value = err
    return
  }
  volver()
}
</script>
