<template>
  <div>
    <h2 class="ui-title mb-1.5">{{ t('auth.reset.title') }}</h2>
    <p class="ui-text mb-7">{{ t('auth.reset.subtitle') }}</p>

    <p v-if="comprobando" class="ui-text">{{ t('common.loading') }}</p>

    <template v-else-if="!conSesion">
      <UiAlert tone="danger">{{ t('auth.reset.expired') }}</UiAlert>
      <UiButton variant="outline" block class="mt-6" @click="navigateTo('/login')">{{ t('auth.forgot.back') }}</UiButton>
    </template>

    <form v-else class="space-y-5" @submit.prevent="guardar">
      <UiInput v-model="nueva" type="password" autocomplete="new-password" :label="t('perfil.pwNew')" :placeholder="t('perfil.pwMin')" required />
      <UiInput v-model="confirmar" type="password" autocomplete="new-password" :label="t('perfil.pwConfirm')" required />
      <UiAlert v-if="error" tone="danger">{{ error }}</UiAlert>
      <UiButton type="submit" size="lg" block :loading="guardando">{{ t('auth.reset.submit') }}</UiButton>
    </form>
  </div>
</template>

<script setup lang="ts">
// Llega desde el enlace de recuperación (Supabase Auth): el cliente toma la sesión de la URL y
// con ella se fija la nueva contraseña. Sin sesión, el enlace venció o ya se usó.
definePageMeta({ layout: 'auth' })

const { t } = useT()
const { toast } = useToast()

const comprobando = ref(true)
const conSesion = ref(false)
const nueva = ref('')
const confirmar = ref('')
const error = ref('')
const guardando = ref(false)

onMounted(async () => {
  if (!isSupabaseConfigured()) {
    conSesion.value = true
    comprobando.value = false
    return
  }
  const { data } = await useSupabaseClient().auth.getSession()
  conSesion.value = !!data.session
  comprobando.value = false
})

async function guardar() {
  error.value = ''
  if (nueva.value.length < 6) { error.value = t('auth.invite.pwShort'); return }
  if (nueva.value !== confirmar.value) { error.value = t('auth.invite.pwMismatch'); return }
  if (!isSupabaseConfigured()) { navigateTo('/login'); return }
  guardando.value = true
  const { error: e } = await useAuth().restablecerPassword(nueva.value)
  if (e) {
    guardando.value = false
    error.value = e
    return
  }
  await useAuth().fetchUser()
  guardando.value = false
  toast.success(t('auth.reset.done'))
  navigateTo(useContexto().rutaInicial())
}
</script>
