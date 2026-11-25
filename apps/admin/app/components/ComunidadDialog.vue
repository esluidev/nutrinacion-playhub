<template>
  <!-- Crear o editar una comunidad (tarea 023), desde su pestaña en Lugares: su nombre y sus lugares, con búsqueda y
       casillas, como los miembros de un grupo. Un lugar está en una sola comunidad: el que estaba en otra lo dice
       («Ahora en …») y pasa a esta; el que se desmarca queda sin comunidad. Puede guardarse sin lugares. Con
       `comunidad`, la edita; sin ella, la crea. -->
  <UiDialog
    :open="open"
    :title="comunidad ? t('places.communityEditTitle') : t('places.communityNewTitle')"
    size="lg"
    split
    @update:open="(v) => emit('update:open', v)"
  >
    <UiInput
      id="comunidad-nombre"
      v-model="nombre"
      :label="t('places.communityName')"
      :placeholder="t('places.communityNamePh')"
      required
    />
    <p class="field-label mt-5">{{ t('places.communityPlaces') }} <span class="font-semibold text-muted">· {{ elegidos.length }}</span></p>
    <template v-if="lugares.length">
      <UiSearchInput v-model="busqueda" :placeholder="t('places.communityPlacesSearchPh')" max-width="full" />
      <div class="scrollbar-thin mt-2 flex max-h-72 flex-col divide-y divide-line overflow-y-auto rounded-control-sm border-2 border-line">
        <UiCheckbox
          v-for="l in filtrados"
          :key="l.id"
          :model-value="elegidos.includes(l.id)"
          class="w-full cursor-pointer px-3.5 py-2.5 transition-colors hover:bg-canvas"
          @update:model-value="alternar(l.id)"
        >
          <span class="min-w-0 flex-1">
            <span class="block truncate text-body font-extrabold text-ink">{{ l.nombre }}</span>
            <!-- Si está en otra comunidad, lo dice: al marcarlo, pasa a esta -->
            <span v-if="l.comunidadId && l.comunidadId !== comunidad?.id" class="block truncate text-caption font-semibold text-muted">
              {{ t('places.communityNow', { nombre: l.comunidad }) }}
            </span>
          </span>
        </UiCheckbox>
        <p v-if="!filtrados.length" class="ui-caption px-3.5 py-3">{{ t('table.emptyFiltered') }}</p>
      </div>
    </template>
    <p v-else class="ui-caption">{{ t('places.communityNoPlaces') }}</p>
    <p v-if="error" class="field-error mt-3">{{ error }}</p>

    <template #actions>
      <UiButton tone="neutral" @click="emit('update:open', false)">{{ t('common.cancel') }}</UiButton>
      <UiButton :loading="guardando" icon="check" @click="guardar">
        {{ comunidad ? t('common.save') : t('places.communityCreate') }}
      </UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { sinAcentos } from '@playhub/ui/app/utils/texto'
import type { Comunidad } from '~/composables/useLugares'

const props = defineProps<{ open: boolean, comunidad?: Comunidad | null }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const { t } = useT()
const { toast } = useToast()
const { lugares, crearComunidad, actualizarComunidad } = useLugares()

const nombre = ref('')
const elegidos = ref<number[]>([])
const busqueda = ref('')
const error = ref('')
const guardando = ref(false)

watch(() => props.open, (abierto) => {
  if (!abierto) return
  nombre.value = props.comunidad?.nombre ?? ''
  elegidos.value = props.comunidad ? lugares.value.filter(l => l.comunidadId === props.comunidad!.id).map(l => l.id) : []
  busqueda.value = ''
  error.value = ''
})

const filtrados = computed(() => {
  const q = sinAcentos(busqueda.value.trim())
  return lugares.value.filter(l => !q || sinAcentos(l.nombre).includes(q) || sinAcentos(l.comunidad).includes(q))
})

function alternar(id: number) {
  elegidos.value = elegidos.value.includes(id) ? elegidos.value.filter(x => x !== id) : [...elegidos.value, id]
}

async function guardar() {
  error.value = ''
  if (!nombre.value.trim()) { error.value = t('places.communityNameRequired'); return }
  guardando.value = true
  const { error: e } = props.comunidad
    ? await actualizarComunidad(props.comunidad.id, nombre.value, elegidos.value)
    : await crearComunidad(nombre.value, elegidos.value)
  guardando.value = false
  if (e) { error.value = e; return }
  toast.success(props.comunidad ? t('places.communitySaved') : t('places.communityCreated'))
  emit('update:open', false)
}
</script>
