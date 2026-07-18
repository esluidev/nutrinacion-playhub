<template>
  <div class="demo">
    <StopLight :state="state" :size="104" />
    <div class="demo-controls">
      <button
        v-for="s in STATES"
        :key="s.id"
        :class="['sp-btn', s.btn]"
        @click="setState(s.id)"
      >
        {{ s.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import StopLight, { type StopLightState } from '~/primitives/StopLight/StopLight.vue'
import { Sounds } from '~/primitives/sounds'

const state = ref<StopLightState>('off')

const STATES = [
  { id: 'green' as const, label: '¡Rápido!', btn: 'sp-btn-green' },
  { id: 'yellow' as const, label: 'Despacio', btn: 'sp-btn-yellow' },
  { id: 'red' as const, label: '¡Estatua!', btn: 'sp-btn-red' },
  { id: 'off' as const, label: 'Apagar', btn: 'sp-btn-blue' },
]

function setState(s: StopLightState) {
  state.value = s
  if (s !== 'off') Sounds.play(s === 'red' ? 'whoosh' : s === 'yellow' ? 'tick' : 'pop')
}
</script>

<style scoped>
.demo {
  display: flex;
  align-items: center;
  gap: 40px;
}

.demo-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
