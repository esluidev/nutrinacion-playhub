<template>
  <!-- Dar de alta o editar un programa (tarea 021): nombre, fechas y descripción. Sus talleres caen
       en sus fechas: si al acortarlas queda alguno fuera, la base lo rechaza y su mensaje se muestra
       tal cual. Con `programa`, lo edita; sin él, lo da de alta. -->
  <UiDialog :open="open" :title="programa ? t('programs.editTitle') : t('programs.newTitle')" size="lg" @update:open="(v) => emit('update:open', v)">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <UiInput id="programa-nombre" v-model="form.nombre" class="sm:col-span-2" :label="t('programs.fName')" :placeholder="t('programs.fNamePh')" required />
      <UiInput id="programa-desde" v-model="form.fecha_inicio" type="date" :label="t('programs.fFrom')" required />
      <UiInput id="programa-hasta" v-model="form.fecha_fin" type="date" :label="t('programs.fTo')" :min="form.fecha_inicio || undefined" required />
      <UiTextarea id="programa-descripcion" v-model="form.descripcion" class="sm:col-span-2" :label="t('programs.fDescription')" :placeholder="t('programs.fDescriptionPh')" optional :rows="2" />
    </div>
    <p v-if="error" class="field-error mt-3">{{ error }}</p>
    <template #actions>
      <UiButton :loading="guardando" icon="check" @click="guardar">{{ programa ? t('common.save') : t('programs.create') }}</UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import type { DatosPrograma, Programa } from '~/composables/useProgramas'
import { datosProgramaVacios, validarDatosPrograma } from '~/composables/useProgramas'

const props = defineProps<{ open: boolean, programa?: Programa | null }>()
const emit = defineEmits<{ 'update:open': [value: boolean], 'saved': [id: number] }>()

const { t } = useT()
const { toast } = useToast()
const { crear, actualizar } = useProgramas()

const form = ref<DatosPrograma>(datosProgramaVacios())
const error = ref('')
const guardando = ref(false)

watch(() => props.open, (abierto) => {
  if (!abierto) return
  const p = props.programa
  form.value = p ? { nombre: p.nombre, descripcion: p.descripcion, fecha_inicio: p.fecha_inicio, fecha_fin: p.fecha_fin } : datosProgramaVacios()
  error.value = ''
})

async function guardar() {
  error.value = ''
  const falta = validarDatosPrograma(form.value)
  if (falta) { error.value = t(falta); return }
  guardando.value = true
  const r = props.programa
    ? { ...(await actualizar(props.programa.id, form.value)), id: props.programa.id }
    : await crear(form.value)
  guardando.value = false
  if (r.error || !r.id) { error.value = r.error ?? ''; return }
  toast.success(props.programa ? t('programs.saved') : t('programs.created'))
  emit('update:open', false)
  emit('saved', r.id)
}
</script>
