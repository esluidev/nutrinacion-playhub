<template>
  <!-- Entrar con correo y PIN. La primera vez (o tras un código nuevo de Admin), los 6 dígitos son
       el código de activación: la base lo reconoce y el educador elige aquí su PIN. -->
  <div v-if="!activacion">
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
        size="lg"
      />
      <UiInput
        v-model="pin"
        :label="t('entrar.pin')"
        type="password"
        inputmode="numeric"
        autocomplete="current-password"
        :hint="t('entrar.pinAyuda')"
        :error="error === 'pin' ? t('entrar.errorPin') : undefined"
        size="lg"
      />
      <UiAlert v-if="aviso" :tone="aviso.tono">{{ aviso.texto }}</UiAlert>
      <UiButton type="submit" size="lg" block :loading="cargando">{{ t('entrar.boton') }}</UiButton>
    </form>
    <UiAlert v-if="demo" tone="info" class="mt-6">{{ t('entrar.prueba') }}</UiAlert>
  </div>

  <div v-else>
    <h1 class="ui-title">{{ t('entrar.elegirTitulo') }}</h1>
    <p class="ui-text mt-1">{{ t('entrar.elegirTexto', { correo: activacion.correo }) }}</p>
    <form class="mt-6 space-y-5" novalidate @submit.prevent="elegirPin">
      <UiInput
        v-model="nuevo"
        :label="t('pin.nuevo')"
        type="password"
        inputmode="numeric"
        autocomplete="new-password"
        :hint="t('pin.ayuda')"
        :error="error === 'pin_invalido' ? t('pin.errorInvalido') : undefined"
        size="lg"
      />
      <UiInput
        v-model="repetido"
        :label="t('pin.repetir')"
        type="password"
        inputmode="numeric"
        autocomplete="new-password"
        :error="error === 'no_coinciden' ? t('pin.errorNoCoinciden') : undefined"
        size="lg"
      />
      <UiAlert v-if="aviso" :tone="aviso.tono">{{ aviso.texto }}</UiAlert>
      <UiButton type="submit" size="lg" block :loading="cargando">{{ t('entrar.elegirBoton') }}</UiButton>
      <UiButton variant="ghost" block @click="volver">{{ t('entrar.otroCorreo') }}</UiButton>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { ResultadoEntrada } from '~/composables/useSesion'

definePageMeta({ layout: 'entrar' })

const { t } = useT()
const { activacion, demo, entrar, activar, cancelarActivacion } = useSesion()
const correo = ref('')
const pin = ref('')
const nuevo = ref('')
const repetido = ref('')
// 'codigo': el código de activación dejó de valer mientras elegía su PIN.
const error = ref<ResultadoEntrada | 'codigo' | null>(null)
const cargando = ref(false)

// Lo que no es de un campo va en un aviso: credenciales, bloqueo de 15 minutos o sin conexión.
const aviso = computed(() => {
  switch (error.value) {
    case 'credenciales': return { tono: 'danger' as const, texto: t('entrar.errorCredenciales') }
    case 'codigo': return { tono: 'danger' as const, texto: t('entrar.errorCodigo') }
    case 'bloqueado': return { tono: 'warning' as const, texto: t('entrar.errorBloqueado') }
    case 'red': return { tono: 'warning' as const, texto: t('entrar.errorRed') }
    default: return null
  }
})

async function seguir(resultado: ResultadoEntrada) {
  if (resultado === 'dentro') return navigateTo('/')
  error.value = resultado === 'definir_pin' ? null : resultado
}

async function enviar() {
  cargando.value = true
  const resultado = await entrar(correo.value, pin.value)
  cargando.value = false
  if (resultado !== 'correo' && resultado !== 'red') pin.value = ''
  await seguir(resultado)
}

async function elegirPin() {
  cargando.value = true
  const resultado = await activar(nuevo.value, repetido.value)
  cargando.value = false
  if (resultado !== 'no_coinciden' && resultado !== 'red') nuevo.value = repetido.value = ''
  await seguir(resultado)
  // Sin código válido, la sesión ya volvió al primer paso: se dice por qué.
  if (resultado === 'credenciales') error.value = 'codigo'
}

function volver() {
  cancelarActivacion()
  error.value = null
  nuevo.value = repetido.value = ''
}

useHead({ title: computed(() => t(activacion.value ? 'entrar.elegirTitulo' : 'entrar.titulo')) })
</script>
