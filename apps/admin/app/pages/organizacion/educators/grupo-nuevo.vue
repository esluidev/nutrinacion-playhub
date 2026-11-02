<template>
  <div class="mx-auto max-w-2xl">
    <UiPageHeader :title="t('educators.groupNewTitle')" :description="t('educators.groupNewDesc')" />

    <!-- El grupo se crea siempre: sus educadores son opcionales y se agregan también después, desde el
         grupo. Sin educadores todavía, se dice así en vez de cerrar el paso. -->
    <div class="ui-panel p-6">
      <div class="flex flex-col gap-5">
        <UiInput v-model="form.nombre" :label="t('educators.groupName')" :placeholder="t('educators.groupNamePh')" required />

        <UiTextarea
          v-model="form.descripcion"
          :label="t('educators.groupDescription')"
          optional
          :placeholder="t('educators.groupDescriptionPh')"
          :rows="3"
        />

        <div v-if="!activeEducators.length">
          <p class="field-label">{{ t('educators.groupMembersLabel') }} <span class="font-semibold text-muted">({{ t('common.optional') }})</span></p>
          <div class="rounded-control-sm border-2 border-dashed border-line bg-canvas px-4 py-3.5">
            <p class="ui-text">{{ t('educators.groupNoEducators') }}</p>
            <!-- Enlace: cielo -->
            <NuxtLink to="/organizacion/educators/nuevo" class="ui-link mt-1 inline-block text-caption" data-tone="sky">{{ t('educators.add') }}</NuxtLink>
          </div>
        </div>

        <div v-else>
          <div class="mb-2 flex items-center justify-between gap-3">
            <label class="field-label mb-0">
              {{ t('educators.groupMembersLabel') }} <span class="font-semibold text-muted">({{ t('common.optional') }}) · {{ t('educators.selectedCount', { n: selected.length }) }}</span>
            </label>
            <!-- Enlace: cielo -->
            <button
              v-if="selected.length"
              type="button"
              class="ui-link whitespace-nowrap text-caption"
              data-tone="sky"
              @click="selected = []"
            >
              {{ t('educators.clearSelection') }}
            </button>
          </div>

          <UiSearchInput v-model="query" :placeholder="t('educators.groupSearchPh')" max-width="full" />

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
              {{ t('educators.groupNoMatch') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <UiAlert v-if="error" tone="danger" class="mt-4">{{ error }}</UiAlert>

    <div class="mt-5 flex items-center justify-end gap-3">
      <UiButton variant="outline" @click="navigateTo('/organizacion/educators')">{{ t('common.cancel') }}</UiButton>
      <UiButton type="button" :loading="saving" @click="submit">{{ t('educators.createGroup') }}</UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { t } = useT()
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
    error.value = t('educators.groupNameRequired')
    return
  }

  saving.value = true
  const { id, error: err } = await createGrupo({
    nombre: form.nombre,
    descripcion: form.descripcion,
    educadorIds: selected.value,
  })
  saving.value = false

  if (err) {
    error.value = err
    return
  }
  toast.success(t('educators.groupCreated'))
  navigateTo(id ? `/organizacion/educators/grupos/${id}` : '/organizacion/educators')
}
</script>
