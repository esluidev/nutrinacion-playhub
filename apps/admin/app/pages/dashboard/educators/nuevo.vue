<template>
  <div class="max-w-[640px] mx-auto">
    <UiPageHeader title="Agregar Educador" :description="`Suma una persona al equipo de ${comunidad}`" />

    <form class="card p-6" @submit.prevent="submit">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
        <div class="sm:col-span-2">
          <UiInput v-model="form.nombre" label="Nombre completo" placeholder="Ej. Carmen Díaz Morales" required />
        </div>
        <div class="sm:col-span-2">
          <UiInput
            v-model="form.email"
            type="email"
            label="Correo electrónico"
            placeholder="carmen@nutrinacion.com"
            hint="Recibirá una invitación para activar su cuenta en la app de StoryPlay."
            required
          />
        </div>
        <UiInput v-model="form.telefono" label="Teléfono" placeholder="+52 55 0000 0000" optional />
        <UiInput v-model="form.puesto" label="Puesto" placeholder="Ej. Nutrióloga" />
        <div class="sm:col-span-2 space-y-[7px]">
          <label class="block text-[13px] font-bold text-gray-700">Grupo <span class="text-gray-400 font-semibold">(opcional)</span></label>
          <UiSelect v-model="form.grupo" size="md" :options="grupoOptions" placeholder="Sin grupo" />
        </div>
      </div>
    </form>

    <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>

    <div class="flex items-center justify-end gap-2.5 mt-[18px]">
      <UiButton variant="outline" @click="navigateTo('/dashboard/educators')">Cancelar</UiButton>
      <UiButton type="button" :loading="saving" @click="submit">Agregar Educador</UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { t } = useT()
const { toast } = useToast()
const { groups, createEducador } = useEducators()
const { comunidadActiva } = useContexto()

const comunidad = computed(() => comunidadActiva.value?.nombre ?? t('common.myOrg'))

const form = reactive({
  nombre: '',
  email: '',
  telefono: '',
  puesto: '',
  grupo: null as number | null,
})

const saving = ref(false)
const error = ref('')

const grupoOptions = computed(() => [
  { value: null, label: 'Sin grupo' },
  ...groups.value.map(g => ({ value: g.id, label: g.nombre })),
])

async function submit() {
  error.value = ''
  if (!form.nombre.trim()) {
    error.value = 'El nombre es obligatorio.'
    return
  }

  // El campo es "nombre completo": la primera palabra es el nombre, el resto apellido.
  const [nombre = '', ...apellido] = form.nombre.trim().split(/\s+/)

  saving.value = true
  const { error: err } = await createEducador({
    nombre,
    apellido: apellido.join(' '),
    correo: form.email,
    telefono: form.telefono,
    profesion: form.puesto,
    grupoId: form.grupo,
  })
  saving.value = false

  if (err) {
    error.value = err
    return
  }
  toast.success('Educador agregado al equipo.')
  navigateTo('/dashboard/educators')
}
</script>
