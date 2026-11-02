<template>
  <!-- El detalle de un grupo de educadores: su nombre y descripción (editables), sus miembros
       (añadir y quitar) y su borrado. Borrar el grupo no toca a los educadores ni a los talleres
       que se asignaron por él. -->
  <div class="mx-auto max-w-3xl">
    <template v-if="grupo">
      <div class="mb-7 flex items-center gap-4">
        <UiSymbol icon="users" :tone="uiToneFor(grupo.nombre)" />
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2.5">
            <h1 class="ui-heading truncate">{{ grupo.nombre }}</h1>
            <UiBadge tone="neutral">{{ tCount(t, 'educators.members', miembros.length) }}</UiBadge>
          </div>
          <p class="ui-text mt-1">{{ grupo.descripcion || t('educators.noDescription') }}</p>
        </div>
      </div>

      <div class="flex flex-col gap-6">
        <!-- Datos -->
        <section class="ui-panel">
          <div class="ui-panel-header">
            <h2 class="ui-title">{{ t('educators.groupData') }}</h2>
          </div>
          <form class="ui-panel-body flex flex-col gap-5" @submit.prevent="guardar">
            <UiInput v-model="form.nombre" :label="t('educators.groupName')" required />
            <UiTextarea v-model="form.descripcion" :label="t('educators.groupDescription')" optional :rows="2" />
            <UiAlert v-if="error" tone="danger">{{ error }}</UiAlert>
          </form>
          <div class="ui-panel-footer flex justify-end">
            <UiButton :loading="saving" icon="check" @click="guardar">{{ t('common.save') }}</UiButton>
          </div>
        </section>

        <!-- Miembros: quitar es acción de fila (neutra); agregar abre un diálogo con búsqueda y
             casillas, para elegir varios aunque la organización tenga cientos de educadores -->
        <section class="ui-panel">
          <div class="ui-panel-header">
            <h2 class="ui-title">{{ t('educators.groupMembersTitle') }} <span class="text-body font-bold text-subtle">· {{ miembros.length }}</span></h2>
            <UiButton v-if="disponibles.length" tone="neutral" size="sm" icon="plus" @click="abrirAgregar">{{ t('educators.addMembers') }}</UiButton>
          </div>
          <p v-if="!miembros.length" class="ui-caption px-6 py-6">{{ t('educators.groupNoMembers') }}</p>
          <ul v-else class="divide-y divide-line">
            <li v-for="e in miembros" :key="e.id" class="flex items-center gap-3 px-6 py-3">
              <UiAvatar :name="e.nombre" :initials="e.initials" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-body font-extrabold text-ink">{{ e.nombre }}</p>
                <p class="ui-caption truncate">{{ e.profesion }}<template v-if="e.estado !== 'activo'"> · {{ t('educators.inactive') }}</template></p>
              </div>
              <UiButton
                tone="neutral"
                size="sm"
                icon="trash"
                icon-only
                :label="t('educators.removeMember')"
                :title="t('educators.removeMember')"
                :disabled="enCurso"
                @click="quitar(e.id, e.nombre)"
              />
            </li>
          </ul>
          <!-- Dar de alta a alguien nuevo vuelve aquí con el educador ya en el grupo -->
          <div class="ui-panel-footer">
            <p class="ui-caption flex flex-wrap items-baseline gap-x-1">
              <span v-if="!disponibles.length">{{ educators.some(e => e.estado === 'activo') ? t('educators.groupAllIn') : t('educators.groupNoActive') }}</span>
              <span v-else>{{ t('educators.notInList') }}</span>
              <!-- Enlace: cielo -->
              <NuxtLink :to="altaEnGrupo" class="ui-link" data-tone="sky">{{ t('educators.add') }}</NuxtLink>
            </p>
          </div>
        </section>

        <!-- Agregar educadores: búsqueda por nombre o puesto y casillas; la selección no tiñe la fila -->
        <UiDialog
          :open="agregando"
          :title="t('educators.addMembersTitle', { grupo: grupo.nombre })"
          size="lg"
          split
          @update:open="(v) => { if (!v) cerrarAgregar() }"
        >
          <UiSearchInput v-model="busqueda" :placeholder="t('educators.groupSearchPh')" max-width="full" class="mt-1" />
          <div class="mt-3 flex items-center justify-between gap-3">
            <p class="ui-caption">{{ t('educators.selectedCount', { n: elegidos.length }) }}</p>
            <!-- Enlace: cielo -->
            <button v-if="elegidos.length" type="button" class="ui-link text-caption" data-tone="sky" @click="elegidos = []">{{ t('educators.clearSelection') }}</button>
          </div>
          <div class="scrollbar-thin mt-2 flex max-h-80 flex-col divide-y divide-line overflow-y-auto rounded-control-sm border-2 border-line">
            <UiCheckbox
              v-for="edu in filtrados"
              :key="edu.id"
              :model-value="elegidos.includes(edu.id)"
              class="w-full cursor-pointer px-3.5 py-2.5 transition-colors hover:bg-canvas"
              @update:model-value="alternar(edu.id)"
            >
              <UiAvatar :name="edu.nombre" :initials="edu.initials" />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-body font-extrabold text-ink">{{ edu.nombre }}</span>
                <span class="block truncate text-caption font-semibold text-muted">{{ edu.profesion }}</span>
              </span>
            </UiCheckbox>
            <p v-if="!filtrados.length" class="ui-text p-6 text-center">{{ t('educators.groupNoMatch') }}</p>
          </div>
          <template #actions>
            <UiButton tone="neutral" @click="cerrarAgregar">{{ t('common.cancel') }}</UiButton>
            <UiButton :disabled="!elegidos.length" :loading="enCurso" @click="agregar">
              {{ elegidos.length ? t('educators.addMembersConfirm', { n: elegidos.length }) : t('educators.addMembers') }}
            </UiButton>
          </template>
        </UiDialog>

        <!-- Borrar: coral, con confirmación -->
        <section class="ui-panel p-6">
          <h2 class="ui-title">{{ t('educators.groupDeleteTitle') }}</h2>
          <p class="ui-text mt-1">{{ t('educators.groupDeleteText') }}</p>
          <UiButton tone="coral" variant="outline" icon="trash" class="mt-4" @click="eliminando = true">{{ t('educators.groupDelete') }}</UiButton>
        </section>
      </div>

      <UiConfirmDialog
        :open="eliminando"
        :title="t('educators.groupDeleteConfirmTitle')"
        :confirm-label="t('educators.groupDelete')"
        symbol="trash"
        :loading="enCurso"
        @update:open="(v) => eliminando = v"
        @confirm="confirmarEliminar"
      >
        <p>{{ t('educators.groupDeleteWarn', { nombre: grupo.nombre }) }}</p>
      </UiConfirmDialog>
    </template>

    <div v-else-if="loading" class="ui-panel ui-text p-10 text-center">{{ t('common.loading') }}</div>

    <div v-else class="ui-panel">
      <UiEmptyState icon="alert" :title="t('educators.groupNotFound')">
        <UiButton variant="outline" size="sm" @click="navigateTo('/organizacion/educators')">{{ t('educators.backToList') }}</UiButton>
      </UiEmptyState>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { t } = useT()
