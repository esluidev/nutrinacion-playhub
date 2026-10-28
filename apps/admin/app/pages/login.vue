<template>
  <!-- ¿La olvidaste?: Admin no envía correos (decisión 009). El enlace para elegir otra lo genera
       el titular de su organización o soporte. -->
  <div v-if="recuperando">
    <h2 class="ui-title mb-1.5">{{ t('auth.forgot.title') }}</h2>
    <p class="ui-text mb-7">{{ t('auth.forgot.subtitle') }}</p>

    <UiAlert tone="info">{{ t('auth.forgot.ask') }}</UiAlert>

    <p class="ui-text mt-6 text-center">
      <button type="button" data-tone="sky" class="ui-link" @click="recuperando = false">{{ t('auth.forgot.back') }}</button>
    </p>
  </div>

  <div v-else>
    <h2 class="ui-title mb-1.5">
      {{ t('auth.login.title') }}
    </h2>
    <p class="ui-text mb-7">{{ t('auth.login.subtitle') }}</p>

    <form class="space-y-5" @submit.prevent="handleLogin">
      <UiInput
        id="email"
        v-model="email"
        type="email"
        :label="t('auth.login.email')"
        placeholder="tu@correo.com"
        required
      />

      <div>
        <div class="mb-2 flex items-center justify-between">
          <label for="password" class="text-caption font-extrabold text-ink">{{ t('auth.login.password') }}</label>
          <!-- Enlace: cielo -->
          <button type="button" data-tone="sky" class="ui-link text-caption" @click="recuperando = true; error = ''">{{ t('auth.login.forgot') }}</button>
        </div>
        <UiInput
          id="password"
          v-model="password"
          type="password"
          placeholder="••••••••"
          required
        />
      </div>

      <UiAlert v-if="error" tone="danger">
        {{ error }}
      </UiAlert>

      <!-- La única acción principal de la vista: lima -->
      <UiButton type="submit" size="lg" block class="mt-6" :loading="isLoading">
        {{ t('auth.login.submit') }}
      </UiButton>
    </form>

    <p class="ui-text mt-6 text-center">
      {{ t('auth.login.inviteOnly') }}
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { t } = useT()
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref('')
const recuperando = ref(false)

async function handleLogin() {
  isLoading.value = true
  error.value = ''

  if (!isSupabaseConfigured()) {
    navigateTo('/dashboard')
    return
  }

  const { signIn } = useAuth()
  const { error: authError } = await signIn(email.value, password.value)

  if (authError) {
    error.value = authError.message
  }
  else {
    // El aterrizaje lo decide la superficie de acceso (admin → su organización,
    // colaborador → su comunidad, etc.), no una ruta fija.
    navigateTo(useContexto().rutaInicial())
  }

  isLoading.value = false
}
</script>
