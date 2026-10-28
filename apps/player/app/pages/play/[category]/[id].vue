<template>
  <RunnerFrame
    v-if="storyboard"
    :storyboard="storyboard"
    :mode="mode"
    :locale="locale"
    :start="start"
    :guide="host.guide.value"
    :embedded="host.embedded"
    @scene="(indice, carpeta) => host.send({ tipo: 'escena', indice, carpeta })"
    @finish="host.send({ tipo: 'terminado' })"
    @exit="(indice, carpeta) => host.send({ tipo: 'salir', indice, carpeta })"
  />
  <div v-else class="grid min-h-screen place-items-center p-6">
    <UiEmptyState icon="warning" :title="'Taller no encontrado'" :text="'Este storyboard no existe en este build.'" />
  </div>
</template>

<script setup lang="ts">
import '~/runner/runner.css'
import { runnerOrigins } from '@playhub/ui/app/utils/runner-contract'
import { urlEnEsteEquipo } from '@playhub/ui/app/utils/equipo-local'
import type { RunnerMode } from '@playhub/ui/app/utils/runner-contract'
import { loadStoryboard } from '~/runner/content'
import RunnerFrame from '~/runner/RunnerFrame.vue'
import { useRunnerHost } from '~/runner/useHost'

// Runner público (`/play/**`; Player no tiene sesión). El contrato está en docs/runner.md.
//   ?mode=educator|device|home  fija el marco (un modo desconocido vuelve a educator).
//   ?lang=es                    idioma del contenido, entre los que declara el storyboard.
//   ?escena=<carpeta>           escena con la que abre.
// Dentro de un iframe de una app permitida (NUXT_PUBLIC_RUNNER_HOSTS), la app le da la guía y
// el runner le cuenta la escena, si terminó o si salió; abierto directamente, va solo y sin guía.
definePageMeta({ layout: false })

const route = useRoute()
const MODES: RunnerMode[] = ['educator', 'device', 'home']
const requestedMode = String(route.query.mode ?? '')
const mode: RunnerMode = MODES.includes(requestedMode as RunnerMode) ? requestedMode as RunnerMode : 'educator'
if (requestedMode && requestedMode !== mode) console.warn(`Modo «${requestedMode}» no existe; se usa «${mode}».`)

const category = String(route.params.category)
const id = String(route.params.id)
const peek = loadStoryboard(category, id)
const languages = peek?.json.languages?.length ? peek.json.languages : [peek?.json.defaultLanguage ?? 'es']
const requestedLang = String(route.query.lang ?? '')
const locale = languages.includes(requestedLang) ? requestedLang : (peek?.json.defaultLanguage ?? languages[0] ?? 'es')
const storyboard = loadStoryboard(category, id, locale)
const start = route.query.escena ? String(route.query.escena) : undefined

// Los orígenes permitidos y, si este equipo se abrió por Tailscale, los mismos con su nombre:
// en desarrollo Admin y Educators corren en el mismo equipo (equipo-local).
const origenes = runnerOrigins(useRuntimeConfig().public.runnerHosts as string)
const host = useRunnerHost([...new Set([...origenes, ...origenes.map(o => urlEnEsteEquipo(o))])])

// «listo» antes de montar el marco: así la app lo recibe antes que la primera escena.
onBeforeMount(() => host.send(storyboard
  ? { tipo: 'listo', storyboard: `${category}/${id}`, modo: mode, idioma: locale, escenas: storyboard.scenes.length }
  : { tipo: 'error', codigo: 'no-encontrado' }))

// El player es una superficie de juego, no un documento: sin zoom de dedos, a pantalla
// completa del área segura y en densidad táctil.
useHead({
  htmlAttrs: { 'lang': locale, 'data-density': 'touch' },
  bodyAttrs: { class: 'player-page' },
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' }],
})
</script>
