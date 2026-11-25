<template>
  <!-- Crear o editar una jornada (tarea 023): nombre, lugar, programa, días (desde/hasta; uno solo si no se dice hasta
       cuándo) y descripción. Sin `jornada`, la crea (desde su sección; con `programaId`, ya dentro de ese programa); con
       `jornada`, la edita. Si al cambiar los días queda algún taller fuera, la base lo rechaza y su mensaje se muestra
       tal cual. Es el único diálogo: el lugar se crea ahí mismo, debajo de su campo, y los programas en su sección. -->
  <UiDialog :open="open" :title="jornada ? t('planner.jEditTitle') : t('jornadas.newTitle')" size="lg" @update:open="(v) => emit('update:open', v)">
    <JornadaCampos id="jornada-dialogo" v-model="form" />
    <p v-if="error" class="field-error mt-3">{{ error }}</p>
    <template #actions>
      <UiButton :loading="guardando" icon="check" @click="guardar">{{ jornada ? t('common.save') : t('jornadas.create') }}</UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import type { DatosJornada, JornadaFila } from '~/composables/useJornadas'
import { datosDeJornada, datosJornadaVacios, validarDatosJornada } from '~/composables/useJornadas'

const props = defineProps<{
  open: boolean
  jornada?: JornadaFila | null
  programaId?: number | null
}>()
const emit = defineEmits<{ 'update:open': [value: boolean], 'saved': [id: number] }>()

const { t } = useT()
const { toast } = useToast()
const { crear, actualizar } = useJornadas()
const { refresh: refreshWorkshops } = useWorkshops()

const guardando = ref(false)
const error = ref('')
const form = ref<DatosJornada>(datosJornadaVacios())

// Cada vez que se abre, el formulario arranca de la jornada (o vacío, dentro del programa si lo trae).
watch(() => props.open, (abierto) => {
  if (!abierto) return
  error.value = ''
  form.value = props.jornada ? datosDeJornada(props.jornada) : datosJornadaVacios('', props.programaId ?? null)
})

async function guardar() {
  error.value = ''
  const falta = validarDatosJornada(form.value)
  if (falta) { error.value = t(falta); return }
  guardando.value = true
  const j = props.jornada
  const r = j ? { ...(await actualizar(j.id, form.value)), id: j.id } : await crear(form.value)
  guardando.value = false
  if (r.error || !r.id) { error.value = r.error ?? ''; return }
  // Su lugar pasa a sus talleres (la base lo propaga): la lista de talleres se vuelve a leer.
  if (j) await refreshWorkshops()
  toast.success(j ? t('planner.jSaved') : t('jornadas.created'))
  emit('update:open', false)
  emit('saved', r.id)
}
</script>
