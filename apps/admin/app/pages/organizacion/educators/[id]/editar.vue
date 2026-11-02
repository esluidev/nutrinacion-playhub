<template>
  <div class="mx-auto max-w-2xl">
    <UiPageHeader :title="t('educators.editTitle')" :description="t('educators.editDesc')" />

    <div v-if="loading" class="ui-panel p-10 text-center text-body font-semibold text-subtle">{{ t('common.loading') }}</div>

    <template v-else-if="educador">
      <form class="ui-panel p-6" @submit.prevent="guardar">
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <UiInput v-model="form.nombre" :label="t('educators.fFirst')" required />
          <UiInput v-model="form.apellido" :label="t('educators.fLast')" optional />
          <div class="sm:col-span-2">
            <UiInput
              v-model="form.correo"
              type="email"
              :label="t('educators.fEmail')"
              :hint="t('educators.fEmailEditHint')"
              required
            />
          </div>
          <UiInput v-model="form.telefono" :label="t('educators.fPhone')" optional />
          <UiInput v-model="form.profesion" :label="t('educators.fRole')" optional />
        </div>

        <UiAlert v-if="error" tone="danger" class="mt-5">{{ error }}</UiAlert>

        <div class="mt-6 flex items-center justify-end gap-3">
          <UiButton variant="outline" type="button" @click="volver">{{ t('common.cancel') }}</UiButton>
          <UiButton type="submit" :loading="saving">{{ t('common.save') }}</UiButton>
        </div>
      </form>

      <!-- Dar de baja: deja la organización y sus grupos. Es de los administradores (la base lo exige,
           0012). Para apartarlo sin baja está «Activo» en «Acceso y PIN». -->
      <section v-if="orgActiva?.esAdmin" class="ui-panel mt-5 p-6">
        <h2 class="ui-title">{{ t('educators.deregisterTitle') }}</h2>
        <p class="ui-text mt-1">{{ t('educators.deregisterText') }}</p>
        <!-- Quitar: coral -->
        <UiButton tone="coral" variant="outline" icon="trash" class="mt-4" @click="confirmandoBaja = true">{{ t('educators.deregister') }}</UiButton>
      </section>

      <UiConfirmDialog
        :open="confirmandoBaja"
        :title="t('educators.deregisterConfirmTitle')"
        :confirm-label="t('educators.deregister')"
        symbol="trash"
        :loading="dandoBaja"
        @update:open="(v) => (confirmandoBaja = v)"
        @confirm="baja"
      >
        <p class="ui-text">{{ t('educators.deregisterConfirmText', { nombre: nombreCompleto }) }}</p>
      </UiConfirmDialog>
    </template>

    <div v-else class="ui-panel">
      <UiEmptyState icon="alert" :title="t('educators.notFound')">
        <UiButton variant="outline" size="sm" @click="volver">{{ t('educators.backToList') }}</UiButton>
      </UiEmptyState>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EducadorDetalle } from '~/composables/useEducators'

definePageMeta({ layout: 'dashboard' })

const { t } = useT()
const route = useRoute()
const { toast } = useToast()
const { getEducadorDetalle, updateEducador, darDeBaja } = useEducators()
const { orgActiva } = useContexto()

const id = Number(route.params.id)

const educador = ref<EducadorDetalle | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const confirmandoBaja = ref(false)
const dandoBaja = ref(false)

const form = reactive({ nombre: '', apellido: '', correo: '', telefono: '', profesion: '' })
const nombreCompleto = computed(() => `${form.nombre} ${form.apellido}`.trim())

onMounted(async () => {
  educador.value = await getEducadorDetalle(id)
  if (educador.value) {
    form.nombre = educador.value.nombre
    form.apellido = educador.value.apellido ?? ''
    form.correo = educador.value.correo
    form.telefono = educador.value.telefono ?? ''
    form.profesion = educador.value.profesion ?? ''
  }
  loading.value = false
})

function volver() {
  navigateTo('/organizacion/educators')
}

async function guardar() {
  error.value = ''
  if (!form.nombre.trim()) {
    error.value = t('educators.nameRequired')
    return
  }
  if (!form.correo.trim()) {
    error.value = t('educators.emailRequired')
    return
  }
  saving.value = true
  const { error: err } = await updateEducador(id, { ...form })
  saving.value = false
  if (err) {
    error.value = err
    return
  }
  toast.success(t('educators.saved'))
  volver()
}

async function baja() {
  dandoBaja.value = true
  const { error: err } = await darDeBaja(id)
  dandoBaja.value = false
  confirmandoBaja.value = false
  if (err) {
    toast.error(err)
    return
  }
  toast.success(t('educators.deregistered', { nombre: nombreCompleto.value }))
  volver()
}
</script>
