<template>
  <!-- ¿La olvidaste?: Admin no envía correos (decisión 009). El enlace para elegir otra lo genera
       el titular de su organización o soporte. -->
  <div v-if="recuperando">
    <h1 class="ui-title">{{ t('auth.forgot.title') }}</h1>
    <p class="ui-text mt-1">{{ t('auth.forgot.subtitle') }}</p>
    <UiAlert tone="info" class="mt-6">{{ t('auth.forgot.ask') }}</UiAlert>
    <UiButton variant="ghost" block class="mt-5" @click="recuperando = false">{{ t('auth.forgot.back') }}</UiButton>
  </div>

  <!-- La misma entrada que Player y Educators (UiAuthShell, DESIGN.md «Entrada») -->
  <div v-else>
    <h1 class="ui-title">{{ t('auth.login.title') }}</h1>
    <p class="ui-text mt-1">{{ t('auth.login.subtitle') }}</p>

    <form class="mt-6 space-y-5" novalidate @submit.prevent="handleLogin">
      <UiInput id="email" v-model="email" type="email" autocomplete="email" :label="t('auth.login.email')" />

      <div>
        <div class="mb-2 flex items-center justify-between">
          <label for="password" class="text-caption font-extrabold text-ink">{{ t('auth.login.password') }}</label>
          <!-- Enlace: cielo -->
          <button type="button" data-tone="sky" class="ui-link text-caption" @click="recuperando = true; error = ''">{{ t('auth.login.forgot') }}</button>
        </div>
        <UiInput id="password" v-model="password" type="password" autocomplete="current-password" />
      </div>

      <UiAlert v-if="error" tone="danger">{{ error }}</UiAlert>

      <!-- La única acción principal de la vista: lima -->
      <UiButton type="submit" block :loading="isLoading">{{ t('auth.login.submit') }}</UiButton>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { t } = useT()
useHead({ title: computed(() => `${t('auth.login.submit')} · Admin`) })
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref('')
const recuperando = ref(false)

async function handleLogin() {
  error.value = ''
  if (!isSupabaseConfigured()) {
    navigateTo('/dashboard')
    return
  }
  if (!email.value.trim() || !password.value) {
    error.value = t('auth.login.missing')
    return
  }

  isLoading.value = true
  const { error: authError } = await useAuth().signIn(email.value.trim(), password.value)
  isLoading.value = false

  if (authError) {
    error.value = authError.code === 'invalid_credentials' ? t('auth.login.invalid') : authError.message
    return
  }
  // El aterrizaje lo decide la superficie de acceso (admin → su organización,
  // colaborador → su comunidad, etc.), no una ruta fija.
  navigateTo(useContexto().rutaInicial())
}
</script>
