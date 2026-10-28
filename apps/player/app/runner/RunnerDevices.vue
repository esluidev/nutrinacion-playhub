<template>
  <!-- Quién está conectado y en qué escena, y qué puede hacer el educador con uno: pausarlo o
       liberarlo, reiniciar su escena o quitarlo. Nunca qué respondió ni si terminó. -->
  <aside class="side-panel" data-side="right" :aria-labelledby="`${uid}-title`">
    <div class="panel-head">
      <div>
        <p class="panel-caption">{{ txt('devicesCaption') }}</p>
        <h2 :id="`${uid}-title`" class="ui-heading">{{ txt('devices') }}</h2>
      </div>
      <UiButton tone="neutral" size="sm" icon="close" icon-only :label="txt('closeDevices')" @click="emit('close')" />
    </div>
    <div class="join-box">
      <p class="panel-label">{{ txt('joinCode') }}</p>
      <p class="join-code">PH · 4821</p>
      <p class="ui-caption">{{ txt('joinHint') }}</p>
    </div>
    <div class="panel-row">
      <p class="panel-label">{{ txt('connected') }}</p>
      <span class="badge" data-tone="sky">{{ devices.length }}</span>
    </div>
    <ul class="panel-scroll device-list" :aria-label="txt('connectedDevices')">
      <li v-for="device in devices" :key="device.id">
        <button
          type="button"
          class="device-avatar"
          :aria-pressed="device.id === selected"
          :aria-label="device.pausado ? `${device.nombre}, ${txt('devicePaused').toLowerCase()}` : device.nombre"
          @click="emit('select', device.id === selected ? null : device.id)"
        >
          <span class="ui-symbol" :data-tone="device.tono"><UiIcon name="user" /></span>
          <span v-if="device.pausado" class="ui-dot" data-tone="night"><UiIcon name="pause" /></span>
        </button>
      </li>
    </ul>
    <div class="device-card" :data-selected="Boolean(current)">
      <div class="device-card-head">
        <span class="ui-symbol ui-symbol-sm" :data-tone="current?.tono ?? 'neutral'"><UiIcon name="user" /></span>
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
import { useRunnerText } from './i18n'

export interface DeviceView {
  id: string
  nombre: string
  tono: 'coral' | 'grape' | 'sun' | 'sky' | 'lime' | 'rose'
  pausado: boolean
  status: string
}

const props = defineProps<{
  devices: DeviceView[]
  selected: string | null
  locale: string
}>()

const emit = defineEmits<{ close: [], select: [id: string | null], pause: [], restart: [], remove: [] }>()

const txt = useRunnerText(() => props.locale)
const uid = useId()
const current = computed(() => props.devices.find(d => d.id === props.selected) ?? null)
const status = computed(() => current.value?.status ?? (props.devices.length ? txt('tapOne') : txt('nobody')))
</script>
