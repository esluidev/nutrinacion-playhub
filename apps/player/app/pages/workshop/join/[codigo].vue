<template>
  <!-- Unirse a un taller (tarea 013): el QR de la pantalla del educador abre esta página con su
       código. Sin cuenta ni nada que instalar: se elige un avatar, se escribe un nombre (opcional; sin
       él, el del avatar; en pantalla siempre «nombre», nunca «apodo») y se solicita el acceso. Se espera a que el educador lo apruebe y, aprobado,
       se abre el taller en modo dispositivo. La pestaña recuerda su avatar, su apodo y su
       identificador para esta conexión: al recargar vuelve como el mismo; en otra pestaña (cerrar y volver a
       escanear) o tras salir del taller, empieza de cero. Si el educador lo rechaza (o lo quita) o el taller
       termina, la sesión se cierra del todo: el dispositivo lo olvida y vuelve a la página inicial, /workshop/join (Luis,
       2026-11-26: nada de una página para volver a entrar).
       Desde el 2026-11-27 la entrada es la app del hogar (`/code/<código>`, tarea 025): abierta directamente, esta página
       lleva ahí. Dentro de la app (incrustada) trae el avatar y el nombre del perfil que se une (?avatar=&nombre=) y pide
       entrar sola; le cuenta a la app si espera (para ofrecer instalarse) o si la sesión se cerró, y la app vuelve a lo
       suyo. -->
  <main class="unirse" data-density="touch">
    <div v-if="fase === 'cargando'" class="grid place-items-center"><UiSpinner /></div>

    <div v-else-if="fase === 'sin-taller'" class="ui-panel ui-panel-body unirse-caja">
      <UiEmptyState icon="search" :title="txt('joinNotFoundTitle')" :text="aviso || txt('joinNotFound')">
        <UiButton icon="pencil" @click="otroCodigo">{{ txt('joinOtherCode') }}</UiButton>
      </UiEmptyState>
    </div>

    <form v-else-if="fase === 'eligiendo'" class="ui-panel ui-panel-body unirse-caja space-y-6" novalidate @submit.prevent="pedirEntrar">
      <header>
        <p class="eyebrow mb-2">{{ codigoLegible(codigo) }}</p>
        <h1 class="ui-heading">{{ taller?.titulo }}</h1>
      </header>
      <fieldset>
        <legend class="field-label">{{ txt('joinChoose') }}</legend>
        <div class="unirse-avatares">
          <button
            v-for="a in AVATARES"
            :key="a.clave"
            type="button"
            class="unirse-avatar"
            :aria-pressed="a.clave === avatar"
            :data-tone="a.clave === avatar ? 'sky' : undefined"
            @click="avatar = a.clave"
          >
            <span class="ui-symbol ui-symbol-lg unirse-circulo" :data-tone="a.tono">
              <img :src="dibujoDe(a.clave)" alt="" decoding="sync">
            </span>
            <span class="unirse-nombre">{{ a.nombre }}</span>
          </button>
        </div>
      </fieldset>
      <UiInput
        id="apodo"
        v-model="apodo"
        :label="txt('joinNickname')"
        :placeholder="nombreVisible(null, avatar)"
        autocomplete="off"
      />
      <UiAlert v-if="aviso" tone="coral">{{ aviso }}</UiAlert>
      <!-- Con la solicitud ya hecha (volvió para cambiar su avatar o su nombre), guardar los cambios: sigue esperando -->
      <UiButton type="submit" size="lg" block :loading="enviando">{{ enEspera ? txt('joinSave') : txt('joinAsk') }}</UiButton>
    </form>

    <div v-else class="ui-panel ui-panel-body unirse-caja space-y-6 text-center">
      <!-- Su avatar con su nombre debajo: así se reconoce si el educador pregunta quién es quién -->
      <div class="flex flex-col items-center gap-2">
        <span class="ui-symbol ui-symbol-lg unirse-circulo" :data-tone="tonoDe(avatar)">
          <img :src="dibujoDe(avatar)" alt="" decoding="sync">
        </span>
        <p class="ui-title">{{ nombreVisible(apodo, avatar) }}</p>
      </div>
      <template v-if="fase === 'esperando'">
        <div>
          <h1 class="ui-heading">{{ txt('joinWaitingTitle') }}</h1>
        </div>
        <div class="flex justify-center"><UiSpinner /></div>
        <UiButton variant="outline" block icon="pencil" @click="fase = 'eligiendo'">{{ txt('joinChange') }}</UiButton>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { AVATARES, dibujoDe, limpiarApodo, nombreVisible, tonoDe } from '@playhub/ui/app/utils/avatares'
