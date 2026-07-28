<template>
  <div>
    <template v-if="estado === 'validando'">
      <p class="text-sm text-gray-500 text-center py-10">
        {{ t('auth.invite.validating') }}
      </p>
    </template>

    <template v-else-if="estado === 'invalida'">
      <div class="flex justify-center mb-4">
        <div class="w-12 h-12 rounded-[14px] bg-amber-50 text-amber-600 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
        </div>
      </div>
      <h2 class="text-xl font-display font-semibold text-brand-dark text-center mb-2">
        {{ t('auth.invite.invalidTitle') }}
      </h2>
      <p class="text-sm text-gray-500 text-center mb-6 leading-relaxed">
        {{ error }}
      </p>
      <div class="flex justify-center">
        <UiButton variant="outline" @click="navigateTo('/login')">{{ t('auth.invite.goLogin') }}</UiButton>
      </div>
    </template>

    <!-- Ya tiene cuenta: no hay nada que crear, la acepta dentro de la app -->
    <template v-else-if="estado === 'existente'">
      <div class="flex justify-center mb-4">
        <div class="w-12 h-12 rounded-[14px] bg-blue-50 text-blue-600 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
        </div>
      </div>
      <h2 class="text-xl font-display font-semibold text-brand-dark text-center mb-2">
        {{ t('auth.invite.hasAccountTitle') }}
      </h2>
      <p class="text-sm text-gray-500 text-center mb-6 leading-relaxed">
        {{ t('auth.invite.hasAccountText', { email: info?.email ?? '' }) }}
      </p>
      <div class="flex justify-center">
        <UiButton @click="navigateTo('/login')">{{ t('auth.login.submit') }}</UiButton>
      </div>
    </template>

    <template v-else>
      <h2 class="text-xl font-display font-semibold text-brand-dark mb-1.5">
        {{ t('auth.invite.createTitle') }}
      </h2>
      <p class="text-[13px] text-gray-500 mb-6">{{ t('auth.invite.subtitle') }}</p>

      <!-- Banner de invitación -->
      <div class="flex items-center gap-3 p-3.5 rounded-[13px] bg-brand-primary-50 border border-brand-primary-100 mb-6">
        <div class="w-9 h-9 rounded-[10px] bg-white text-brand-primary-800 flex items-center justify-center shrink-0 font-extrabold text-sm">N</div>
        <p class="text-[12.5px] text-gray-700 font-semibold leading-snug">
          {{ t('auth.invite.as') }} <span class="font-extrabold text-gray-800">{{ roleLabel }}</span>
          {{ t('auth.invite.in') }} <span class="font-extrabold text-gray-800">{{ info?.organizacion }}</span><template v-if="info?.comunidad"> · {{ info.comunidad }}</template>
        </p>
      </div>

      <form class="space-y-[18px]" @submit.prevent="handleSubmit">
        <div class="grid grid-cols-2 gap-3">
          <UiInput id="nombre" v-model="form.nombre" :label="t('auth.invite.firstName')" placeholder="María" required />
          <UiInput id="apellido" v-model="form.apellido" :label="t('auth.invite.lastName')" placeholder="López" />
        </div>

        <UiInput
          id="email"
          v-model="form.email"
          type="email"
          :label="t('auth.login.email')"
          placeholder="tu@correo.com"
          :disabled="emailLocked"
          required
        />

        <UiInput
          id="password"
          v-model="form.password"
          type="password"
          :label="t('auth.invite.password')"
          placeholder="Mínimo 6 caracteres"
          required
        />

        <UiInput
          id="confirm"
          v-model="form.confirm"
          type="password"
          :label="t('auth.invite.confirm')"
          placeholder="••••••••"
          required
        />

        <p v-if="error" class="text-sm text-red-500">
          {{ error }}
        </p>

        <UiButton type="submit" size="lg" class="w-full !mt-6" :loading="submitting">
          {{ t('auth.invite.submit') }}
        </UiButton>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { InvitacionInfo } from '~/utils/types'

definePageMeta({ layout: 'auth' })

const { t } = useT()
const route = useRoute()
const token = computed(() => String(route.params.token || ''))

const { validateInvitation, redeemInvitation } = useAuth()

const estado = ref<'validando' | 'invalida' | 'existente' | 'ok'>('validando')
const info = ref<InvitacionInfo | null>(null)
const error = ref('')
const submitting = ref(false)

const form = ref({ nombre: '', apellido: '', email: '', password: '', confirm: '' })
const emailLocked = computed(() => !!info.value?.email)
const roleLabel = computed(() => (info.value?.role === 'ADMIN' ? t('auth.invite.roleAdmin') : t('auth.invite.roleCollab')))

onMounted(async () => {
  if (!isSupabaseConfigured()) {
    estado.value = 'invalida'
    error.value = t('auth.invite.notConfigured')
    return
  }

  const { info: data, error: err } = await validateInvitation(token.value)
  if (err || !data) {
    estado.value = 'invalida'
    error.value = err || t('auth.invite.invalid')
    return
  }

  info.value = data
  if (data.email) form.value.email = data.email

  // Si ese correo ya tiene cuenta, este no es el camino: se acepta desde /invitaciones.
  estado.value = data.cuentaExiste ? 'existente' : 'ok'
})

async function handleSubmit() {
  error.value = ''

  if (form.value.password !== form.value.confirm) {
    error.value = t('auth.invite.pwMismatch')
    return
  }
  if (form.value.password.length < 6) {
    error.value = t('auth.invite.pwShort')
    return
  }

  submitting.value = true
  const { error: err } = await redeemInvitation({
    token: token.value,
    email: form.value.email,
    password: form.value.password,
    nombre: form.value.nombre,
    apellido: form.value.apellido,
  })
  submitting.value = false

  if (err) {
    error.value = err
    return
  }

  navigateTo('/dashboard')
}
</script>
