<template>
  <!-- Quién está conectado y en qué escena, y qué puede hacer el educador con uno: pausarlo o
       liberarlo, reiniciar su escena o quitarlo. Nunca qué respondió ni si terminó. Con la conexión
       del taller (tarea 013), el QR y el código para unirse, y quién pide entrar para aprobarlo o
       rechazarlo (o a todos; o dejar entrar sin aprobar, en una feria). Sin ella, la demostración
       entre pestañas. Ancho y en dos columnas (Luis, 2026-11-26: en 480 todo quedaba apretado): a la
       izquierda, cómo unirse (el QR grande, para mostrarlo o proyectarlo, el código y la dirección) y
       entrar sin aprobar; a la derecha, las personas: quién pide entrar, los conectados (cada avatar
       con su nombre debajo), que se desplazan solas. En el pie del panel, los botones (Luis, 2026-11-26: un
       enlace no parece un botón): sin elegido, los de todos, «Pausar a Todos», «Reiniciar a Todos» y «Aprobar a Todos»; con uno
       elegido, quién es y los suyos (se vuelve a los de todos tocándolo otra vez). Estrecho, una columna. -->
  <aside class="side-panel devices-panel" :aria-labelledby="`${uid}-title`">
    <div class="panel-head">
      <div>
        <p class="panel-caption">{{ txt(conexion ? 'devicesLive' : 'devicesCaption') }}</p>
        <h2 :id="`${uid}-title`" class="ui-heading">{{ txt('devices') }}</h2>
      </div>
      <UiButton tone="neutral" size="sm" icon="close" icon-only :label="txt('closeDevices')" @click="emit('close')" />
    </div>

    <div class="devices-layout">
      <!-- ── Cómo unirse ─────────────────────────────────────────────────── -->
      <section class="devices-join" :aria-label="txt('joinCode')">
        <div v-if="conexion" class="join-box join-live">
          <UiQr :value="conexion.enlace" :label="txt('joinQr')" :size="176" />
          <p class="panel-label">{{ txt('joinCode') }}</p>
          <p class="join-code">{{ codigoLegible(conexion.codigo) }}</p>
          <!-- La dirección sola, en negrita y en una línea, para encontrarla de un vistazo y que nadie la lea cortada, y
               al lado el icono que la copia, sin caja de botón (Luis, 2026-11-27: la lee gente que no es técnica). Copia
               lo que se ve, con su protocolo para que se abra al pegarla. -->
          <div>
            <p class="ui-caption">{{ txt('joinScan') }}</p>
            <div class="join-url" :style="{ '--largo': conexion.direccion.length }">
              <strong>{{ conexion.direccion }}</strong>
              <button type="button" class="join-copy" :data-copiada="copiada || undefined" :aria-label="txt(copiada ? 'addressCopied' : 'copyAddress')" :title="txt(copiada ? 'addressCopied' : 'copyAddress')" @click="copiarDireccion">
                <UiIcon :name="copiada ? 'check' : 'copy'" />
              </button>
            </div>
          </div>
        </div>
        <div v-else class="join-box">
          <p class="panel-label">{{ txt('joinCode') }}</p>
          <p class="join-code">PH-4821</p>
          <p class="ui-caption">{{ txt('joinHint') }}</p>
        </div>
        <div v-if="conexion" class="open-entry">
          <UiSwitch :model-value="sinAprobar" :label="txt('openEntry')" @update:model-value="(v: boolean) => emit('sin-aprobar', v)" />
          <p class="ui-caption">{{ txt('openEntryHint') }}</p>
        </div>
      </section>

      <!-- ── Las personas ────────────────────────────────────────────────── -->
      <section class="panel-scroll devices-people">
        <!-- Quien pide entrar: se aprueba o se rechaza; en sol, porque espera ahora. -->
        <template v-if="conexion && solicitudes.length">
          <div class="panel-row">
            <p class="panel-label">{{ txt('requests') }} <span class="badge" data-tone="sun">{{ solicitudes.length }}</span></p>
          </div>
          <ul class="request-list" :aria-label="txt('requests')">
            <li v-for="s in solicitudes" :key="s.id" class="request">
              <span class="ui-symbol request-avatar" :data-tone="s.tono">
                <img :src="dibujoDe(s.avatar)" alt="" decoding="sync">
              </span>
              <p class="request-name">{{ s.nombre }}</p>
              <UiButton tone="neutral" size="sm" icon="close" icon-only :label="`${txt('reject')} · ${s.nombre}`" :title="txt('reject')" @click="emit('rechazar', s.id)" />
              <UiButton tone="neutral" size="sm" icon="check" icon-only :label="`${txt('approve')} · ${s.nombre}`" :title="txt('approve')" @click="emit('aprobar', s.id)" />
            </li>
          </ul>
        </template>

        <div class="panel-row">
          <p class="panel-label">{{ txt('connected') }} <span class="badge" data-tone="sky">{{ devices.length }}</span></p>
        </div>
        <ul v-if="devices.length" class="device-grid" :aria-label="txt('connectedDevices')">
          <li v-for="device in devices" :key="device.id">
            <button
              type="button"
              class="device-tile"
              :aria-pressed="device.id === selected"
              :aria-label="device.pausado ? `${device.nombre}, ${txt('devicePaused').toLowerCase()}` : device.nombre"
              @click="emit('select', device.id === selected ? null : device.id)"
            >
              <span class="device-tile-avatar">
                <span class="ui-symbol" :data-tone="device.tono">
                  <img v-if="device.avatar" :src="dibujoDe(device.avatar)" alt="" decoding="sync">
                  <UiIcon v-else name="user" />
                </span>
                <!-- En pausa, el candado cerrado: el mismo de la barra y de los botones (Luis, 2026-11-26) -->
                <span v-if="device.pausado" class="ui-dot" data-tone="night"><UiIcon name="lock" /></span>
              </span>
              <span class="device-tile-name">{{ device.nombre }}</span>
            </button>
          </li>
        </ul>
        <p v-else class="ui-caption mt-2">{{ txt('nobody') }}</p>

      </section>
    </div>

    <!-- El pie del panel, con los botones (Luis, 2026-11-26). Con uno elegido, quién es, en qué escena va y lo que se hace
         con él. Sin elegido, lo de todos: pausar o reiniciar la escena solo en los dispositivos (la pausa de Ajustes y el
         Reiniciar de la barra alcanzan también la pantalla del educador) y aprobar a los que esperan, la acción
         principal, en lima. -->
    <div v-if="devices.length || (conexion && solicitudes.length)" class="devices-footer">
      <template v-if="current">
        <div class="device-card-head">
          <span class="ui-symbol" :data-tone="current.tono">
            <img v-if="current.avatar" :src="dibujoDe(current.avatar)" alt="" decoding="sync">
            <UiIcon v-else name="user" />
          </span>
          <div class="min-w-0">
            <p class="device-card-name">{{ current.nombre }}</p>
            <p class="ui-caption" aria-live="polite">{{ current.status }}</p>
          </div>
        </div>
        <div class="device-actions">
          <UiButton tone="neutral" size="sm" :icon="current.pausado ? 'lock' : 'lock-open'" :disabled="todosEnPausa" @click="emit('pause')">
            {{ current.pausado ? txt('freeDevice') : txt('pauseDevice') }}
          </UiButton>
          <UiButton tone="neutral" size="sm" icon="retry" @click="emit('restart')">{{ txt('restart') }}</UiButton>
          <UiButton tone="coral" size="sm" icon="close" @click="emit('remove')">{{ txt('remove') }}</UiButton>
        </div>
      </template>
      <template v-else>
        <p v-if="devices.length" class="ui-caption">{{ txt('tapOne') }}</p>
        <div class="device-actions ml-auto">
          <!-- El candado como en la barra: cerrado con ellos en pausa, abierto sin ella -->
          <UiButton v-if="devices.length" tone="neutral" size="sm" :icon="todosEnPausa ? 'lock' : 'lock-open'" @click="emit('pause-all')">
            {{ todosEnPausa ? txt('freeAll') : txt('pauseAll') }}
          </UiButton>
          <UiButton v-if="devices.length" tone="neutral" size="sm" icon="retry" @click="emit('restart-all')">{{ txt('restartAll') }}</UiButton>
          <UiButton v-if="conexion && solicitudes.length" size="sm" icon="check" @click="emit('aprobar', null)">{{ txt('approveAll') }}</UiButton>
        </div>
      </template>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { dibujoDe } from '@playhub/ui/app/utils/avatares'
