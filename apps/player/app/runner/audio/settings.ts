import { ref } from 'vue'

// Silencio del runner: lo respetan la narración y la voz del navegador.
export const muted = ref(false)

export function setMuted(value: boolean) {
  muted.value = value
}
