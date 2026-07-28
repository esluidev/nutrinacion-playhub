<template>
  <div class="max-w-[720px] mx-auto">
    <UiPageHeader title="Configuración" :description="subtitulo" />

    <div class="flex flex-col gap-[22px]">
      <!-- Datos de la comunidad -->
      <div class="card p-6">
        <p class="text-[14.5px] font-extrabold text-gray-800 mb-1">Datos de la comunidad</p>
        <p class="text-[12.5px] font-semibold text-gray-500 mb-[18px]">Visibles para todos los que operan {{ comunidad }}.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
          <div class="sm:col-span-2">
            <UiInput v-model="form.nombre" label="Nombre" />
          </div>
          <div class="sm:col-span-2 space-y-[7px]">
            <label class="block text-[13px] font-bold text-gray-700">Descripción <span class="text-gray-400 font-semibold">(opcional)</span></label>
            <textarea v-model="form.descripcion" class="input !h-auto min-h-[70px] py-3 resize-y" />
          </div>
          <UiInput v-model="form.correo" type="email" label="Correo de contacto" />
          <UiInput v-model="form.telefono" label="Teléfono" />
          <div class="sm:col-span-2 space-y-[7px]">
            <label class="block text-[13px] font-bold text-gray-700">País</label>
            <UiSelect v-model="form.pais" size="md" :options="paisOptions" />
          </div>
        </div>
      </div>

      <!-- Organización -->
      <div class="card overflow-hidden">
        <div class="px-6 py-[18px] border-b border-gray-100">
          <p class="text-[14.5px] font-extrabold text-gray-800">Organización</p>
        </div>
        <div class="flex items-center gap-3 px-6 py-[15px]">
          <div class="w-[38px] h-[38px] rounded-[11px] bg-brand-primary-50 text-brand-primary-700 flex items-center justify-center shrink-0 font-extrabold text-sm">
            {{ organizacion.charAt(0) }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-extrabold text-gray-800 text-[13.5px]">{{ organizacion }}</p>
            <p class="text-[12px] font-semibold text-gray-500 mt-0.5">Los datos de la organización y su licencia se gestionan desde el contexto de organización.</p>
          </div>
          <UiButton variant="outline" size="sm" class="shrink-0" @click="navigateTo('/organizacion/comunidades')">Ir a la organización</UiButton>
        </div>
      </div>

      <!-- Zona de peligro -->
      <div class="card !border-red-200 p-5 flex items-center gap-3.5">
        <div class="min-w-0 flex-1">
          <p class="text-[13.5px] font-extrabold text-red-700">Eliminar comunidad</p>
          <p class="text-[12.5px] font-semibold text-gray-500 mt-0.5">Se pierde el acceso de sus colaboradores y su historial de talleres. Esta acción no se puede deshacer.</p>
        </div>
        <button
          class="inline-flex items-center h-9 px-4 rounded-btn border-[1.5px] border-red-200 text-red-600 bg-white text-[12.5px] font-bold hover:bg-red-50 transition-colors shrink-0"
          @click="eliminar"
        >
          Eliminar
        </button>
      </div>
    </div>

    <div class="flex items-center justify-end gap-2.5 mt-[22px]">
      <UiButton variant="outline" @click="navigateTo('/dashboard')">Cancelar</UiButton>
      <UiButton type="button" @click="submit">Guardar Cambios</UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { t } = useT()
const { toast } = useToast()
const { comunidadActiva, orgActiva } = useContexto()

const comunidad = computed(() => comunidadActiva.value?.nombre ?? t('common.myOrg'))
const organizacion = computed(() => orgActiva.value?.nombre ?? 'Nutrinación')
const subtitulo = computed(() => `${comunidad.value} · ${organizacion.value}`)

const form = reactive({
  nombre: comunidadActiva.value?.nombre ?? '',
  descripcion: '',
  correo: '',
  telefono: '',
  pais: 'MX',
})

watch(comunidadActiva, (c) => {
  if (c) form.nombre = c.nombre
})

const paisOptions = [
  { value: 'MX', label: '🇲🇽 México' },
  { value: 'GT', label: '🇬🇹 Guatemala' },
  { value: 'SV', label: '🇸🇻 El Salvador' },
]

function submit() {
  toast.success(`Cambios guardados. La información de ${comunidad.value} se actualizó.`)
  navigateTo('/dashboard')
}
function eliminar() {
  toast.error('Esta acción requiere confirmación desde el backend.')
}
</script>