import type { Avatar } from '@playhub/ui/app/utils/avatares'
import { esAvatar } from '@playhub/ui/app/utils/avatares'
import { leerMensaje } from '~/runner/conexion/mensajes'
import type { CanalSesion } from '~/runner/conexion/mensajes'
import { codigoLegible, codigoValido, dispositivoNuevo, guardarParticipante, normalizarCodigo, olvidarParticipante, participanteGuardado } from '~/runner/conexion/participante'
import type { TallerDeLaConexion } from '~/runner/conexion/realtime'
import { useRunnerText } from '~/runner/i18n'
import { useRunnerHost } from '~/runner/useHost'
import { hogarParaUnirse, origenesPermitidos, urlsDelRunner } from '~/runner/urlsDeLasApps'

definePageMeta({ layout: false })

type Fase = 'cargando' | 'sin-taller' | 'eligiendo' | 'esperando'

const route = useRoute()
const codigo = normalizarCodigo(String(route.params.codigo ?? ''))
const navegador = import.meta.client && navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'es'
const taller = shallowRef<TallerDeLaConexion | null>(null)
const txt = useRunnerText(() => taller.value?.idioma ?? navegador)

const fase = ref<Fase>('cargando')
const aviso = ref('')
const enviando = ref(false)
const guardado = import.meta.client ? participanteGuardado(codigo) : null
const dispositivo = ref(guardado?.dispositivo ?? '')
const avatar = ref<Avatar>(guardado?.avatar ?? AVATARES[Math.floor(Math.random() * AVATARES.length)]!.clave)
const apodo = ref(guardado?.apodo ?? '')

type Api = ReturnType<typeof import('~/runner/conexion/realtime')['conexionDelDispositivo']>
let api: Api | null = null
let canal: CanalSesion | null = null
let reintento: ReturnType<typeof setInterval> | undefined

// Dentro de la app del hogar (tarea 025): le cuenta si espera o si la sesión se cerró. Solo a los orígenes permitidos.
const embebida = import.meta.client && window.parent !== window
const origenes = shallowRef<string[] | null>(null)
if (embebida) void urlsDelRunner().then((urls) => { origenes.value = origenesPermitidos(urls) })
const host = useRunnerHost(origenes)
// El perfil con que se une desde la app: su avatar y su nombre. Sin ellos, se eligen aquí.
const avatarDelPerfil = embebida && esAvatar(route.query.avatar) ? route.query.avatar : null
const nombreDelPerfil = embebida ? limpiarApodo(String(route.query.nombre ?? '')) : null
if (avatarDelPerfil && !guardado) {
  avatar.value = avatarDelPerfil
  apodo.value = nombreDelPerfil ?? ''
}

// Aprobado: al taller, en modo dispositivo, sin dejar esta página en el historial.
function alTaller() {
  const t = taller.value!
  alTallerYa = true
  detener()
  navigateTo(`/play/${t.storyboard.clave}?mode=device&lang=${t.idioma}&conexion=${codigo}`, { replace: true })
}

// Rechazado (o quitado), o el taller terminó mientras esperaba: la sesión se cierra del todo. El dispositivo lo olvida y va a la página inicial; si escribe el
// código otra vez, empieza de cero, como cualquiera.
function cerrar() {
  detener()
  enEspera.value = false
  olvidarParticipante(codigo)
  if (embebida) host.send({ tipo: 'unirse', fase: 'cerrado' })
  else navigateTo('/workshop/join', { replace: true })
}

// Otro código: en la app del hogar, vuelve a su `/code`; aquí, a la página del código.
function otroCodigo() {
  if (embebida) host.send({ tipo: 'unirse', fase: 'cerrado' })
  else navigateTo('/workshop/join')
}

function detener() {
  clearInterval(reintento)
  canal?.close()
  canal = null
}

// Si sale de la página mientras espera (vuelve atrás, «Escribir otro código»), retira su solicitud y se despide: el
// educador no debe seguir viendo a alguien que ya no está. Si cierra el navegador, la base deja de contarla a los 45 s
// sin señal. Recargar no la retira: vuelve y sigue esperando. Ir al taller ya aprobado no es irse.
let alTallerYa = false
// Tiene una solicitud en espera en la base: también mientras vuelve a elegir avatar o nombre.
const enEspera = ref(false)
function retirarse() {
  if (alTallerYa || !enEspera.value || !dispositivo.value) return
  enEspera.value = false
  canal?.postMessage({ tipo: 'adios', id: dispositivo.value })
  void api?.retirar(dispositivo.value).catch(() => {})
}

