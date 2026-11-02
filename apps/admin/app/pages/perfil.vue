<template>
  <div class="mx-auto max-w-3xl">
    <!-- Hero -->
    <div class="mb-7 flex items-center gap-5">
      <UiAvatar :name="fullName" size="lg" />
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2.5">
          <h1 class="ui-heading">{{ fullName }}</h1>
          <!-- Rol sin estado: neutro -->
          <UiBadge v-if="esSuperadmin" tone="neutral">Superadmin</UiBadge>
        </div>
        <p class="ui-text mt-1">{{ email }}</p>
      </div>
    </div>

    <div class="flex flex-col gap-6">
      <!-- Información personal -->
      <section class="ui-panel">
        <div class="ui-panel-header">
          <h2 class="ui-title">{{ t('perfil.personal') }}</h2>
        </div>
        <div class="ui-panel-body grid grid-cols-1 gap-5 sm:grid-cols-2">
          <UiInput v-model="form.nombre" :label="t('perfil.firstName')" />
          <UiInput v-model="form.apellido" :label="t('perfil.lastName')" />
          <UiInput :model-value="email" type="email" :label="t('perfil.email')" disabled :hint="t('perfil.emailHint')" />
          <UiSelect v-model="form.idioma" :label="t('perfil.language')" :options="idiomaOptions" />
        </div>
        <div class="ui-panel-footer flex justify-end">
          <UiButton :loading="guardando" icon="check" @click="guardar">{{ t('common.save') }}</UiButton>
        </div>
      </section>

      <!-- Accesos: Platform y cada organización con el rol con que la opero -->
      <section class="ui-panel">
        <div class="ui-panel-header">
          <div class="min-w-0">
            <h2 class="ui-title">{{ t('perfil.access') }}</h2>
            <p class="ui-caption mt-0.5">{{ t('perfil.accessDesc') }}</p>
          </div>
        </div>
        <div class="divide-y divide-line">
          <div v-if="esSuperadmin" class="flex items-center gap-3 px-6 py-4">
            <!-- La plataforma es estructura: neutra -->
            <UiSymbol icon="building" size="md" tone="neutral" />
            <div class="min-w-0 flex-1">
              <p class="text-body font-extrabold text-ink">{{ t('perfil.platform') }}</p>
              <p class="ui-caption mt-0.5">{{ t('perfil.platformDesc') }}</p>
            </div>
            <UiBadge tone="neutral" class="shrink-0">Superadmin</UiBadge>
          </div>
          <div v-for="org in orgs" :key="org.id" class="flex items-center gap-3 px-6 py-4">
            <!-- Organización: tono estable por nombre -->
            <UiSymbol size="md" :tone="uiToneFor(org.nombre)" class="text-body font-black">
              {{ org.nombre.charAt(0) }}
            </UiSymbol>
            <div class="min-w-0 flex-1">
              <p class="text-body font-extrabold text-ink">{{ org.nombre }}</p>
              <p class="ui-caption mt-0.5">{{ org.esAdmin ? t('perfil.roleAdminDesc') : t('perfil.roleCollabDesc') }}</p>
            </div>
            <UiBadge tone="neutral" class="shrink-0">{{ org.esAdmin ? t('perfil.roleAdmin') : t('perfil.roleCollab') }}</UiBadge>
          </div>
          <p v-if="!orgs.length && !esSuperadmin" class="ui-caption px-6 py-5">{{ t('ctx.noAccess') }}</p>
        </div>
      </section>

      <!-- Seguridad -->
      <section class="ui-panel">
        <div class="ui-panel-header">
          <div class="min-w-0">
            <h2 class="ui-title">{{ t('perfil.security') }}</h2>
            <p class="ui-caption mt-0.5">{{ t('perfil.securityDesc') }}</p>
          </div>
        </div>
        <!-- Se cambia en dos pasos (CambiarPassword): primero la actual, después la nueva -->
        <div class="ui-panel-body">
          <UiButton variant="outline" icon="key" @click="cambiandoPassword = true">{{ t('perfil.pwSubmit') }}</UiButton>
          <p class="ui-caption mt-3">{{ t('perfil.pwForgot') }}</p>
        </div>
      </section>
    </div>

    <CambiarPassword :open="cambiandoPassword" @close="cambiandoPassword = false" />
  </div>
</template>

<script setup lang="ts">
// Mi perfil (usuario de Admin): nombre, apellido e idioma de la interfaz, y la contraseña. Es de
// la persona, no de ningún contexto: vive en /perfil, también para quien solo entra a Platform.
// El correo es la cuenta de acceso y no se cambia aquí; no hay foto (sin almacenamiento de avatares).
definePageMeta({ layout: 'dashboard' })

const { t } = useT()
const { toast } = useToast()
const { esSuperadmin, orgs } = useContexto()
const demo = !isSupabaseConfigured()

const perfil = computed(() => demo ? null : useAuth().user.value?.perfil ?? null)
const email = computed(() => demo ? 'admin@nutrinacion.com' : useAuth().user.value?.email ?? '')

const form = reactive({ nombre: '', apellido: '', idioma: 'es' as 'es' | 'en' })
watch(perfil, (p) => {
  form.nombre = p?.nombre ?? ''
  form.apellido = p?.apellido ?? ''
  form.idioma = p?.idioma === 'en' ? 'en' : 'es'
}, { immediate: true })

const fullName = computed(() =>
  [perfil.value?.nombre, perfil.value?.apellido].filter(Boolean).join(' ').trim() || email.value.split('@')[0] || '',
)

const idiomaOptions = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
]

const guardando = ref(false)
async function guardar() {
  if (demo) { toast.success(t('perfil.saved')); return }
  guardando.value = true
  const { error } = await useAuth().actualizarPerfil(form)
  guardando.value = false
  if (error) { toast.error(error); return }
  toast.success(t('perfil.saved'))
}

// ── Contraseña: el diálogo de dos pasos ──────────────────────────────────────
const cambiandoPassword = ref(false)
</script>
