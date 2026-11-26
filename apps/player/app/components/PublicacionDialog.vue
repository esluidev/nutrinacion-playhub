<template>
  <!-- Editar la publicación de un storyboard: su estado, los países donde se ofrece, para quién (estándar, todas las
       organizaciones de sus países, o personalizado de una) y si sale en la app del hogar. Nada cambia hasta
       «Guardar»; la base frena lo que no se puede (publicar sin país, despublicar lo que ya se usa, quitar un país con
       talleres por venir) y su mensaje sale aquí. -->
  <UiDialog :open="open" title="Editar Publicación" size="lg" @update:open="(v) => emit('update:open', v)">
    <div class="space-y-6">
      <div>
        <UiSelect v-model="form.estado" :options="estadoOpciones" label="Estado" />
        <p class="field-help">{{ ESTADO_PUBLICACION[form.estado].desc }}</p>
      </div>

      <div>
        <p class="field-label">Países</p>
        <p v-if="!paises.length" class="ui-text">No se pudo leer la lista de países.</p>
        <div v-else class="flex flex-wrap gap-2" role="group" aria-label="Países donde se ofrece">
          <button
            v-for="pais in paises"
            :key="pais.codigo"
            type="button"
            class="filter filter-sm"
            :aria-pressed="form.paises.includes(pais.codigo)"
            @click="togglePais(pais.codigo)"
          >
            <span v-if="pais.bandera" aria-hidden="true">{{ pais.bandera }}</span>{{ pais.nombre }}
          </button>
        </div>
        <p class="field-help">Para publicar, al menos uno.</p>
      </div>

      <div>
        <UiSelect :model-value="form.organizacionId" :options="orgOpciones" label="Para quién" @update:model-value="(v) => { form.organizacionId = typeof v === 'number' ? v : null }" />
        <p class="field-help">Una organización: solo la ve ella.</p>
      </div>

      <div>
        <UiCheckbox v-model="form.hogar" label="También en la app del hogar" :disabled="!puedeHogar" />
        <p class="field-help">{{ puedeHogar ? 'Para las familias de sus países, según la edad de cada perfil.' : 'Solo si está publicado y es para todas las organizaciones.' }}</p>
      </div>

      <p v-if="error" class="field-error">{{ error }}</p>
    </div>
    <template #actions>
      <UiButton icon="check" :loading="guardando" :disabled="!cambios" @click="guardar">Guardar</UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { ESTADO_PUBLICACION, ORDEN_PUBLICACION } from '~/utils/catalogoResumen'
import type { EstadoPublicacion } from '~/utils/catalogoResumen'

const props = defineProps<{ open: boolean, slug: string }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const { publicacionDe, publicar, paises, organizaciones } = useCatalogoBase()
const { toast } = useToast()
const publicacion = computed(() => publicacionDe(props.slug))

const form = reactive<{ estado: EstadoPublicacion, paises: string[], organizacionId: number | null, hogar: boolean }>({
  estado: 'REGISTRADO', paises: [], organizacionId: null, hogar: false,
})
const error = ref('')
// Al abrir, parte de lo guardado: cerrar sin guardar descarta lo que se tocó.
watch(() => props.open, (abierto) => {
  const p = publicacion.value
  if (!abierto || !p) return
  Object.assign(form, { estado: p.estado, paises: [...p.paises], organizacionId: p.organizacionId, hogar: p.hogar })
  error.value = ''
}, { immediate: true })

// El hogar, solo con un publicado estándar: si deja de serlo, la casilla se apaga (la base lo quitaría igual).
const puedeHogar = computed(() => form.estado === 'PUBLICADO' && form.organizacionId === null)
watch(puedeHogar, (puede) => { if (!puede) form.hogar = false })

const estadoOpciones = ORDEN_PUBLICACION.map(value => ({ value, label: ESTADO_PUBLICACION[value].label }))
const orgOpciones = computed(() => [
  { value: null, label: 'Todas las organizaciones de sus países' },
  ...organizaciones.value.map(o => ({ value: o.id, label: o.nombre })),
])

const cambios = computed(() => !!publicacion.value && (
  form.estado !== publicacion.value.estado
  || form.organizacionId !== publicacion.value.organizacionId
  || form.hogar !== publicacion.value.hogar
  || [...form.paises].sort().join() !== [...publicacion.value.paises].sort().join()))

function togglePais(codigo: string) {
  form.paises = form.paises.includes(codigo) ? form.paises.filter(c => c !== codigo) : [...form.paises, codigo]
}

const guardando = ref(false)
async function guardar() {
  guardando.value = true
  error.value = (await publicar(props.slug, { estado: form.estado, paises: form.paises, organizacionId: form.organizacionId, hogar: form.hogar })) ?? ''
  guardando.value = false
  if (error.value) return
  toast.success('Publicación guardada.')
  emit('update:open', false)
}
</script>
