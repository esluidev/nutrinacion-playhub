<template>
  <div class="mx-auto max-w-2xl">
    <UiPageHeader title="Nuevo Grupo" description="Agrupa educadores para asignarlos juntos a talleres" />

    <div class="ui-panel p-6">
      <div class="flex flex-col gap-5">
        <UiInput v-model="form.nombre" label="Nombre del grupo" placeholder="Ej. Zona Poniente" required />

        <UiTextarea
          v-model="form.descripcion"
          label="Descripción"
          optional
          placeholder="Zona, turno o criterio que une a este grupo"
          :rows="3"
        />

        <div>
          <div class="mb-2 flex items-center justify-between gap-3">
            <label class="field-label mb-0">
              Educadores del grupo <span class="font-semibold text-muted">· {{ selected.length }} seleccionados</span>
            </label>
            <!-- Enlace: cielo -->
            <button
              v-if="selected.length"
              type="button"
              class="ui-link whitespace-nowrap text-caption"
              data-tone="sky"
              @click="selected = []"
            >
              Limpiar selección
            </button>
          </div>

          <UiSearchInput v-model="query" placeholder="Buscar educador por nombre o puesto…" max-width="full" />

          <!-- La casilla es la del kit (lima por defecto): la selección no tiñe la fila -->
          <div class="scrollbar-thin mt-3 flex max-h-110 flex-col divide-y divide-line overflow-y-auto rounded-control-sm border-2 border-line">
            <UiCheckbox
              v-for="edu in filtered"
              :key="edu.id"
              :model-value="selected.includes(edu.id)"
              class="w-full cursor-pointer px-3.5 py-2.5 transition-colors hover:bg-canvas"
              @update:model-value="toggle(edu.id)"
            >
              <UiAvatar :name="edu.nombre" :initials="edu.initials" />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-body font-extrabold text-ink">{{ edu.nombre }}</span>
                <span class="block text-caption font-semibold text-muted">{{ edu.profesion }}</span>
              </span>
            </UiCheckbox>
            <p v-if="!filtered.length" class="ui-text p-6 text-center">
              Ningún educador coincide con la búsqueda.
            </p>
          </div>
        </div>
      </div>
    </div>

    <UiAlert v-if="error" tone="danger" class="mt-4">{{ error }}</UiAlert>

    <div class="mt-5 flex items-center justify-end gap-3">
      <UiButton variant="outline" @click="navigateTo('/dashboard/educators')">Cancelar</UiButton>
      <UiButton type="button" :loading="saving" @click="submit">Crear Grupo</UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { toast } = useToast()
const { activeEducators, createGrupo } = useEducators()

const form = reactive({ nombre: '', descripcion: '' })
const query = ref('')
const selected = ref<number[]>([])
const saving = ref(false)
const error = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return activeEducators.value.filter(e => !q || `${e.nombre} ${e.profesion}`.toLowerCase().includes(q))
})

function toggle(id: number) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter(x => x !== id)
    : [...selected.value, id]
}

async function submit() {
  error.value = ''
  if (!form.nombre.trim()) {
    error.value = 'El nombre del grupo es obligatorio.'
    return
  }

  saving.value = true
  const { error: err } = await createGrupo({
    nombre: form.nombre,
    descripcion: form.descripcion,
    educadorIds: selected.value,
  })
  saving.value = false

  if (err) {
    error.value = err
    return
  }
  toast.success('Grupo creado. Ya puedes asignarlo completo a un taller.')
  navigateTo('/dashboard/educators')
}
</script>
