<template>
  <!-- Unirse a un taller escribiendo el código (tarea 025): `play.nutrinacion.com/code`, la dirección que sale bajo el
       QR en la pantalla del educador. No hace falta perfil ni haber configurado nada. Con la barra de arriba y el
       formulario en su card. -->
  <form class="ui-panel ui-panel-body mx-auto w-full max-w-md" novalidate @submit.prevent="buscar">
    <h1 class="ui-title">{{ t('code.titulo') }}</h1>
    <div class="mt-6 space-y-5">
      <UiInput v-model="escrito" :label="t('code.campo')" :error="error" size="lg" placeholder="K7M-2QX" autocomplete="off" class="campo-codigo" />
      <UiButton type="submit" block>{{ t('code.buscar') }}</UiButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { codigoAlEscribir, codigoValido, normalizarCodigo } from '@playhub/ui/app/utils/codigo-taller'

const { t } = useT()
useHead({ title: () => t('code.titulo') })

const texto = ref('')
const error = ref('')
// Mientras se escribe: mayúsculas y el guion en su sitio («K7M-2QX»), como se ve en la pantalla del educador.
const escrito = computed({ get: () => texto.value, set: (v: string) => { texto.value = codigoAlEscribir(v); error.value = '' } })

function buscar() {
  const codigo = normalizarCodigo(texto.value)
  if (!codigoValido(codigo)) {
    error.value = t('code.error')
    return
  }
  navigateTo(`/code/${codigo}`)
}
</script>
