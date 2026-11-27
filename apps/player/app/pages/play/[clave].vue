<template>
  <RunnerFrame
    v-if="storyboard"
    ref="marco"
    :storyboard="storyboard"
    :mode="rehearsal ? 'educator' : mode"
    :locale="locale"
    :start="start"
    :guide="host.guide.value"
    :embedded="host.embedded"
    :conexion="conexion"
    :rehearsal="rehearsal"
    :perfil="perfil"
    :avatar="avatar"
    :nombre="host.nombre.value"
    :instalada="host.instalada.value"
    @ready="host.send({ tipo: 'listo', storyboard: clave, modo: mode, idioma: locale, escenas: storyboard.scenes.length })"
    @scene="(indice, carpeta) => host.send({ tipo: 'escena', indice, carpeta })"
    @finish="host.send({ tipo: 'terminado' })"
    @exit="(indice, carpeta) => host.send({ tipo: 'salir', indice, carpeta })"
  />
  <div v-else class="grid min-h-screen place-items-center p-6">
    <UiEmptyState icon="warning" :title="txt('notFoundTitle')" :text="txt('notFound')" />
  </div>
</template>

<script setup lang="ts">
import '~/runner/runner.css'
import type { RunnerMode } from '@playhub/ui/app/utils/runner-contract'
import { esAvatar } from '@playhub/ui/app/utils/avatares'
import nunito from '@playhub/ui/fonts/nunito-latin.woff2?url'
import { loadStoryboard, storyboardPorClave } from '~/runner/content'
import { codigoValido, normalizarCodigo } from '~/runner/conexion/participante'
import { useRunnerText } from '~/runner/i18n'
import RunnerFrame from '~/runner/RunnerFrame.vue'
import { useRunnerHost } from '~/runner/useHost'
import { origenesPermitidos, urlsDelRunner } from '~/runner/urlsDeLasApps'

// Runner público (`/play/<clave>`; Player no tiene sesión). El contrato está en docs/runner.md. El storyboard va por su
// clave (`key` de su storyboard.json, la misma en la base), nunca por su carpeta: no cambia si se renombra o se mueve.
//   ?mode=educator|device|home|preview|rehearsal  fija el marco (un modo desconocido vuelve a educator).
//                               preview: solo el escenario; la app que lo incrusta conduce.
//                               rehearsal: el ensayo del educador (Educators, «Ensayar»): la consola del educador sin
//                               dispositivos ni conexión, y sin recordar la escena del taller de verdad.
//   ?lang=es                    idioma del contenido, entre los que declara el storyboard.
//   ?escena=<carpeta>           escena con la que abre.
//   ?perfil=…&avatar=…          en casa, desde la app del hogar: el perfil (para recordar dónde iba) y su avatar.
//   ?conexion=<código>          en un dispositivo, la conexión del taller a la que se unió (/workshop/join, tarea 013).
//   ?medir=1                    el medidor del motor, para probar en un dispositivo (cuadros y toque).
//   ?sonidos=1                  el panel de sonidos: oír cada uno suelto y ver cuál sonó.
// Dentro de un iframe de una app permitida (Admin o Educators, con su dirección en la base), la app le da la guía y
// el runner le cuenta la escena, si terminó o si salió; abierto directamente, va solo y sin guía.
definePageMeta({ layout: false })

const route = useRoute()
const MODES: RunnerMode[] = ['educator', 'device', 'home', 'preview', 'rehearsal']
const requestedMode = String(route.query.mode ?? '')
const mode: RunnerMode = MODES.includes(requestedMode as RunnerMode) ? requestedMode as RunnerMode : 'educator'
if (requestedMode && requestedMode !== mode) console.warn(`Modo «${requestedMode}» no existe; se usa «${mode}».`)

const clave = String(route.params.clave)
const entrada = storyboardPorClave(clave)
const category = entrada?.folderCategory ?? ''
const id = entrada?.json.slug ?? ''
const peek = entrada ? loadStoryboard(category, id) : null
const languages = peek?.json.languages?.length ? peek.json.languages : [peek?.json.defaultLanguage ?? 'es']
const requestedLang = String(route.query.lang ?? '')
const locale = languages.includes(requestedLang) ? requestedLang : (peek?.json.defaultLanguage ?? languages[0] ?? 'es')
const storyboard = entrada ? loadStoryboard(category, id, locale) : null
const txt = useRunnerText(() => locale)
const start = route.query.escena ? String(route.query.escena) : undefined
const rehearsal = mode === 'rehearsal'
// En casa, desde la app del hogar (tarea 025): con qué perfil se juega y su avatar. El nombre llega con `iniciar`.
const perfil = mode === 'home' && /^[\w-]{1,40}$/.test(String(route.query.perfil ?? '')) ? String(route.query.perfil) : undefined
const avatar = mode === 'home' && esAvatar(route.query.avatar) ? route.query.avatar : undefined

// Los orígenes permitidos: Admin y Educators con su dirección en la base (`configuraciones`) y, si este equipo se abrió
// por Tailscale, los mismos con su nombre (equipo-local). Solo hacen falta dentro de un iframe.
const origenes = shallowRef<string[] | null>(null)
if (import.meta.client && window.parent !== window) {
  void urlsDelRunner().then((urls) => { origenes.value = origenesPermitidos(urls) })
}
// En la vista previa, la app conduce: a qué escena ir y cuándo reiniciar la actual.
const marco = ref<InstanceType<typeof RunnerFrame> | null>(null)
const host = useRunnerHost(
  origenes,
  mode === 'preview' ? { ir: escena => marco.value?.ir(escena), reiniciar: () => marco.value?.reiniciar() } : undefined,
)

// La conexión del taller (tarea 013): en un dispositivo, el código con que se unió; en la pantalla del educador, la
// que le da la app (código y llave). Sin ella, la sesión es la de demostración.
const codigoDispositivo = mode === 'device' ? normalizarCodigo(String(route.query.conexion ?? '')) : ''
const conexion = computed(() => (codigoValido(codigoDispositivo) ? { codigo: codigoDispositivo } : mode === 'educator' ? host.conexion.value : null))

// El medidor y el panel de sonidos del motor (`engine/meter.ts`) solo se descargan si se piden.
const stopTools: (() => void)[] = []
onMounted(async () => {
  if (!route.query.medir && !route.query.sonidos) return
  const { startMeter, startSoundboard } = await import('~/runner/engine/meter')
  if (route.query.medir) stopTools.push(startMeter())
  if (route.query.sonidos) stopTools.push(startSoundboard())
})
onBeforeUnmount(() => stopTools.forEach(stop => stop()))

// «listo» lo manda el marco cuando lo primero que se ve ya está completo en pantalla (`ready`), siempre antes que la
// primera escena: así la app quita su carga justo cuando hay algo entero que mostrar. Si el storyboard no existe, el
// error sale enseguida.
onBeforeMount(() => {
  if (!storyboard) host.send({ tipo: 'error', codigo: 'no-encontrado' })
})

// El player es una superficie de juego, no un documento: sin zoom de dedos, a pantalla
// completa del área segura y en densidad táctil.
useHead({
  htmlAttrs: { 'lang': locale, 'data-density': 'touch' },
  bodyAttrs: { class: 'player-page' },
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' }],
  // La letra se pide desde el principio, sin esperar a que el CSS la descubra: el marco no aparece hasta tenerla.
  link: [{ rel: 'preload', as: 'font', type: 'font/woff2', href: nunito, crossorigin: 'anonymous' }],
})
</script>
