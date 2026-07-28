<template>
  <div>
    <h2 class="text-xl font-display font-semibold text-brand-dark mb-1.5">
      {{ t('auth.login.title') }}
    </h2>
    <p class="text-[13px] text-gray-500 mb-7">{{ t('auth.login.subtitle') }}</p>

    <form class="space-y-[18px]" @submit.prevent="handleLogin">
      <UiInput
        id="email"
        v-model="email"
        type="email"
        :label="t('auth.login.email')"
        placeholder="tu@correo.com"
        required
      />

      <div>
        <div class="flex items-center justify-between mb-[7px]">
          <label for="password" class="text-[13px] font-bold text-gray-700">{{ t('auth.login.password') }}</label>
          <a class="text-xs font-semibold text-brand-primary-700 hover:text-brand-primary-800 cursor-pointer">{{ t('auth.login.forgot') }}</a>
        </div>
        <UiInput
          id="password"
          v-model="password"
          type="password"
          placeholder="••••••••"
          required
        />
      </div>

      <p v-if="error" class="text-sm text-red-500">
        {{ error }}
      </p>

      <UiButton type="submit" size="lg" class="w-full !mt-6" :loading="isLoading">
        {{ t('auth.login.submit') }}
      </UiButton>
    </form>

    <p class="text-center text-[13px] text-gray-500 mt-6 leading-relaxed">
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
