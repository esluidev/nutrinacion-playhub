<template>
  <!-- Unirse a un taller escribiendo el código (tarea 013): para quien no puede leer el QR. Sin
       cuenta ni nada que instalar. Con un código válido, sigue en /workshop/join/<código>. -->
  <main class="unirse" data-density="touch">
    <form class="ui-panel ui-panel-body unirse-caja space-y-6" novalidate @submit.prevent="buscar">
      <header>
        <UiLogo class="mb-6" />
        <h1 class="ui-heading">{{ txt('joinTitle') }}</h1>
      </header>
      <UiInput
        id="codigo"
        v-model="escrito"
        :label="txt('joinCodeLabel')"
        :error="error"
        size="lg"
        placeholder="K7M-2QX"
        autocomplete="off"
        class="unirse-codigo"
      />
      <UiButton type="submit" size="lg" block>{{ txt('joinSearch') }}</UiButton>
    </form>
  </main>
</template>

<script setup lang="ts">
import { codigoAlEscribir, codigoValido, normalizarCodigo } from '~/runner/conexion/participante'
import { useRunnerText } from '~/runner/i18n'

definePageMeta({ layout: false })

// Antes de saber el taller no se sabe su idioma: el del navegador, si lo hay.
const idioma = import.meta.client && navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'es'
const txt = useRunnerText(() => idioma)
const texto = ref('')
const error = ref('')
// Mientras se escribe: mayúsculas y el guion en su sitio («K7M-2QX»), como se ve en la pantalla del educador.
const escrito = computed({
  get: () => texto.value,
  set: (v: string) => { texto.value = codigoAlEscribir(v) },
})

function buscar() {
  const codigo = normalizarCodigo(texto.value)
  if (!codigoValido(codigo)) {
    error.value = txt('joinBadCode')
    return
  }
  navigateTo(`/workshop/join/${codigo}`)
}

useHead({ title: computed(() => `${txt('joinTitle')} · PlayHub`) })
</script>

<style scoped>
.unirse { min-height: 100dvh; display: grid; place-items: center; padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom)); background: var(--color-canvas); }
.unirse-caja { width: 100%; max-width: 440px; }
.unirse-codigo :deep(input) { text-transform: uppercase; letter-spacing: .12em; font-weight: 900; text-align: center; }
</style>
