<template>
  <!-- Entrada de la gestión de Player: solo el equipo de Nutrinación (superadmin). -->
  <div class="flex min-h-screen items-center justify-center bg-canvas p-6">
    <div class="w-full max-w-[420px]">
      <div class="mb-9 text-center">
        <div class="mb-5 flex justify-center">
          <UiLogo :show-text="false" size="lg" />
        </div>
        <h1 class="ui-heading">PlayHub Player</h1>
        <p class="ui-text mt-2">Construir, probar y publicar el contenido.</p>
      </div>

      <div class="ui-panel p-9">
        <form class="space-y-5" @submit.prevent="enviar">
          <UiInput id="correo" v-model="correo" type="email" label="Correo" placeholder="tu@correo.com" required />
          <UiInput id="contrasena" v-model="contrasena" type="password" label="Contraseña" placeholder="••••••••" required />
          <UiAlert v-if="error" tone="danger">{{ error }}</UiAlert>
          <UiButton type="submit" size="lg" block class="mt-6" :loading="enviando">Entrar</UiButton>
        </form>
        <p class="ui-text mt-6 text-center">Solo para el equipo de Nutrinación. Usa tu cuenta de Admin.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Entrar · PlayHub Player' })

const { entrar } = useSesion()
const correo = ref('')
const contrasena = ref('')
const enviando = ref(false)
const error = ref('')

async function enviar() {
  enviando.value = true
  error.value = (await entrar(correo.value, contrasena.value)) ?? ''
  enviando.value = false
  if (!error.value) await navigateTo('/')
}
</script>
