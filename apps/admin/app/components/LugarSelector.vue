<template>
  <!-- Dónde se da el taller o la jornada (tarea 021): un desplegable con los lugares activos de la organización y, al
       final, «Nuevo lugar…», que lo da de alta ahí mismo, debajo del campo (CrearEnLinea), y queda elegido: nunca un
       diálogo encima del formulario (tarea 023). Su comunidad se agrega después, en Lugares. Uno ya elegido que se
       retiró después sigue a la vista, marcado. -->
  <div>
    <UiSelect
      :model-value="creando ? NUEVO : lugarId"
      :options="opciones"
      :label="label ?? t('places.field')"
      :placeholder="t('places.pick')"
      @update:model-value="elegir"
    />
    <CrearEnLinea
      v-if="creando"
      v-model:nombre="nombre"
      :id="`${uid}-nuevo`"
      :label="t('places.fNameNew')"
      :placeholder="t('places.fNamePh')"
      :boton="t('places.create')"
      :ayuda="t('places.inlineHint')"
      :guardando="guardando"
      :error="errorNuevo"
      @crear="crear"
      @cancelar="creando = false"
    />
    <p v-else-if="error" class="field-error">{{ error }}</p>
    <p v-else-if="hint" class="field-help">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { nombreConComunidad } from '~/composables/useLugares'

defineProps<{ label?: string, hint?: string, error?: string }>()
const lugarId = defineModel<number | null>({ required: true })

const NUEVO = 'nuevo'
const { t } = useT()
const { toast } = useToast()
const uid = useId()
const { lugares, lugaresActivos, crear: crearLugar } = useLugares()

const opciones = computed(() => {
  const activos = lugaresActivos.value.map(l => ({ value: l.id, label: nombreConComunidad(l) }))
  const elegido = lugares.value.find(l => l.id === lugarId.value && !l.activo)
  return [
    ...(elegido ? [{ value: elegido.id, label: `${nombreConComunidad(elegido)} ${t('places.retiredMark')}` }] : []),
    ...activos,
    { value: NUEVO, label: t('places.newOption'), pinned: true },
  ]
})

const creando = ref(false)
const nombre = ref('')
const guardando = ref(false)
// El error del alta ahí mismo (el de fuera, `error`, es el del campo).
const errorNuevo = ref('')

function elegir(v: string | number | null) {
  if (v === NUEVO) {
    creando.value = true
    nombre.value = ''
    errorNuevo.value = ''
    return
  }
  creando.value = false
  lugarId.value = typeof v === 'number' ? v : null
}

async function crear(texto: string) {
  errorNuevo.value = ''
  if (!texto) { errorNuevo.value = t('places.nameRequired'); return }
  guardando.value = true
  const r = await crearLugar({ nombre: texto, comunidad: { comunidadId: null, nueva: '' } })
  guardando.value = false
  if (r.error || !r.id) { errorNuevo.value = r.error ?? ''; return }
  toast.success(t('places.created'))
  lugarId.value = r.id
  creando.value = false
}
</script>
