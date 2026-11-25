<template>
  <!-- Dar de alta o editar un lugar (tarea 021): su nombre y, si se quiere, la comunidad que lo
       agrupa con otros: una existente, ninguna o una nueva, que se crea al guardar. Al editarlo, también
       su estado (tarea 023): inactivo no sale al programar. Con `lugar`, lo edita; sin él, lo da de alta. -->
  <UiDialog :open="open" :title="lugar ? t('places.editTitle') : t('places.newTitle')" @update:open="(v) => emit('update:open', v)">
    <div class="grid grid-cols-1 gap-4">
      <UiInput id="lugar-nombre" v-model="nombre" :label="t('places.fName')" :placeholder="t('places.fNamePh')" required />
      <ComunidadCampo v-model="comunidad" />
      <div v-if="lugar">
        <UiSwitch v-model="activo" :label="t('places.activeLabel')" />
        <p class="field-help">{{ t('places.activeHelp') }}</p>
      </div>
    </div>
    <p v-if="error" class="field-error mt-3">{{ error }}</p>
    <template #actions>
      <UiButton :loading="guardando" icon="check" @click="guardar">{{ lugar ? t('common.save') : t('places.create') }}</UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import type { EleccionComunidad, Lugar } from '~/composables/useLugares'

const props = defineProps<{ open: boolean, lugar?: Lugar | null }>()
const emit = defineEmits<{ 'update:open': [value: boolean], 'saved': [id: number] }>()

const { t } = useT()
const { toast } = useToast()
const { crear, actualizar } = useLugares()

const nombre = ref('')
const comunidad = ref<EleccionComunidad>({ comunidadId: null, nueva: '' })
const activo = ref(true)
const error = ref('')
const guardando = ref(false)

watch(() => props.open, (abierto) => {
  if (!abierto) return
  nombre.value = props.lugar?.nombre ?? ''
  comunidad.value = { comunidadId: props.lugar?.comunidadId ?? null, nueva: '' }
  activo.value = props.lugar?.activo ?? true
  error.value = ''
})

async function guardar() {
  error.value = ''
  if (!nombre.value.trim()) { error.value = t('places.nameRequired'); return }
  guardando.value = true
  const datos = { nombre: nombre.value, comunidad: comunidad.value }
  const r = props.lugar
    ? { ...(await actualizar(props.lugar.id, { ...datos, activo: activo.value })), id: props.lugar.id }
    : await crear(datos)
  guardando.value = false
  if (r.error || !r.id) { error.value = r.error ?? ''; return }
  toast.success(props.lugar ? t('places.saved') : t('places.created'))
  emit('update:open', false)
  emit('saved', r.id)
}
</script>
