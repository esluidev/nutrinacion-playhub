<template>
  <!-- Entrar con correo y PIN. El PIN se elige con el enlace de acceso que manda la organización
       (0013, /acceso/<token>): la primera vez o cuando se olvida. -->
  <div>
    <h1 class="ui-title">{{ t('entrar.titulo') }}</h1>
    <p class="ui-text mt-1">{{ t('entrar.texto') }}</p>
    <form class="mt-6 space-y-5" novalidate @submit.prevent="enviar">
      <UiInput
        v-model="correo"
        :label="t('entrar.correo')"
        type="email"
        inputmode="email"
        autocomplete="email"
        :error="error === 'correo' ? t('entrar.errorCorreo') : undefined"
      />
      <UiInput
        v-model="pin"
        :label="t('entrar.pin')"
        type="password"
        inputmode="numeric"
        autocomplete="current-password"
        :error="error === 'pin' ? t('entrar.errorPin') : undefined"
      />
      <UiAlert v-if="aviso" :tone="aviso.tono">{{ aviso.texto }}</UiAlert>
      <UiButton type="submit" block :loading="cargando">{{ t('entrar.boton') }}</UiButton>
    </form>
    <p class="ui-caption mt-6">{{ t('entrar.sinPin') }}</p>
    <UiAlert v-if="demo" tone="info" class="mt-6">{{ t('entrar.prueba') }}</UiAlert>
  </div>
</template>

<script setup lang="ts">
import type { ResultadoEntrada } from '~/composables/useSesion'

definePageMeta({ layout: 'entrar' })

const { t } = useT()
const { demo, entrar } = useSesion()
const correo = ref('')
const pin = ref('')
const error = ref<ResultadoEntrada | null>(null)
const cargando = ref(false)

// Lo que no es de un campo va en un aviso: credenciales, bloqueo de 15 minutos o sin conexión.
const aviso = computed(() => {
  switch (error.value) {
    case 'credenciales': return { tono: 'danger' as const, texto: t('entrar.errorCredenciales') }
    case 'bloqueado': return { tono: 'warning' as const, texto: t('entrar.errorBloqueado') }
    case 'red': return { tono: 'warning' as const, texto: t('entrar.errorRed') }
    default: return null
  }
})

async function enviar() {
  cargando.value = true
  const resultado = await entrar(correo.value, pin.value)
  cargando.value = false
  if (resultado === 'dentro') return navigateTo('/')
  if (resultado !== 'correo' && resultado !== 'red') pin.value = ''
  error.value = resultado
}

useHead({ title: computed(() => t('entrar.boton')) })
</script>
