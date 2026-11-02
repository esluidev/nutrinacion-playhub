<template>
  <div class="mx-auto max-w-2xl">
    <UiPageHeader :title="t('educators.add')" :description="t('educators.newDesc', { org })" />

    <form class="ui-panel p-6" @submit.prevent="submit">
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <UiInput v-model="form.nombre" :label="t('educators.fName')" :placeholder="t('educators.fNamePh')" required />
        </div>
        <div class="sm:col-span-2">
          <UiInput
            v-model="form.email"
            type="email"
            :label="t('educators.fEmail')"
            :placeholder="t('educators.fEmailPh')"
            :hint="t('educators.fEmailHint')"
            required
          />
        </div>
        <UiInput v-model="form.telefono" :label="t('educators.fPhone')" :placeholder="t('educators.fPhonePh')" optional />
        <UiInput v-model="form.puesto" :label="t('educators.fRole')" :placeholder="t('educators.fRolePh')" />
        <!-- UiSelect no tiene `optional`: la etiqueta replica la de UiInput -->
        <div class="sm:col-span-2">
          <label class="field-label">{{ t('educators.fGroup') }} <span class="font-semibold text-muted">({{ t('common.optional') }})</span></label>
          <UiSelect v-model="form.grupo" :options="grupoOptions" :placeholder="t('educators.noGroup')" />
        </div>
      </div>
    </form>

    <UiAlert v-if="error" tone="danger" class="mt-4">{{ error }}</UiAlert>

    <div class="mt-5 flex items-center justify-end gap-3">
      <UiButton variant="outline" @click="navigateTo(grupoDeOrigen ? `/organizacion/educators/grupos/${grupoDeOrigen}` : '/organizacion/educators')">{{ t('common.cancel') }}</UiButton>
      <UiButton type="button" :loading="saving" @click="submit">{{ t('educators.add') }}</UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { t } = useT()
const { toast } = useToast()
const { groups, createEducador } = useEducators()
const { orgActiva } = useContexto()
// Desde un grupo (`?grupo=<id>`): el educador entra en él y se vuelve al grupo.
const grupoDeOrigen = Number(useRoute().query.grupo) || null

const org = computed(() => orgActiva.value?.nombre ?? t('common.myOrg'))

const form = reactive({
  nombre: '',
  email: '',
  telefono: '',
  puesto: '',
  grupo: grupoDeOrigen as number | null,
})

const saving = ref(false)
const error = ref('')

const grupoOptions = computed(() => [
  { value: null, label: t('educators.noGroup') },
  ...groups.value.map(g => ({ value: g.id, label: g.nombre })),
])

async function submit() {
  error.value = ''
  if (!form.nombre.trim()) {
    error.value = t('educators.nameRequired')
    return
  }
  if (!form.email.trim()) {
    error.value = t('educators.emailRequired')
    return
  }

  // El campo es "nombre completo": la primera palabra es el nombre, el resto apellido.
  const [nombre = '', ...apellido] = form.nombre.trim().split(/\s+/)

  saving.value = true
  const { error: err, reactivado } = await createEducador({
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
  toast.success(reactivado ? t('educators.reactivated') : t('educators.added'))
  navigateTo(grupoDeOrigen ? `/organizacion/educators/grupos/${grupoDeOrigen}` : '/organizacion/educators')
}
</script>
