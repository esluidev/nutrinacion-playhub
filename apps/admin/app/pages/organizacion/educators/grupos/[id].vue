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

        <!-- Miembros: quitar es acción de fila (neutra); añadir, un desplegable con los que faltan -->
        <section class="ui-panel">
          <div class="ui-panel-header">
            <h2 class="ui-title">{{ t('educators.groupMembersTitle') }} <span class="text-body font-bold text-subtle">· {{ miembros.length }}</span></h2>
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
          <div class="ui-panel-footer">
            <div v-if="disponibles.length" class="flex items-end gap-3">
              <UiSelect v-model="nuevoMiembro" :options="disponibles" :label="t('educators.addMember')" :placeholder="t('educators.pickEducator')" class="min-w-0 flex-1" />
              <UiButton variant="outline" :disabled="!nuevoMiembro" :loading="enCurso" icon="plus" @click="agregar">{{ t('common.add') }}</UiButton>
            </div>
            <!-- Sin nadie que agregar: si no hay educadores activos, darlos de alta y volver ya dentro del grupo -->
            <p v-else-if="educators.some(e => e.estado === 'activo')" class="ui-caption">{{ t('educators.groupAllIn') }}</p>
            <p v-else class="ui-caption">
              {{ t('educators.groupNoActive') }}
              <!-- Enlace: cielo -->
              <NuxtLink :to="`/organizacion/educators/nuevo?grupo=${id}`" class="ui-link" data-tone="sky">{{ t('educators.add') }}</NuxtLink>
            </p>
          </div>
        </section>

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
const { educators, getGroup, getGroupMembersAll, loading, updateGrupo, deleteGrupo, addGroupMember, removeGroupMember } = useEducators()

const id = Number(route.params.id)
const grupo = computed(() => getGroup(id))
const miembros = computed(() => getGroupMembersAll(id))
const disponibles = computed(() => {
  const dentro = new Set(miembros.value.map(m => m.id))
  return educators.value.filter(e => !dentro.has(e.id) && e.estado === 'activo').map(e => ({ value: e.id, label: e.nombre }))
})

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
const nuevoMiembro = ref<string | number | null>('')

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
  if (!nuevoMiembro.value) return
  enCurso.value = true
  const { error: err } = await addGroupMember(id, Number(nuevoMiembro.value))
  enCurso.value = false
  if (err) {
    toast.error(err)
    return
  }
  nuevoMiembro.value = ''
  toast.success(t('educators.memberAdded'))
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
