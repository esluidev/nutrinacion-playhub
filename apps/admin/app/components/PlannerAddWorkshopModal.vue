<template>
  <Teleport to="body">
    <div
      v-if="showAddModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/30 backdrop-blur-sm"
        @click="showAddModal = false"
      />

      <!-- Modal Card -->
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-display font-bold text-brand-dark">Nuevo Taller</h3>
          <button
            class="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            @click="showAddModal = false"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form class="space-y-4" @submit.prevent="onSubmit">
          <!-- Fecha -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">Fecha</label>
            <input
              v-model="form.fecha"
              type="date"
              class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            />
          </div>

          <!-- Titulo -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">Titulo del taller</label>
            <input
              v-model="form.title"
              type="text"
              placeholder="Ej: Alimentacion Saludable"
              class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              required
            />
          </div>

          <!-- Hora -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1">Hora inicio</label>
              <input
                v-model="form.timeStart"
                type="time"
                class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1">Hora fin</label>
              <input
                v-model="form.timeEnd"
                type="time"
                class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                required
              />
            </div>
          </div>

          <!-- Educador -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">Educador</label>
            <select
              v-model="form.educator"
              class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary bg-white"
              required
            >
              <option value="" disabled>Seleccionar educador</option>
              <option v-for="e in mockEducators" :key="e" :value="e">{{ e }}</option>
            </select>
          </div>

          <!-- Ubicacion -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">Ubicacion</label>
            <input
              v-model="form.location"
              type="text"
              placeholder="Ej: Sala A - Centro Comunitario"
              class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              required
            />
          </div>

          <!-- Storyboard -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">Storyboard</label>
            <select
              v-model="form.storyboard"
              class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary bg-white"
              required
            >
              <option value="" disabled>Seleccionar storyboard</option>
              <option v-for="s in mockStoryboards" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
              @click="showAddModal = false"
            >
              Cancelar
            </button>
            <UiButton variant="primary" size="sm" type="submit">
              Agregar Taller
            </UiButton>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { showAddModal, addModalDate, addWorkshop } = usePlanner()

const mockEducators = [
  'Dra. Maria Lopez',
  'Lic. Carlos Mendez',
  'Chef Ana Torres',
  'Dr. Roberto Sanchez',
  'Ing. Patricia Vega',
  'Lic. Laura Gutierrez',
]

const mockStoryboards = [
  'Nutricion Basica',
  'Etiquetas',
  'Loncheras',
  'Obesidad Infantil',
  'Huertos',
  'Smoothies',
  'Hidratacion',
  'Porciones',
]

const defaultForm = () => ({
  fecha: '',
  title: '',
  timeStart: '09:00',
  timeEnd: '10:30',
  educator: '',
  location: '',
  storyboard: '',
})

const form = ref(defaultForm())

watch(showAddModal, (open) => {
  if (open) {
    form.value = defaultForm()
    if (addModalDate.value) {
      form.value.fecha = addModalDate.value
    }
  }
})

function onSubmit() {
  addWorkshop({
    title: form.value.title,
    time: `${form.value.timeStart} - ${form.value.timeEnd}`,
    educator: form.value.educator,
    location: form.value.location,
    fecha: form.value.fecha,
    storyboard: form.value.storyboard,
  })
  showAddModal.value = false
}
</script>
