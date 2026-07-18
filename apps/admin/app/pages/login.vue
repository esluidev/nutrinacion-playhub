<template>
  <div>
    <h2 class="text-xl font-display font-bold text-gray-900 mb-6">
      {{ t('auth.login.title') }}
    </h2>

    <form class="space-y-4" @submit.prevent="handleLogin">
      <UiInput
        id="email"
        v-model="email"
        type="email"
        :label="t('auth.login.email')"
        placeholder="tu@correo.com"
        required
      />

      <UiInput
        id="password"
        v-model="password"
        type="password"
        :label="t('auth.login.password')"
        placeholder="••••••••"
        required
      />

      <p v-if="error" class="text-sm text-red-500">
        {{ error }}
      </p>

      <UiButton type="submit" class="w-full" :loading="isLoading">
        {{ t('auth.login.submit') }}
      </UiButton>
    </form>

    <p class="text-center text-sm text-gray-400 mt-6 leading-relaxed">
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
    navigateTo('/dashboard')
  }

  isLoading.value = false
}
</script>
