<template>
  <!-- Elegir quién da un taller nuevo (tarea 023). Funciona igual que elegir el storyboard: el diálogo ancho del kit, las
       pestañas (educadores uno a uno o un grupo entero) a la izquierda y el buscador a la derecha (como en Educadores),
       tarjetas compactas en 3 columnas que se marcan en cielo (avatar, nombre y profesión con su grupo; el grupo, su
       símbolo y sus educadores activos), de 9 en 9 con la paginación del kit, y abajo «Cancelar» y «Elegir
       Educadores»: nada cambia en el taller hasta confirmar. Con cientos, se busca (sin acentos ni mayúsculas) y se pasa
       de página. Un grupo sin educadores activos no se puede marcar: no asignaría a nadie. -->
  <UiDialog :open="open" :title="t('wizard.pickEducators')" size="xl" @update:open="(v) => emit('update:open', v)">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <UiTabs v-model="modoTabs" :items="pestanas" fit />
      <div class="flex min-w-0 grow basis-72 justify-end">
        <UiSearchInput v-model="busqueda" :placeholder="modo === 'individual' ? t('educators.searchPh') : t('wizard.searchGroup')" max-width="xs" class="min-w-0 flex-1" />
      </div>
    </div>
    <template v-if="modo === 'individual'">
      <div v-if="educadoresFiltrados.length" class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="edu in paginaEducadores"
          :key="edu.id"
          type="button"
          data-tone="sky"
          class="select-card flex-row items-center justify-start gap-3 px-4 py-3 pr-10 text-left"
          :aria-pressed="ids.includes(edu.id)"
          @click="alternar(ids, edu.id)"
        >
          <span class="selected-mark"><UiIcon name="check" /></span>
          <UiAvatar :name="edu.nombre" :initials="edu.initials" size="lg" />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-body font-extrabold text-ink">{{ edu.nombre }}</span>
            <span class="mt-0.5 block truncate text-caption font-semibold text-muted">{{ [edu.profesion, edu.grupo].filter(Boolean).join(' · ') }}</span>
          </span>
        </button>
      </div>
      <UiEmptyState v-else icon="users" :title="activeEducators.length ? t('common.noResults') : t('wizard.noEducators')" :text="activeEducators.length ? t('educators.groupNoMatch') : t('wizard.noEducatorsText')" />
      <UiPagination v-if="educadoresFiltrados.length > POR_PAGINA" v-model:page="paginaActual" :total="educadoresFiltrados.length" :page-size="POR_PAGINA" class="mt-5" />
    </template>

    <template v-else>
      <div v-if="gruposFiltrados.length" class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="grupo in paginaGrupos"
          :key="grupo.id"
          type="button"
          data-tone="sky"
          class="select-card flex-row items-center justify-start gap-3 px-4 py-3 pr-10 text-left"
          :aria-pressed="grupos.includes(grupo.id)"
          :disabled="!miembrosActivos(grupo.id)"
          @click="alternar(grupos, grupo.id)"
        >
          <span class="selected-mark"><UiIcon name="check" /></span>
          <UiSymbol icon="users" size="md" :tone="uiToneFor(grupo.nombre)" />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-body font-extrabold text-ink">{{ grupo.nombre }}</span>
            <span v-if="miembrosActivos(grupo.id)" class="mt-0.5 block truncate text-caption font-semibold text-muted">{{ tCount(t, 'wizard.groupMembers', miembrosActivos(grupo.id)) }}</span>
            <span v-else class="mt-0.5 block text-caption font-bold text-(--tone-strong)" data-tone="coral">{{ t('wizard.groupEmpty') }}</span>
          </span>
        </button>
      </div>
      <UiEmptyState v-else icon="users" :title="activeGroups.length ? t('common.noResults') : t('wizard.noGroups')" :text="activeGroups.length ? t('wizard.groupsNoMatch') : t('wizard.noGroupsText')" />
      <UiPagination v-if="gruposFiltrados.length > POR_PAGINA" v-model:page="paginaActual" :total="gruposFiltrados.length" :page-size="POR_PAGINA" class="mt-5" />
      <p v-if="activeGroups.length" class="ui-caption mt-3">{{ t('wizard.groupNote') }}</p>
    </template>

    <!-- El pie, como el de una página: a la izquierda cuántos van elegidos (y limpiarlos); a la derecha, los botones del
         tamaño de su texto -->
    <template #actions>
      <p class="ui-caption mr-auto flex min-w-0 items-center gap-3 self-center">
        <span>{{ resumen }}</span>
        <button v-if="ids.length || grupos.length" type="button" class="ui-link text-caption" data-tone="sky" @click="limpiar">{{ t('educators.clearSelection') }}</button>
      </p>
      <UiButton tone="neutral" @click="emit('update:open', false)">{{ t('common.cancel') }}</UiButton>
      <UiButton icon="check" :disabled="!ids.length && !grupos.length" @click="confirmar">{{ t('wizard.confirmEducators') }}</UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { sinAcentos } from '@playhub/ui/app/utils/texto'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const { t } = useT()