// Mientras espera: le avisa al educador cada poco (por si su pantalla se recargó), escucha si lo
// aprueba o lo rechaza y, por si se perdió el aviso, pregunta a la base (que es también su señal: sigue esperando).
async function esperar() {
  fase.value = 'esperando'
  enEspera.value = true
  if (embebida) host.send({ tipo: 'unirse', fase: 'esperando' })
  const { abrirCanal } = await import('~/runner/conexion/realtime')
  canal ??= abrirCanal(codigo, 'dispositivo')
  canal.onmessage = ({ data }) => {
    const m = leerMensaje(data)
    if (!m) return
    if (m.tipo === 'aprobado' && m.ids.includes(dispositivo.value)) alTaller()
    else if (m.tipo === 'rechazado' && m.id === dispositivo.value) cerrar()
    else if (m.tipo === 'cierre') cerrar()
  }
  const avisar = () => canal?.postMessage({ tipo: 'solicitud', id: dispositivo.value })
  avisar()
  clearInterval(reintento)
  reintento = setInterval(async () => {
    avisar()
    const estado = await api!.estado(dispositivo.value).catch(() => undefined)
    if (estado === 'aprobado') alTaller()
    else if (estado === 'rechazado' || estado === 'quitado') cerrar()
    else if (estado === null) cerrar()
  }, 15_000)
}

async function pedirEntrar() {
  if (enviando.value || !api) return
  aviso.value = ''
  enviando.value = true
  try {
    dispositivo.value ||= dispositivoNuevo()
    const limpio = limpiarApodo(apodo.value)
    apodo.value = limpio ?? ''
    guardarParticipante(codigo, { dispositivo: dispositivo.value, avatar: avatar.value, apodo: limpio })
    const estado = await api.entrar(dispositivo.value, avatar.value, limpio)
    if (estado === 'aprobado') alTaller()
    else if (estado === 'esperando') await esperar()
    else cerrar()
  }
  catch (e) {
    const codigoError = (e as { code?: string }).code
    if (codigoError === 'P0002') cerrar()
    else aviso.value = codigoError === '54000' ? txt('joinFull') : txt('joinError')
  }
  finally {
    enviando.value = false
  }
}

onMounted(async () => {
  // Abierta directamente (un enlace o un QR viejo): la entrada es la app del hogar, si la base la tiene.
  if (!embebida) {
    const hogar = await hogarParaUnirse()
    if (hogar) {
      window.location.replace(`${hogar}/code/${codigo}`)
      return
    }
  }
  if (!codigoValido(codigo)) {
    fase.value = 'sin-taller'
    return
  }
  try {
    const { conexionDelDispositivo } = await import('~/runner/conexion/realtime')
    api = conexionDelDispositivo(codigo)
    taller.value = await api.buscar()
    if (!taller.value) {
      fase.value = 'sin-taller'
      return
    }
    // Ya había pedido entrar desde este dispositivo: sigue donde estaba.
    const estado = dispositivo.value ? await api.estado(dispositivo.value) : null
    if (estado === 'aprobado') alTaller()
    else if (estado === 'esperando') await esperar()
    // Lo rechazaron o lo quitaron sin que se enterara (sin red): olvidado, empieza de cero, como si escaneara por primera vez.
    else if (estado === 'rechazado' || estado === 'quitado') {
      olvidarParticipante(codigo)
      dispositivo.value = ''
      apodo.value = ''
      fase.value = 'eligiendo'
    }
    // Desde la app, con el perfil: pide entrar sin pasar por elegir.
    else if (avatarDelPerfil) await pedirEntrar()
    else fase.value = 'eligiendo'
  }
  catch {
    aviso.value = txt('joinError')
    fase.value = 'sin-taller'
  }
})

onBeforeUnmount(() => {
  retirarse()
  detener()
})

useHead({ title: computed(() => `${taller.value?.titulo ?? txt('joinTitle')} · PlayHub`) })
</script>

<style scoped>
.unirse { min-height: 100dvh; display: grid; place-items: center; padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom)); background: var(--color-canvas); }
.unirse-caja { width: 100%; max-width: 440px; }
.unirse-avatares { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.unirse-avatar { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 6px; border-radius: var(--radius-control); border: 2px solid transparent; }
/* El elegido, en cielo: la selección (DESIGN.md, «Roles de color»). */
.unirse-avatar[aria-pressed=true] { border-color: var(--tone-fill); background: var(--tone-tint); }
.unirse-circulo { border-radius: 9999px; overflow: hidden; }
.unirse-circulo img { width: 100%; height: 100%; object-fit: contain; }
.unirse-nombre { font-weight: 800; font-size: var(--text-caption); color: var(--color-ink); }
</style>
