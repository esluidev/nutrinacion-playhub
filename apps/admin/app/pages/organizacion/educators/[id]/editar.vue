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

        <!-- Activo en la organización: inactivo no recibe talleres y no entra en Educators -->
        <div class="mt-6 border-t border-line pt-5">
          <UiSwitch v-model="form.activo" :label="t('educators.activeLabel')" />
          <p class="ui-caption mt-2">{{ t('educators.activeHelp') }}</p>
        </div>

        <UiAlert v-if="error" tone="danger" class="mt-5">{{ error }}</UiAlert>

        <div class="mt-6 flex items-center justify-end gap-3">
          <UiButton variant="outline" type="button" @click="volver">{{ t('common.cancel') }}</UiButton>
          <UiButton type="submit" :loading="saving">{{ t('common.save') }}</UiButton>
        </div>
      </form>

      <!-- Quitarlo de la organización es de los administradores (la base lo exige, 0012 y 0014). Si no
           ha dado ningún taller se elimina de verdad; si ya dio, se da de baja y queda como historial.
           Para apartarlo sin quitarlo está «Activo», arriba. -->
      <section v-if="orgActiva?.esAdmin && historial !== null" class="ui-panel mt-5 p-6">
        <h2 class="ui-title">{{ historial ? t('educators.deregisterTitle') : t('educators.deleteTitle') }}</h2>
        <p class="ui-text mt-1">{{ historial ? t('educators.deregisterText') : t('educators.deleteText') }}</p>
        <!-- Quitar: coral -->
        <UiButton tone="coral" variant="outline" icon="trash" class="mt-4" @click="confirmando = true">
          {{ historial ? t('educators.deregister') : t('educators.delete') }}
        </UiButton>
      </section>

      <UiConfirmDialog
        :open="confirmando"
        :title="historial ? t('educators.deregisterConfirmTitle') : t('educators.deleteConfirmTitle')"
        :confirm-label="historial ? t('educators.deregister') : t('educators.deleteConfirm')"
        symbol="trash"
        :loading="quitando"
        @update:open="(v) => (confirmando = v)"
        @confirm="quitar"
      >
        <p class="ui-text">{{ t(historial ? 'educators.deregisterConfirmText' : 'educators.deleteConfirmText', { nombre: nombreCompleto }) }}</p>
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
const { getEducadorDetalle, updateEducador, darDeBaja, tieneHistorial, eliminarEducador } = useEducators()
const { orgActiva } = useContexto()

const id = Number(route.params.id)

const educador = ref<EducadorDetalle | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const confirmando = ref(false)
const quitando = ref(false)
// Si ya dio talleres se da de baja; si no, se elimina (0014). null mientras no se sabe.
const historial = ref<boolean | null>(null)

const form = reactive({ nombre: '', apellido: '', correo: '', telefono: '', profesion: '', activo: true })
const nombreCompleto = computed(() => `${form.nombre} ${form.apellido}`.trim())

onMounted(async () => {
  educador.value = await getEducadorDetalle(id)
  if (educador.value) {
    form.nombre = educador.value.nombre
    form.apellido = educador.value.apellido ?? ''
    form.correo = educador.value.correo
    form.telefono = educador.value.telefono ?? ''
    form.profesion = educador.value.profesion ?? ''
    form.activo = educador.value.activo
  }
  loading.value = false
})

watch(() => orgActiva.value?.esAdmin, async (esAdmin) => {
  if (esAdmin && historial.value === null) historial.value = await tieneHistorial(id)
}, { immediate: true })

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

async function quitar() {
  const conHistorial = historial.value
  quitando.value = true
  const { error: err } = conHistorial ? await darDeBaja(id) : await eliminarEducador(id)
  quitando.value = false
  confirmando.value = false
  if (err) {
    toast.error(err)
    return
  }
  toast.success(t(conHistorial ? 'educators.deregistered' : 'educators.deleted', { nombre: nombreCompleto.value }))
  volver()
}
</script>