const { activeEducators, activeGroups, getGroupMembers } = useEducators()
const { state } = useWorkshopWizard()

// Lo marcado en el diálogo (educadores o grupos, uno u otro): pasa al taller solo al confirmar.
const modo = ref<'individual' | 'group'>('individual')
const ids = ref<number[]>([])
const grupos = ref<number[]>([])
const modoTabs = computed({
  get: () => modo.value as string,
  set: v => (modo.value = v as 'individual' | 'group'),
})
const pestanas = computed(() => [
  { value: 'individual', label: t('wizard.modeEducators') },
  { value: 'group', label: t('wizard.modeGroups') },
])
const miembrosActivos = (id: number) => getGroupMembers(id).length

function alternar(lista: number[], id: number) {
  const i = lista.indexOf(id)
  if (i === -1) lista.push(id)
  else lista.splice(i, 1)
}
function limpiar() {
  ids.value = []
  grupos.value = []
}

// Por nombre, profesión o grupo (los grupos, por nombre), sin acentos ni mayúsculas.
const busqueda = ref('')
const educadoresFiltrados = computed(() => {
  const q = sinAcentos(busqueda.value.trim())
  return q ? activeEducators.value.filter(e => [e.nombre, e.profesion, e.grupo].some(x => sinAcentos(x ?? '').includes(q))) : activeEducators.value
})
const gruposFiltrados = computed(() => {
  const q = sinAcentos(busqueda.value.trim())
  return q ? activeGroups.value.filter(g => sinAcentos(g.nombre).includes(q)) : activeGroups.value
})

// De 9 en 9 (tres filas de tres): al buscar o cambiar de pestaña, la primera.
const POR_PAGINA = 9
const paginaActual = ref(1)
const corte = <T>(lista: T[]) => lista.slice((paginaActual.value - 1) * POR_PAGINA, paginaActual.value * POR_PAGINA)
const paginaEducadores = computed(() => corte(educadoresFiltrados.value))
const paginaGrupos = computed(() => corte(gruposFiltrados.value))
watch([busqueda, modo], () => { paginaActual.value = 1 })

// «2 educadores elegidos» (en un grupo, sus educadores, sin repetir): los marcados pueden quedar en otra página.
const resumen = computed(() => {
  if (modo.value === 'group') {
    const n = new Set(grupos.value.flatMap(id => getGroupMembers(id).map(m => m.id))).size
    return tCount(t, 'wizard.educatorsChosen', n)
  }
  return tCount(t, 'wizard.educatorsChosen', ids.value.length)
})

// Al abrirlo: lo que ya tiene el taller marcado, en su pestaña, y la búsqueda de cero. Cambiar de pestaña deja solo lo
// de la pestaña nueva (o educadores uno a uno, o grupos).
watch(() => props.open, (abierto) => {
  if (!abierto) return
  modo.value = state.value.educatorMode || 'individual'
  ids.value = [...state.value.educatorIds]
  grupos.value = [...state.value.groupIds]
  busqueda.value = ''
  paginaActual.value = 1
})
watch(modo, (nuevo) => {
  if (nuevo === 'individual') grupos.value = []
  else ids.value = []
})

function confirmar() {
  state.value.educatorMode = modo.value
  state.value.educatorIds = modo.value === 'individual' ? [...ids.value] : []
  state.value.groupIds = modo.value === 'group' ? [...grupos.value] : []
  emit('update:open', false)
}
</script>
