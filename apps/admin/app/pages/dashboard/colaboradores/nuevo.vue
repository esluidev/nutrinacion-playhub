<template>
  <div class="mx-auto max-w-2xl">
    <UiPageHeader title="Invitar Colaborador" :description="`Da acceso para operar ${comunidad}`" />

    <form class="ui-panel p-6" @submit.prevent="submit">
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <!-- La comunidad la fija el contexto: aquí no se elige -->
        <div class="sm:col-span-2">
          <UiInput
            :model-value="comunidad"
            label="Comunidad"
            disabled
            hint="El colaborador podrá operar solo esta comunidad: talleres, educadores y planificador."
          />
        </div>
        <UiInput v-model="form.nombre" label="Nombre" required />
        <UiInput v-model="form.apellido" label="Apellido" optional />
        <div class="sm:col-span-2">
          <UiInput v-model="form.email" type="email" label="Correo electrónico" placeholder="persona@correo.com" required />
        </div>
        <UiSelect v-model="form.idioma" label="Idioma de la invitación" :options="idiomaOptions" />
        <UiInput v-model="form.expira" type="date" label="Vence" :min="hoy" />
      </div>
    </form>

    <UiAlert v-if="error" tone="danger" class="mt-4">{{ error }}</UiAlert>

    <div class="mt-5 flex items-center justify-end gap-3">
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

// Días del calendario local; la invitación vence al final del día elegido.
const hoy = hoyLocal()

function enTreintaDias() {
  return hoyLocal(30)
}

const form = reactive({
  email: '',
  nombre: '',
  apellido: '',
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
  if (!form.nombre.trim()) {
    error.value = 'Escribe el nombre: así sabrás a quién invitaste.'
    return
  }
  if (!form.email.trim()) {
    error.value = 'El correo es obligatorio.'
    return
  }

  saving.value = true
  const { error: err } = await invitar({
    email: form.email.trim(),
    nombre: form.nombre,
    apellido: form.apellido,
    idioma: form.idioma,
    expira_en: form.expira ? finDelDia(form.expira) : null,
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
