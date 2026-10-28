<template>
  <div>
    <h2 class="ui-title mb-1.5">{{ t('auth.reset.title') }}</h2>
    <p class="ui-text mb-7">{{ t('auth.reset.subtitle') }}</p>

    <template v-if="vencido">
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
// Llega desde el enlace que generó el titular o soporte (decisión 009): `?token_hash=`. El token
// se canjea al guardar, no al abrir la página, para que la vista previa de un chat no lo gaste.
// Sin token, o vencido o ya usado, se pide otro.
definePageMeta({ layout: 'auth' })

const { t } = useT()
const { toast } = useToast()
const route = useRoute()

const tokenHash = computed(() => (typeof route.query.token_hash === 'string' ? route.query.token_hash : ''))
const vencido = ref(isSupabaseConfigured() && !tokenHash.value)
const canjeado = ref(false)
const nueva = ref('')
const confirmar = ref('')
const error = ref('')
const guardando = ref(false)

async function guardar() {
  error.value = ''
  if (nueva.value.length < 6) { error.value = t('auth.invite.pwShort'); return }
  if (nueva.value !== confirmar.value) { error.value = t('auth.invite.pwMismatch'); return }
  if (!isSupabaseConfigured()) { navigateTo('/login'); return }
  guardando.value = true
  // Si el cambio falla después de canjear el token, el reintento usa la sesión ya abierta.
  if (!canjeado.value) {
    const { error: e } = await useAuth().canjearEnlaceRecuperacion(tokenHash.value)
    if (e) {
      guardando.value = false
      vencido.value = true
      return
    }
    canjeado.value = true
  }
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
