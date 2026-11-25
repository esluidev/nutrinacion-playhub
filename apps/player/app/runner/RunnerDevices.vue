<template>
  <!-- Quién está conectado y en qué escena, y qué puede hacer el educador con uno: pausarlo o
       liberarlo, reiniciar su escena o quitarlo. Nunca qué respondió ni si terminó. Con la conexión
       del taller (tarea 013), arriba el QR y el código para unirse, y quién pide entrar para
       aprobarlo o rechazarlo (o a todos; o dejar entrar sin aprobar, en una feria). Sin ella, la
       demostración entre pestañas. -->
  <aside class="side-panel" data-side="right" :aria-labelledby="`${uid}-title`">
    <div class="panel-head">
      <div>
        <p class="panel-caption">{{ txt(conexion ? 'devicesLive' : 'devicesCaption') }}</p>
        <h2 :id="`${uid}-title`" class="ui-heading">{{ txt('devices') }}</h2>
      </div>
      <UiButton tone="neutral" size="sm" icon="close" icon-only :label="txt('closeDevices')" @click="emit('close')" />
    </div>

    <div class="panel-scroll devices-body">
      <div v-if="conexion" class="join-box join-live">
        <RunnerQr :value="conexion.enlace" :label="txt('joinQr')" :size="148" />
        <div class="min-w-0">
          <p class="panel-label">{{ txt('joinCode') }}</p>
          <p class="join-code">{{ codigoLegible(conexion.codigo) }}</p>
          <p class="ui-caption">{{ txt('joinScan', { url: conexion.direccion }) }}</p>
        </div>
      </div>
      <div v-else class="join-box">
        <p class="panel-label">{{ txt('joinCode') }}</p>
        <p class="join-code">PH · 4821</p>
        <p class="ui-caption">{{ txt('joinHint') }}</p>
      </div>

      <template v-if="conexion">
        <!-- Quien pide entrar: se aprueba o se rechaza; en sol, porque espera ahora. -->
        <div v-if="solicitudes.length" class="panel-row">
          <p class="panel-label">{{ txt('requests') }} <span class="badge" data-tone="sun">{{ solicitudes.length }}</span></p>
          <UiButton size="sm" icon="check" @click="emit('aprobar', null)">{{ txt('approveAll') }}</UiButton>
        </div>
        <ul v-if="solicitudes.length" class="request-list" :aria-label="txt('requests')">
          <li v-for="s in solicitudes" :key="s.id" class="request">
            <span class="ui-symbol ui-symbol-sm request-avatar" :data-tone="s.tono">
              <img :src="dibujoDe(s.avatar)" alt="" decoding="sync">
            </span>
            <p class="request-name">{{ s.nombre }}</p>
            <UiButton tone="neutral" size="sm" icon="close" icon-only :label="`${txt('reject')} · ${s.nombre}`" @click="emit('rechazar', s.id)" />
            <UiButton size="sm" icon="check" @click="emit('aprobar', s.id)">{{ txt('approve') }}</UiButton>
          </li>
        </ul>
        <div class="open-entry">
          <UiSwitch :model-value="sinAprobar" :label="txt('openEntry')" @update:model-value="(v: boolean) => emit('sin-aprobar', v)" />
          <p class="ui-caption">{{ txt('openEntryHint') }}</p>
        </div>
      </template>

      <div class="panel-row">
        <p class="panel-label">{{ txt('connected') }}</p>
        <span class="badge" data-tone="sky">{{ devices.length }}</span>
      </div>
      <ul class="device-list" :aria-label="txt('connectedDevices')">
        <li v-for="device in devices" :key="device.id">
          <button
            type="button"
            class="device-avatar"
            :aria-pressed="device.id === selected"
            :aria-label="device.pausado ? `${device.nombre}, ${txt('devicePaused').toLowerCase()}` : device.nombre"
            :title="device.nombre"
            @click="emit('select', device.id === selected ? null : device.id)"
          >
            <span class="ui-symbol" :data-tone="device.tono">
              <img v-if="device.avatar" :src="librarySvg(`avatar-${device.avatar}`)" alt="" decoding="sync">
              <UiIcon v-else name="user" />
            </span>
            <span v-if="device.pausado" class="ui-dot" data-tone="night"><UiIcon name="pause" /></span>
          </button>
        </li>
      </ul>
    </div>
    <div class="device-card" :data-selected="Boolean(current)">
      <div class="device-card-head">
        <span class="ui-symbol ui-symbol-sm" :data-tone="current?.tono ?? 'neutral'">
          <img v-if="current?.avatar" :src="librarySvg(`avatar-${current.avatar}`)" alt="" decoding="sync">
          <UiIcon v-else name="user" />
        </span>
        <div>
          <p class="device-card-name">{{ current?.nombre ?? txt('noDevice') }}</p>
          <p class="ui-caption" aria-live="polite">{{ status }}</p>
        </div>
      </div>
      <div class="device-actions">
        <UiButton tone="neutral" size="sm" :icon="current?.pausado ? 'play' : 'pause'" :disabled="!current" @click="emit('pause')">
          {{ current?.pausado ? txt('freeDevice') : txt('pauseDevice') }}
        </UiButton>
        <UiButton tone="neutral" size="sm" icon="retry" :disabled="!current" @click="emit('restart')">{{ txt('restart') }}</UiButton>
        <UiButton tone="coral" size="sm" icon="close" :disabled="!current" @click="emit('remove')">{{ txt('remove') }}</UiButton>
      </div>
    </div>
    <p class="device-hint ui-caption"><UiIcon name="info" />{{ txt('privacy') }}</p>
  </aside>
</template>

<script setup lang="ts">
import { dibujoDe } from './avatares'
import type { Avatar, TonoAvatar } from './avatares'
import { codigoLegible } from './conexion/participante'
import { librarySvg } from './content'
import { useRunnerText } from './i18n'
import RunnerQr from './RunnerQr.vue'

export interface DeviceView {
  id: string
  nombre: string
  tono: 'coral' | 'grape' | 'sun' | 'sky' | 'lime' | 'rose'
  /** El animal de su avatar (`avatar-<animal>`); sin él, el icono de persona. */
  avatar?: string
  pausado: boolean
  status: string
}

const props = withDefaults(defineProps<{
  devices: DeviceView[]
  selected: string | null
  locale: string
  /** La conexión del taller: el código, el enlace del QR y la dirección corta para escribirlo. */
  conexion?: { codigo: string, enlace: string, direccion: string } | null
  solicitudes?: { id: string, nombre: string, avatar: Avatar, tono: TonoAvatar }[]
  sinAprobar?: boolean
}>(), {
  conexion: null,
  solicitudes: () => [],
  sinAprobar: false,
})

const emit = defineEmits<{
  'close': []
  'select': [id: string | null]
  'pause': []
  'restart': []
  'remove': []
  'aprobar': [id: string | null]
  'rechazar': [id: string]
  'sin-aprobar': [valor: boolean]
}>()

const txt = useRunnerText(() => props.locale)
const uid = useId()
const current = computed(() => props.devices.find(d => d.id === props.selected) ?? null)
const status = computed(() => current.value?.status ?? (props.devices.length ? txt('tapOne') : txt('nobody')))
</script>
