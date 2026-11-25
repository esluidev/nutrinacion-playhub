<template>
  <!-- Unirse a un taller (tarea 013): el QR de la pantalla del educador abre esta página con su
       código. Sin cuenta ni nada que instalar: se elige un avatar, se escribe un apodo (opcional; sin
       él, el nombre del avatar) y se pide entrar. Se espera a que el educador lo apruebe y, aprobado,
       se abre el taller en modo dispositivo. El dispositivo recuerda su avatar, su apodo y su
       identificador para esta conexión: al recargar vuelve como el mismo. -->
  <main class="unirse" data-density="touch">
    <div v-if="fase === 'cargando'" class="grid place-items-center"><UiSpinner /></div>

    <div v-else-if="fase === 'sin-taller'" class="ui-panel ui-panel-body unirse-caja">
      <UiEmptyState icon="search" :title="txt('joinNotFoundTitle')" :text="aviso || txt('joinNotFound')">
        <UiButton to="/unirse" icon="pencil">{{ txt('joinOtherCode') }}</UiButton>
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
        :hint="txt('joinNicknameHint', { name: nombreVisible(null, avatar) })"
        :placeholder="nombreVisible(null, avatar)"
        autocomplete="off"
      />
      <UiAlert v-if="aviso" tone="coral">{{ aviso }}</UiAlert>
      <UiButton type="submit" size="lg" block icon="arrow-right" :loading="enviando">{{ txt('joinAsk') }}</UiButton>
    </form>

    <div v-else class="ui-panel ui-panel-body unirse-caja space-y-6 text-center">
      <span class="ui-symbol ui-symbol-lg unirse-circulo mx-auto" :data-tone="tonoDe(avatar)">
        <img :src="dibujoDe(avatar)" alt="" decoding="sync">
      </span>
      <template v-if="fase === 'esperando'">
        <div>
          <h1 class="ui-heading">{{ txt('joinWaitingTitle') }}</h1>
          <p class="ui-text mt-2">{{ txt('joinWaitingText', { name: nombreVisible(apodo, avatar) }) }}</p>
        </div>
        <div class="flex justify-center"><UiSpinner /></div>
        <UiButton variant="outline" block icon="pencil" @click="fase = 'eligiendo'">{{ txt('joinChange') }}</UiButton>
      </template>
      <template v-else-if="fase === 'rechazado'">
        <div>
          <h1 class="ui-heading">{{ txt('joinRejectedTitle') }}</h1>
          <p class="ui-text mt-2">{{ txt('joinRejectedText') }}</p>
        </div>
        <UiButton block icon="retry" @click="pedirDeNuevo">{{ txt('joinAskAgain') }}</UiButton>
      </template>
      <template v-else-if="fase === 'terminado'">
        <h1 class="ui-heading">{{ txt('joinEnded') }}</h1>
        <UiButton to="/unirse" variant="outline" block icon="pencil">{{ txt('joinOtherCode') }}</UiButton>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { AVATARES, dibujoDe, limpiarApodo, nombreVisible, tonoDe } from '~/runner/avatares'
import type { Avatar } from '~/runner/avatares'
import { leerMensaje } from '~/runner/conexion/mensajes'
import type { CanalSesion } from '~/runner/conexion/mensajes'
import { codigoLegible, codigoValido, dispositivoNuevo, guardarParticipante, normalizarCodigo, participanteGuardado } from '~/runner/conexion/participante'
import type { TallerDeLaConexion } from '~/runner/conexion/realtime'
import { useRunnerText } from '~/runner/i18n'

definePageMeta({ layout: false })

type Fase = 'cargando' | 'sin-taller' | 'eligiendo' | 'esperando' | 'rechazado' | 'terminado'

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

// Aprobado: al taller, en modo dispositivo, sin dejar esta página en el historial.
function alTaller() {
  const t = taller.value!
  detener()
  navigateTo(`/play/${t.storyboard.eje}/${t.storyboard.slug}?mode=device&lang=${t.idioma}&conexion=${codigo}`, { replace: true })
}

function detener() {
  clearInterval(reintento)
  canal?.close()
  canal = null
}

// Mientras espera: le avisa al educador cada poco (por si su pantalla se recargó), escucha si lo
// aprueba o lo rechaza y, por si se perdió el aviso, pregunta a la base.
async function esperar() {
  fase.value = 'esperando'
  const { abrirCanal } = await import('~/runner/conexion/realtime')
  canal ??= abrirCanal(codigo, 'dispositivo')
  canal.onmessage = ({ data }) => {
    const m = leerMensaje(data)
    if (!m) return
    if (m.tipo === 'aprobado' && m.ids.includes(dispositivo.value)) alTaller()
    else if (m.tipo === 'rechazado' && m.id === dispositivo.value) { detener(); fase.value = 'rechazado' }
    else if (m.tipo === 'cierre') { detener(); fase.value = 'terminado' }
  }
  const avisar = () => canal?.postMessage({ tipo: 'solicitud', id: dispositivo.value })
  avisar()
  clearInterval(reintento)
  reintento = setInterval(async () => {
    avisar()
    const estado = await api!.estado(dispositivo.value).catch(() => undefined)
    if (estado === 'aprobado') alTaller()
    else if (estado === 'rechazado' || estado === 'quitado') { detener(); fase.value = 'rechazado' }
    else if (estado === null) { detener(); fase.value = 'terminado' }
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
    else fase.value = 'rechazado'
  }
  catch (e) {
    const codigoError = (e as { code?: string }).code
    if (codigoError === 'P0002') fase.value = 'terminado'
    else aviso.value = codigoError === '54000' ? txt('joinFull') : txt('joinError')
  }
  finally {
    enviando.value = false
  }
}

// Rechazado o quitado: vuelve a pedirlo como un dispositivo nuevo (el educador decide otra vez).
async function pedirDeNuevo() {
  dispositivo.value = dispositivoNuevo()
  await pedirEntrar()
}

onMounted(async () => {
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
    else if (estado === 'rechazado' || estado === 'quitado') fase.value = 'rechazado'
    else fase.value = 'eligiendo'
  }
  catch {
    aviso.value = txt('joinError')
    fase.value = 'sin-taller'
  }
})

onBeforeUnmount(detener)

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
