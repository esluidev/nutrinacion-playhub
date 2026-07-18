<template>
  <div>
    <h2 class="text-xl font-display font-bold text-brand-dark mb-6 text-center">
      Iniciar Sesion
    </h2>

    <form class="space-y-4" @submit.prevent="handleLogin">
      <UiInput
        id="email"
        v-model="form.email"
        label="Correo electronico"
        type="email"
        placeholder="admin@nutrinacion.com"
        required
        :error="errors.email"
      />

      <UiInput
        id="password"
        v-model="form.password"
        label="Contrasena"
        type="password"
        placeholder="••••••••"
        required
        :error="errors.password"
      />

      <div v-if="loginError" class="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {{ loginError }}
      </div>

      <UiButton
        type="submit"
        variant="primary"
        size="lg"
        :loading="loading"
        class="w-full mt-2"
      >
        Entrar
      </UiButton>
    </form>

    <!-- Demo hint -->
    <div class="mt-6 rounded-lg bg-brand-purple-50 border border-brand-purple-200 px-4 py-3">
      <p class="text-xs text-brand-purple-700 font-semibold mb-1">Credenciales de demo</p>
      <p class="text-xs text-brand-purple-600 font-mono">admin@nutrinacion.com / studio</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { signIn, user } = useAuth()

// Redirect if already authenticated
watchEffect(() => {
  if (user.value) navigateTo('/')
})

const form = reactive({
  email: '',
  password: '',
})

const errors = reactive({
  email: '',
  password: '',
})

const loginError = ref('')
const loading = ref(false)

async function handleLogin() {
  errors.email = ''
  errors.password = ''
  loginError.value = ''

  if (!form.email) {
    errors.email = 'El correo es requerido'
    return
  }
  if (!form.password) {
    errors.password = 'La contrasena es requerida'
    return
  }

  loading.value = true
  const { error } = await signIn(form.email, form.password)
  loading.value = false

  if (error) {
    loginError.value = error
  }
  else {
    await navigateTo('/')
  }
}
</script>
