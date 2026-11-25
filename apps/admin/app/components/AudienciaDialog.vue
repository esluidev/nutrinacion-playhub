<template>
  <!-- Dar de alta o editar una audiencia (tarea 021): solo el nombre es obligatorio; las edades y la
       descripción ayudan a elegir (tarea 023: sin la edición, que repetía las edades). Sin número de niños: lo da el cierre de cada
       taller. «Público general» (una feria, un evento abierto) cuenta asistencias, no alcance, y su
       cierre no pide niñas y niños; cada organización nace con una, fija: de ella solo se cambia el nombre (la base
       no deja desactivarla, cerrarla ni eliminarla). Con `audiencia`, la edita; sin ella, la da de alta. -->
  <UiDialog :open="open" :title="audiencia ? t('audiences.editTitle') : t('audiences.newTitle')" size="lg" @update:open="(v) => emit('update:open', v)">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <UiInput id="audiencia-nombre" v-model="form.nombre" class="sm:col-span-2" :label="t('audiences.fName')" :placeholder="t('audiences.fNamePh')" required />
      <template v-if="!audiencia?.fija">
        <UiInput id="audiencia-desde" v-model="form.edadDesde" type="number" :label="t('audiences.fAgeFrom')" optional />
        <UiInput id="audiencia-hasta" v-model="form.edadHasta" type="number" :label="t('audiences.fAgeTo')" optional />
        <UiTextarea id="audiencia-descripcion" v-model="form.descripcion" class="sm:col-span-2" :label="t('audiences.fDescription')" optional :rows="2" />
        <div class="sm:col-span-2">
          <UiSwitch v-model="form.abierto" :label="t('audiences.fOpen')" />
          <p class="field-help">{{ t('audiences.fOpenHint') }}</p>
        </div>
        <!-- Su estado, al editarla: inactiva no sale al programar (en la fila solo se edita o se elimina) -->
        <div v-if="audiencia" class="sm:col-span-2">
          <UiSwitch v-model="form.activo" :label="t('audiences.activeLabel')" />
          <p class="field-help">{{ t('audiences.activeHelp') }}</p>
        </div>
      </template>
    </div>
    <p v-if="error" class="field-error mt-3">{{ error }}</p>
    <template #actions>
      <UiButton :loading="guardando" icon="check" @click="guardar">{{ audiencia ? t('common.save') : t('audiences.create') }}</UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import type { Audiencia, DatosAudiencia } from '~/composables/useAudiencias'
import { datosAudienciaVacios, validarDatosAudiencia } from '~/composables/useAudiencias'

const props = defineProps<{ open: boolean, audiencia?: Audiencia | null }>()
const emit = defineEmits<{ 'update:open': [value: boolean], 'saved': [id: number] }>()

const { t } = useT()
const { toast } = useToast()
const { crear, actualizar } = useAudiencias()

const form = ref<DatosAudiencia>(datosAudienciaVacios())
const error = ref('')
const guardando = ref(false)

watch(() => props.open, (abierto) => {
  if (!abierto) return
  const a = props.audiencia
  form.value = a
    ? { nombre: a.nombre, edadDesde: a.edadDesde?.toString() ?? '', edadHasta: a.edadHasta?.toString() ?? '', descripcion: a.descripcion, abierto: a.abierto, activo: a.activo }
    : datosAudienciaVacios()
  error.value = ''
})

async function guardar() {
  error.value = ''
  const falta = validarDatosAudiencia(form.value)
  if (falta) { error.value = t(falta); return }
  guardando.value = true
  const r = props.audiencia
    ? { ...(await actualizar(props.audiencia.id, form.value)), id: props.audiencia.id }
    : await crear(form.value)
  guardando.value = false
  if (r.error || !r.id) { error.value = r.error ?? ''; return }
  toast.success(props.audiencia ? t('audiences.saved') : t('audiences.created'))
  emit('update:open', false)
  emit('saved', r.id)
}
</script>
