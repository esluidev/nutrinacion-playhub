<template>
  <div>
    <template v-if="estado === 'validando'">
      <p class="text-sm text-gray-500 text-center py-10">
        {{ t('auth.invite.validating') }}
      </p>
    </template>

    <template v-else-if="estado === 'invalida'">
      <h2 class="text-xl font-display font-bold text-gray-900 mb-2">
        {{ t('auth.invite.invalidTitle') }}
      </h2>
      <p class="text-sm text-gray-500 mb-6">
        {{ error }}
      </p>
      <NuxtLink to="/login" class="text-brand-primary-600 hover:underline font-semibold text-sm">
        {{ t('auth.invite.goLogin') }}
      </NuxtLink>
    </template>

    <!-- Ya tiene cuenta: no hay nada que crear, la acepta dentro de la app -->
    <template v-else-if="estado === 'existente'">
      <h2 class="text-xl font-display font-bold text-gray-900 mb-2">
        {{ t('auth.invite.hasAccountTitle') }}
      </h2>
      <p class="text-sm text-gray-500 mb-6">
        {{ t('auth.invite.hasAccountText', { email: info?.email ?? '' }) }}
      </p>
      <NuxtLink to="/login" class="text-brand-primary-600 hover:underline font-semibold text-sm">
        {{ t('auth.invite.goLogin') }}
      </NuxtLink>
    </template>

    <template v-else>
      <h2 class="text-xl font-display font-bold text-gray-900 mb-1">
        {{ t('auth.invite.createTitle') }}
      </h2>
      <p class="text-sm text-gray-500 mb-6">
        {{ t('auth.invite.as') }} <span class="font-semibold text-gray-700">{{ roleLabel }}</span>
        {{ t('auth.invite.in') }} <span class="font-semibold text-gray-700">{{ info?.organizacion }}</span><template v-if="info?.comunidad"> · {{ info.comunidad }}</template>.
      </p>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div class="grid grid-cols-2 gap-3">
          <UiInput id="nombre" v-model="form.nombre" :label="t('auth.invite.firstName')" placeholder="Maria" required />
          <UiInput id="apellido" v-model="form.apellido" :label="t('auth.invite.lastName')" placeholder="Lopez" />
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
          placeholder="Minimo 6 caracteres"
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

        <UiButton type="submit" class="w-full" :loading="submitting">
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