import type { Avatar, TonoAvatar } from '@playhub/ui/app/utils/avatares'
import { codigoLegible } from './conexion/participante'
import { useRunnerText } from './i18n'

export interface DeviceView {
  id: string
  nombre: string
  tono: 'coral' | 'grape' | 'sun' | 'sky' | 'lime' | 'rose'
  /** El animal de su avatar (`dibujoDe`); sin él, el icono de persona. */
  avatar?: string
  pausado: boolean
  status: string
}

const props = withDefaults(defineProps<{
  devices: DeviceView[]
  selected: string | null
  locale: string
  /** La conexión del taller: el código, el enlace del QR y la dirección corta para escribirlo. */
  conexion?: { codigo: string, enlace: string, direccion: string, url: string } | null
  solicitudes?: { id: string, nombre: string, avatar: Avatar, tono: TonoAvatar }[]
  sinAprobar?: boolean
  /** Todos los dispositivos en pausa, desde este panel: el de cada uno no se puede liberar solo. */
  todosEnPausa?: boolean
}>(), {
  conexion: null,
  solicitudes: () => [],
  sinAprobar: false,
  todosEnPausa: false,
})

const emit = defineEmits<{
  'close': []
  'select': [id: string | null]
  'pause': []
  'pause-all': []
  'restart-all': []
  'restart': []
  'remove': []
  'aprobar': [id: string | null]
  'rechazar': [id: string]
  'sin-aprobar': [valor: boolean]
}>()

const txt = useRunnerText(() => props.locale)
const uid = useId()
// Copiar la dirección para unirse: el botón muestra el check un momento.
const copiada = ref(false)
let soltarCopiada: ReturnType<typeof setTimeout> | undefined
async function copiarDireccion() {
  if (!props.conexion || !(await copiarTexto(props.conexion.url))) return
  copiada.value = true
  clearTimeout(soltarCopiada)
  soltarCopiada = setTimeout(() => { copiada.value = false }, 2000)
}
onBeforeUnmount(() => clearTimeout(soltarCopiada))
const current = computed(() => props.devices.find(d => d.id === props.selected) ?? null)
</script>
