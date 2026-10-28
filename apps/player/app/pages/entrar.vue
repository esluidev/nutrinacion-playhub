<template>
  <!-- Entrada de la gestión de Player: solo el equipo de Nutrinación (superadmin). La misma entrada
       que Admin y Educators (UiAuthShell, DESIGN.md «Entrada»). -->
  <UiAuthShell label="Player">
    <h1 class="ui-title">Entra con tu correo</h1>
    <p class="ui-text mt-1">Escribe la contraseña de tu cuenta de Admin. Solo para el equipo de Nutrinación.</p>

    <form class="mt-6 space-y-5" novalidate @submit.prevent="enviar">
      <UiInput id="correo" v-model="correo" type="email" autocomplete="email" label="Correo electrónico" />
      <UiInput id="contrasena" v-model="contrasena" type="password" autocomplete="current-password" label="Contraseña" />
      <UiAlert v-if="error" tone="danger">{{ error }}</UiAlert>
      <UiButton type="submit" block :loading="enviando">Entrar</UiButton>
    </form>
  </UiAuthShell>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Entrar · Player' })

const { entrar } = useSesion()
const correo = ref('')
const contrasena = ref('')
const enviando = ref(false)
const error = ref('')

async function enviar() {
  if (!correo.value.trim() || !contrasena.value) {
    error.value = 'Escribe tu correo y tu contraseña.'
    return
  }
  enviando.value = true
  error.value = (await entrar(correo.value, contrasena.value)) ?? ''
  enviando.value = false
  if (!error.value) await navigateTo('/')
}
</script>