const route = useRoute()
const { toast } = useToast()
const { educators, getGroup, getGroupMembersAll, loading, updateGrupo, deleteGrupo, addGroupMembers, removeGroupMember } = useEducators()

const id = Number(route.params.id)
const grupo = computed(() => getGroup(id))
const miembros = computed(() => getGroupMembersAll(id))
// Los educadores activos que aún no están en el grupo.
const disponibles = computed(() => {
  const dentro = new Set(miembros.value.map(m => m.id))
  return educators.value.filter(e => !dentro.has(e.id) && e.estado === 'activo')
})
const altaEnGrupo = `/organizacion/educators/nuevo?grupo=${id}`

// Diálogo «Agregar educadores»: búsqueda y casillas.
const agregando = ref(false)
const busqueda = ref('')
const elegidos = ref<number[]>([])
const filtrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return disponibles.value.filter(e => !q || `${e.nombre} ${e.profesion}`.toLowerCase().includes(q))
})

function abrirAgregar() {
  busqueda.value = ''
  elegidos.value = []
  agregando.value = true
}

function cerrarAgregar() {
  agregando.value = false
}

function alternar(educadorId: number) {
  elegidos.value = elegidos.value.includes(educadorId)
    ? elegidos.value.filter(x => x !== educadorId)
    : [...elegidos.value, educadorId]
}

const form = reactive({ nombre: '', descripcion: '' })
watch(grupo, (g) => {
  if (g) {
    form.nombre = g.nombre
    form.descripcion = g.descripcion
  }
}, { immediate: true })

const saving = ref(false)
const enCurso = ref(false)
const error = ref('')
const eliminando = ref(false)

async function guardar() {
  error.value = ''
  if (!form.nombre.trim()) {
    error.value = t('educators.groupNameRequired')
    return
  }
  saving.value = true
  const { error: err } = await updateGrupo(id, { ...form })
  saving.value = false
  if (err) {
    error.value = err
    return
  }
  toast.success(t('educators.groupSaved'))
}

async function agregar() {
  if (!elegidos.value.length) return
  const n = elegidos.value.length
  enCurso.value = true
  const { error: err } = await addGroupMembers(id, elegidos.value)
  enCurso.value = false
  if (err) {
    toast.error(err)
    return
  }
  agregando.value = false
  toast.success(n === 1 ? t('educators.memberAdded') : t('educators.membersAdded', { n }))
}

async function quitar(educadorId: number, nombre: string) {
  enCurso.value = true
  const { error: err } = await removeGroupMember(id, educadorId)
  enCurso.value = false
  if (err) {
    toast.error(err)
    return
  }
  toast.success(t('educators.memberRemoved', { nombre }))
}

async function confirmarEliminar() {
  enCurso.value = true
  const { error: err } = await deleteGrupo(id)
  enCurso.value = false
  if (err) {
    toast.error(err)
    return
  }
  eliminando.value = false
  toast.success(t('educators.groupDeleted'))
  navigateTo('/organizacion/educators')
}
</script>
