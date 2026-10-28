<template>
  <div>
    <template v-if="estado === 'validando'">
      <div class="flex flex-col items-center gap-4 py-10">
        <UiSpinner />
        <p class="ui-text text-center">
          {{ t('auth.invite.validating') }}
        </p>
      </div>
    </template>

    <!-- Inválida, vencida o revocada: coral (lo que ya no vale) -->
    <template v-else-if="estado === 'invalida'">
      <UiSymbol icon="warning" tone="coral" class="mx-auto mb-4" />
      <h1 class="ui-title mb-2 text-center">
        {{ t('auth.invite.invalidTitle') }}
      </h1>
      <p class="ui-text mb-6 text-center">
        {{ error }}
      </p>
      <div class="flex justify-center">
        <UiButton variant="outline" @click="navigateTo('/login')">{{ t('auth.invite.goLogin') }}</UiButton>
      </div>
    </template>

    <!-- Ya tiene cuenta: no hay nada que crear, la acepta dentro de la app. Información: cielo -->
    <template v-else-if="estado === 'existente'">
      <UiSymbol icon="user" tone="sky" class="mx-auto mb-4" />
      <h1 class="ui-title mb-2 text-center">
        {{ t('auth.invite.hasAccountTitle') }}
      </h1>
      <p class="ui-text mb-6 text-center">
        {{ t('auth.invite.hasAccountText', { email: info?.email ?? '' }) }}
      </p>
      <div class="flex justify-center">
        <UiButton @click="navigateTo('/login')">{{ t('auth.login.submit') }}</UiButton>
      </div>
    </template>

    <template v-else>
      <h1 class="ui-title mb-1.5">
        {{ t('auth.invite.createTitle') }}
      </h1>
      <p class="ui-text mb-6">{{ t('auth.invite.subtitle') }}</p>

      <!-- Banner de invitación: una invitación es novedad, uva -->
      <div data-tone="grape" class="mb-6 flex items-center gap-3 rounded-control border border-(--tone-tint-edge) bg-(--tone-wash) p-3.5">
        <UiSymbol size="md" icon="mail" tone="grape" />
        <p class="text-caption font-semibold leading-snug text-muted">
          {{ t('auth.invite.as') }} <span class="font-extrabold text-ink">{{ roleLabel }}</span>
          {{ t('auth.invite.in') }} <span class="font-extrabold text-ink">{{ info?.organizacion }}</span><template v-if="info?.comunidad"> · {{ info.comunidad }}</template>
        </p>
      </div>

      <form class="space-y-5" @submit.prevent="handleSubmit">
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

        <UiAlert v-if="error" tone="danger">
          {{ error }}
        </UiAlert>

        <!-- La única acción principal de la vista: lima -->
        <UiButton type="submit" block class="mt-6" :loading="submitting">
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
const roleLabel = computed(() => (info.value?.titular
  ? t('auth.invite.roleTitular')
  : info.value?.role === 'ADMIN' ? t('auth.invite.roleAdmin') : t('auth.invite.roleCollab')))

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
  // A quién se invitó: se puede corregir antes de crear la cuenta.
  form.value.nombre = data.nombre ?? ''
  form.value.apellido = data.apellido ?? ''

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
