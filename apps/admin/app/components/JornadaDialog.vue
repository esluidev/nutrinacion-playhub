<template>
  <!-- Los datos de una jornada (decisión 011): nombre, lugar, días (desde/hasta; uno solo si no se
       dice hasta cuándo) y descripción.
       - Con `jornada`, la edita desde su panel y la guarda al momento. Si al cambiar los días queda
         algún taller fuera, la base lo rechaza y su mensaje se muestra tal cual.
       - Con `borrador`, la jornada aún no existe: al programar un taller, «Nueva jornada» la escribe
         aquí y el diálogo solo la devuelve (`listo`); se crea al guardar el taller. -->
  <UiDialog :open="open" :title="borrador && !borrador.nombre ? t('jornada.nuevaTitle') : t('planner.jEditTitle')" size="lg" @update:open="(v) => emit('update:open', v)">
    <JornadaCampos id="jornada-editar" v-model="form" />
    <p v-if="error" class="field-error mt-3">{{ error }}</p>
    <template #actions>
      <UiButton :loading="guardando" icon="check" @click="guardar">{{ borrador ? t('jornada.use') : t('common.save') }}</UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import type { DatosJornada, JornadaFila } from '~/composables/useJornadas'
import { datosJornadaVacios, validarDatosJornada } from '~/composables/useJornadas'

const props = defineProps<{
  open: boolean
  jornada?: JornadaFila | null
  borrador?: DatosJornada | null
}>()
const emit = defineEmits<{ 'update:open': [value: boolean], 'saved': [id: number], 'listo': [datos: DatosJornada] }>()

const { t } = useT()
const { toast } = useToast()
const { actualizarJornada } = usePlanner()

const guardando = ref(false)
const error = ref('')
const form = ref<DatosJornada>(datosJornadaVacios())

// Cada vez que se abre, el formulario arranca de la jornada.
watch(() => props.open, (abierto) => {
  if (!abierto) return
  const j = props.jornada
  error.value = ''
  form.value = props.borrador
    ? { ...props.borrador }
    : j
      ? { nombre: j.nombre, ubicacion: j.ubicacion, fecha_inicio: j.fecha_inicio, fecha_fin: j.fecha_fin, descripcion: j.descripcion ?? '' }
      : datosJornadaVacios()
})

async function guardar() {
  error.value = ''
  const falta = validarDatosJornada(form.value)
  if (falta) { error.value = t(falta); return }
  if (props.borrador) {
    emit('listo', { ...form.value, fecha_fin: form.value.fecha_fin || form.value.fecha_inicio })
    emit('update:open', false)
    return
  }
  const j = props.jornada
  if (!j) return
  guardando.value = true
  const r = await actualizarJornada(j.id, form.value)
  guardando.value = false
  if (r.error) { error.value = r.error; return }
  toast.success(t('planner.jSaved'))
  emit('update:open', false)
  emit('saved', j.id)
}
</script>
