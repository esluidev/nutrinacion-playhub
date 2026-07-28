<template>
  <div class="max-w-[640px] mx-auto">
    <UiPageHeader title="Invitar Colaborador" :description="`Da acceso para operar ${comunidad}`" />

    <form class="card p-6" @submit.prevent="submit">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
        <!-- La comunidad la fija el contexto: aquí no se elige -->
        <div class="sm:col-span-2 space-y-[7px]">
          <label class="block text-[13px] font-bold text-gray-700">Comunidad</label>
          <p class="input flex items-center !bg-gray-50 text-gray-600 cursor-default">{{ comunidad }}</p>
          <p class="text-[11.5px] font-semibold text-gray-400">El colaborador podrá operar solo esta comunidad: talleres, educadores y planificador.</p>
        </div>
        <div class="sm:col-span-2">
          <UiInput v-model="form.email" type="email" label="Correo electrónico" placeholder="persona@correo.com" required />
        </div>
        <div class="space-y-[7px]">
          <label class="block text-[13px] font-bold text-gray-700">Idioma de la invitación</label>
          <UiSelect v-model="form.idioma" size="md" :options="idiomaOptions" />
        </div>
        <UiInput v-model="form.expira" type="date" label="Vence" :min="hoy" />
      </div>
    </form>

    <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>

    <div class="flex items-center justify-end gap-2.5 mt-[18px]">
      <UiButton variant="outline" @click="navigateTo('/dashboard/colaboradores')">Cancelar</UiButton>
      <UiButton type="button" :loading="saving" @click="submit">Enviar Invitación</UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { toast } = useToast()
const { comunidadActiva, administraOrgActiva, esSuperadmin } = useContexto()
const { invitar } = useColaboradores()

// Invitar es del admin de la org (la RLS lo exige igual): el colaborador no ve esta página.
if (isSupabaseConfigured() && !administraOrgActiva.value && !esSuperadmin.value) {
  navigateTo('/dashboard/colaboradores', { replace: true })
}

const comunidad = computed(() => comunidadActiva.value?.nombre ?? 'tu comunidad')

const hoy = new Date().toISOString().slice(0, 10)

function enTreintaDias() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

const form = reactive({
  email: '',
  idioma: 'es',
  expira: enTreintaDias(),
})

const idiomaOptions = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
]

const saving = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (!form.email.trim()) {
    error.value = 'El correo es obligatorio.'
    return
  }

  saving.value = true
  const { error: err } = await invitar({
    email: form.email.trim(),
    idioma: form.idioma,
    expira_en: form.expira ? new Date(form.expira).toISOString() : null,
  })
  saving.value = false

  if (err) {
    error.value = err
    return
  }
  toast.success('Invitación enviada. Puedes ver las pendientes en Colaboradores.')
  navigateTo('/dashboard/colaboradores')
}
</script>
