<template>
  <!-- Jugar: el runner de Player a pantalla completa, en modo casa (la narración suena sola), con el perfil que juega
       (su avatar y su nombre, y dónde iba) y en el idioma de la app si el storyboard lo tiene. Instalada, sin pantalla
       completa: no aporta (Luis, 2026-11-27). Anota en qué escena va («Sigue jugando» en el inicio) y, al terminar,
       queda marcado como terminado para ese perfil. -->
  <div class="juego-runner">
    <UiRunner
      v-if="src"
      :src="src"
      :nombre="actual?.nombre"
      :instalada="instalada"
      :title="titulo"
      @ready="(e) => (escenas = e.escenas)"
      @scene="(e) => escenas && anotarAvance(clave, e.indice, escenas)"
      @finish="terminar"
      @exit="volver"
    >
      <template #failed>
        <UiButton variant="outline" icon="home" @click="volver">{{ t('jugar.volver') }}</UiButton>
      </template>
    </UiRunner>
    <div v-else class="grid h-full place-items-center"><UiSpinner /></div>
  </div>
</template>

<script setup lang="ts">
import { runnerUrl } from '@playhub/ui/app/utils/runner-contract'
import { idiomaDeJuego, textoEn } from '~/utils/catalogo'

definePageMeta({ layout: false })

const { t, locale } = useT()
const { actual, anotarAvance, marcarTerminado } = useHogar()
// Cuántas escenas tiene (lo dice el runner con `listo`): con cada `escena`, en cuál va, para «Sigue jugando».
const escenas = ref(0)
const { catalogo } = useCatalogo()
const player = useUrlDePlayer()
const route = useRoute()
const clave = String(route.params.clave)

const storyboard = computed(() => catalogo.value.storyboards.find(s => s.clave === clave) ?? null)
const titulo = computed(() => (storyboard.value ? textoEn(storyboard.value.titulo, locale.value) : ''))
const src = computed(() => {
  if (!player.value || !actual.value) return null
  const idioma = storyboard.value ? idiomaDeJuego(storyboard.value, locale.value) : locale.value
  return runnerUrl(player.value, { clave, modo: 'home', idioma, perfil: actual.value.id, avatar: actual.value.avatar })
})
// Abierta como app instalada (sin las barras del navegador).
const instalada = import.meta.client && ['standalone', 'fullscreen', 'minimal-ui'].some(m => window.matchMedia(`(display-mode: ${m})`).matches)
useHead({ title: titulo })

function terminar() {
  marcarTerminado(clave)
  volver()
}
function volver() {
  navigateTo('/inicio', { replace: true })
}
</script>
