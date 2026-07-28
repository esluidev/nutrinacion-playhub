<template>
  <div class="max-w-[720px] mx-auto">
    <!-- Hero -->
    <div class="flex items-center gap-[18px] mb-[26px]">
      <div class="w-16 h-16 rounded-[18px] bg-brand-primary flex items-center justify-center shrink-0">
        <span class="text-white font-extrabold text-2xl font-display">{{ initial }}</span>
      </div>
      <div class="min-w-0">
        <div class="flex items-center gap-2.5 flex-wrap">
          <h1 class="text-2xl font-display font-semibold text-brand-dark tracking-[-0.01em]">{{ fullName }}</h1>
          <span v-if="esSuperadmin" class="inline-flex items-center text-[11.5px] font-extrabold px-3 py-1 rounded-full bg-brand-purple-50 text-brand-purple-600">Superadmin</span>
        </div>
        <p class="text-[13px] font-semibold text-gray-500 mt-1.5">{{ email }}</p>
      </div>
      <UiButton variant="outline" size="sm" class="ml-auto shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
        </svg>
        Cambiar foto
      </UiButton>
    </div>

    <div class="flex flex-col gap-[22px]">
      <!-- Información personal -->
      <div class="card p-6">
        <p class="text-[14.5px] font-extrabold text-gray-800 mb-[18px]">Información personal</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
          <UiInput v-model="form.nombre" label="Nombre" />
          <UiInput v-model="form.apellido" label="Apellido" />
          <UiInput
            :model-value="email"
            type="email"
            label="Correo electrónico"
            disabled
            hint="Es tu cuenta de acceso; no se puede cambiar desde aquí."
          />
          <div class="space-y-[7px]">
            <label class="block text-[13px] font-bold text-gray-700">Idioma de la interfaz</label>
            <UiSelect v-model="form.idioma" size="md" :options="idiomaOptions" />
          </div>
        </div>
      </div>

      <!-- Accesos -->
      <div class="card overflow-hidden">
        <div class="px-6 py-[18px] border-b border-gray-100">
          <p class="text-[14.5px] font-extrabold text-gray-800">Accesos</p>
          <p class="text-[12.5px] font-semibold text-gray-500 mt-0.5">Lo que puedes hacer en StoryPlay; cada organización gestiona sus propios accesos.</p>
        </div>
        <div v-if="esSuperadmin" class="flex items-center gap-3 px-6 py-[15px] border-b border-gray-100">
          <div class="w-[38px] h-[38px] rounded-[11px] bg-brand-purple-50 text-brand-purple-600 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-[19px] h-[19px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-extrabold text-gray-800 text-[13.5px]">Plataforma StoryPlay</p>
            <p class="text-[12px] font-semibold text-gray-500 mt-0.5">Gestión de organizaciones, licencias e invitaciones</p>
          </div>
          <span class="inline-flex items-center text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-purple-50 text-brand-purple-600 shrink-0">Superadmin</span>
        </div>
        <div v-for="org in accesos" :key="org.nombre" class="flex items-center gap-3 px-6 py-[15px]">
          <div class="w-[38px] h-[38px] rounded-[11px] bg-brand-primary-50 text-brand-primary-700 flex items-center justify-center shrink-0 font-extrabold text-sm">
            {{ org.nombre.charAt(0) }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-extrabold text-gray-800 text-[13.5px]">{{ org.nombre }}</p>
            <p class="text-[12px] font-semibold text-gray-500 mt-0.5">{{ org.sub }}</p>
          </div>
          <span class="inline-flex items-center text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-primary-50 text-brand-primary-800 shrink-0">{{ org.rol }}</span>
        </div>
      </div>

      <!-- Seguridad -->
      <div class="card p-6">
        <p class="text-[14.5px] font-extrabold text-gray-800 mb-1">Seguridad</p>
        <p class="text-[12.5px] font-semibold text-gray-500 mb-[18px]">Cambia la contraseña con la que inicias sesión.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-[18px] items-end">
          <UiInput v-model="pwd.actual" type="password" label="Contraseña actual" placeholder="••••••••" />
          <UiInput v-model="pwd.nueva" type="password" label="Nueva contraseña" placeholder="Mínimo 8 caracteres" />
        </div>
        <div class="flex justify-end mt-4">
          <UiButton variant="outline" size="sm">Actualizar contraseña</UiButton>
        </div>
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

const { toast } = useToast()
const { esSuperadmin, orgs } = useContexto()

const perfil = computed(() => {
  if (isSupabaseConfigured()) {
    const { user } = useAuth()
    return user.value?.perfil ?? null
  }
  return null
})

const email = computed(() => {
  if (isSupabaseConfigured()) {
    const { user } = useAuth()
    return user.value?.email ?? ''
  }
  return 'admin@nutrinacion.com'
})

const form = reactive({
  nombre: perfil.value?.nombre ?? '',
  apellido: perfil.value?.apellido ?? '',
  idioma: perfil.value?.idioma ?? 'es',
})

watch(perfil, (p) => {
  if (p) {
    form.nombre = p.nombre ?? ''
    form.apellido = p.apellido ?? ''
    form.idioma = p.idioma ?? 'es'
  }
})

const fullName = computed(() =>
  [form.nombre, form.apellido].filter(Boolean).join(' ').trim() || email.value.split('@')[0],
)
const initial = computed(() => (fullName.value || 'U').charAt(0).toUpperCase())

const idiomaOptions = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
]

const accesos = computed(() =>
  orgs.value.map(o => ({
    nombre: o.nombre,
    sub: `${o.comunidades.length} comunidad(es)`,
    rol: o.esAdmin ? 'Admin' : 'Colaborador',
  })),
)

const pwd = reactive({ actual: '', nueva: '' })

function submit() {
  toast.success('Perfil actualizado. Tus datos personales se guardaron.')
  navigateTo('/dashboard')
}
</script>
