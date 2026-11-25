<template>
  <!-- A quién va el taller (tarea 021): un desplegable con las audiencias activas de la organización y, al final,
       «Nueva audiencia…», que la da de alta ahí mismo, debajo del campo (CrearEnLinea), solo con su nombre, y queda
       elegida: nunca un diálogo encima del formulario (tarea 023). Las edades y la descripción se agregan después, en
       Audiencias. Para una feria, cada organización ya tiene «Público general» (abierta: el cierre lleva solo el
       total). Una ya elegida que se retiró después sigue a la vista, marcada. -->
  <div>
    <UiSelect
      :model-value="creando ? NUEVA : audienciaId"
      :options="opciones"
      :label="t('audiences.field')"
      :placeholder="t('audiences.pick')"
      @update:model-value="elegir"
    />
    <CrearEnLinea
      v-if="creando"
      v-model:nombre="nombre"
      :id="`${uid}-nueva`"
      :label="t('audiences.fNameNew')"
      :placeholder="t('audiences.fNamePh')"
      :boton="t('audiences.create')"
      :ayuda="t('audiences.inlineHint')"
      :guardando="guardando"
      :error="errorNuevo"
      @crear="crear"
      @cancelar="creando = false"
    />
    <p v-else-if="error" class="field-error">{{ error }}</p>
    <p v-else class="field-help">{{ elegida?.abierto ? t('audiences.openHint') : t('audiences.fieldHint') }}</p>
  </div>
</template>

<script setup lang="ts">
import { datosAudienciaVacios } from '~/composables/useAudiencias'

defineProps<{ error?: string }>()
const audienciaId = defineModel<number | null>({ required: true })

const NUEVA = 'nueva'
const { t } = useT()
const { toast } = useToast()
const uid = useId()
const { audiencias, audienciasActivas, getAudiencia, crear: crearAudiencia } = useAudiencias()

const elegida = computed(() => getAudiencia(audienciaId.value))
const opciones = computed(() => {
  const activas = audienciasActivas.value.map(a => ({ value: a.id, label: a.nombre }))
  const retirada = audiencias.value.find(a => a.id === audienciaId.value && !a.activo)
  return [
    ...(retirada ? [{ value: retirada.id, label: `${retirada.nombre} ${t('places.retiredMark')}` }] : []),
    ...activas,
    { value: NUEVA, label: t('audiences.newOption'), pinned: true },
  ]
})

const creando = ref(false)
const nombre = ref('')
const guardando = ref(false)
// El error del alta ahí mismo (el de fuera, `error`, es el del campo).
const errorNuevo = ref('')

function elegir(v: string | number | null) {
  if (v === NUEVA) {
    creando.value = true
    nombre.value = ''
    errorNuevo.value = ''
    return
  }
  creando.value = false
  audienciaId.value = typeof v === 'number' ? v : null
}

async function crear(texto: string) {
  errorNuevo.value = ''
  if (!texto) { errorNuevo.value = t('audiences.nameRequired'); return }
  guardando.value = true
  const r = await crearAudiencia({ ...datosAudienciaVacios(), nombre: texto })
  guardando.value = false
  if (r.error || !r.id) { errorNuevo.value = r.error ?? ''; return }
  toast.success(t('audiences.created'))
  audienciaId.value = r.id
  creando.value = false
}
</script>
