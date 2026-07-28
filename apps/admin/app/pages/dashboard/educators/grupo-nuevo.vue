<template>
  <div class="max-w-[640px] mx-auto">
    <UiPageHeader title="Nuevo Grupo" description="Agrupa educadores para asignarlos juntos a talleres" />

    <div class="card p-6">
      <div class="flex flex-col gap-[18px]">
        <UiInput v-model="form.nombre" label="Nombre del grupo" placeholder="Ej. Zona Poniente" required />

        <div class="space-y-[7px]">
          <label class="block text-[13px] font-bold text-gray-700">Descripción <span class="text-gray-400 font-semibold">(opcional)</span></label>
          <textarea
            v-model="form.descripcion"
            placeholder="Zona, turno o criterio que une a este grupo"
            class="input !h-auto min-h-[70px] py-3 resize-y"
          />
        </div>

        <div class="space-y-[9px]">
          <div class="flex items-center justify-between gap-2.5">
            <label class="text-[13px] font-bold text-gray-700">
              Educadores del grupo <span class="text-gray-400 font-semibold">· {{ selected.length }} seleccionados</span>
            </label>
            <a v-if="selected.length" class="text-xs font-bold text-brand-primary-700 hover:text-brand-primary-800 cursor-pointer whitespace-nowrap" @click="selected = []">
              Limpiar selección
            </a>
          </div>

          <div class="border-[1.5px] border-gray-100 rounded-[13px] overflow-hidden">
            <div class="flex items-center gap-2 px-3.5 h-[42px] border-b border-gray-100 bg-brand-bg">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-[15px] h-[15px] text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                v-model="query"
                placeholder="Buscar educador por nombre o puesto…"
                class="border-none outline-none text-[13.5px] text-gray-800 w-full bg-transparent"
              >
            </div>
            <div class="max-h-[440px] overflow-y-auto scrollbar-thin">
              <button
                v-for="edu in filtered"
                :key="edu.id"
                type="button"
                :class="[
                  'w-full flex items-center gap-3 px-3.5 py-2.5 border-b border-gray-50 text-left transition-colors',
                  selected.includes(edu.id) ? 'bg-brand-primary-50/60' : 'bg-white hover:bg-gray-50',
                ]"
                @click="toggle(edu.id)"
              >
                <div
                  :class="[
                    'w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 border-[1.5px] transition-all',
                    selected.includes(edu.id) ? 'bg-brand-primary border-brand-primary text-white' : 'border-[#d5ddd5] text-transparent',
                  ]"
                >
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <div :class="['w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-extrabold text-[11px]', edu.avatarBg]">
                  {{ edu.initials }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-[13.5px] font-extrabold text-gray-800 truncate">{{ edu.nombre }}</p>
                  <p class="text-[12px] font-semibold text-gray-500">{{ edu.profesion }}</p>
                </div>
              </button>
              <p v-if="!filtered.length" class="p-[22px] text-center text-[13px] font-semibold text-gray-500">
                Ningún educador coincide con la búsqueda.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p v-if="error" class="text-sm text-red-500 mt-3">{{ error }}</p>

    <div class="flex items-center justify-end gap-2.5 mt-[18px]">
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
