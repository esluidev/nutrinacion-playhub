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

      <!-- Accesos -->
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
          <div v-for="org in accesos" :key="org.nombre" class="flex items-center gap-3 px-6 py-4">
            <!-- Organización: tono estable por nombre -->
            <UiSymbol size="md" :tone="uiToneFor(org.nombre)" class="text-body font-black">
              {{ org.nombre.charAt(0) }}
            </UiSymbol>
            <div class="min-w-0 flex-1">
              <p class="text-body font-extrabold text-ink">{{ org.nombre }}</p>
              <p class="ui-caption mt-0.5">{{ org.sub }}</p>
            </div>
            <UiBadge tone="neutral" class="shrink-0">{{ org.rol }}</UiBadge>
          </div>
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
        <form class="ui-panel-body" @submit.prevent="cambiar">
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <UiInput v-model="pwd.actual" type="password" autocomplete="current-password" :label="t('perfil.pwCurrent')" :error="pwdErrores.actual" />
            <UiInput v-model="pwd.nueva" type="password" autocomplete="new-password" :label="t('perfil.pwNew')" :placeholder="t('perfil.pwMin')" :error="pwdErrores.nueva" />
            <UiInput v-model="pwd.confirmar" type="password" autocomplete="new-password" :label="t('perfil.pwConfirm')" :error="pwdErrores.confirmar" />
          </div>
          <div class="mt-4 flex justify-end">
            <UiButton type="submit" variant="outline" :loading="cambiando" :disabled="!pwd.actual || !pwd.nueva">{{ t('perfil.pwSubmit') }}</UiButton>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// Mi perfil (usuario de Admin): nombre, apellido e idioma de la interfaz, y la contraseña.
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

const accesos = computed(() =>
  orgs.value.map(o => ({
    nombre: o.nombre,
    sub: tCount(t, 'perfil.communities', o.comunidades.length),
    rol: o.esAdmin ? t('perfil.roleAdmin') : t('perfil.roleCollab'),
  })),
)

const guardando = ref(false)
async function guardar() {
  if (demo) { toast.success(t('perfil.saved')); return }
  guardando.value = true
  const { error } = await useAuth().actualizarPerfil(form)
  guardando.value = false
  if (error) { toast.error(error); return }
  toast.success(t('perfil.saved'))
}

// ── Contraseña ───────────────────────────────────────────────────────────────
const pwd = reactive({ actual: '', nueva: '', confirmar: '' })
const pwdErrores = reactive({ actual: '', nueva: '', confirmar: '' })
const cambiando = ref(false)

async function cambiar() {
  Object.assign(pwdErrores, { actual: '', nueva: '', confirmar: '' })
  if (pwd.nueva.length < 6) { pwdErrores.nueva = t('auth.invite.pwShort'); return }
  if (pwd.nueva !== pwd.confirmar) { pwdErrores.confirmar = t('auth.invite.pwMismatch'); return }
  if (demo) { toast.success(t('perfil.pwChanged')); return }
  cambiando.value = true
  const { error } = await useAuth().cambiarPassword(pwd.actual, pwd.nueva)
  cambiando.value = false
  if (error === 'actual') { pwdErrores.actual = t('perfil.pwWrong'); return }
  if (error) { toast.error(error); return }
  Object.assign(pwd, { actual: '', nueva: '', confirmar: '' })
  toast.success(t('perfil.pwChanged'))
}
</script>
