<template>
  <!-- Confirmación con consecuencia: el cuerpo explica qué pasa. Con `requireText` hay que
       escribirlo exacto para desbloquear el botón (patrón de borrado). -->
  <UiDialog
    :open="open"
    :title="title"
    :symbol="symbol"
    :tone="tone"
    split
    @update:open="(v) => emit('update:open', v)"
  >
    <slot />
    <div v-if="requireText" class="mt-5">
      <UiInput
        v-model="texto"
        :label="requireLabel"
        :placeholder="requireText"
        autocomplete="off"
      />
    </div>
    <template #actions>
      <UiButton tone="neutral" @click="emit('update:open', false)">{{ cancelLabel ?? labels.cancel }}</UiButton>
      <UiButton :tone="tone" :loading="loading" :disabled="bloqueado" @click="emit('confirm')">
        {{ confirmLabel }}
      </UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import type { UiTone } from '../../utils/ui-tones'
import type { UiIconName } from '../../utils/ui-icons'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  confirmLabel: string
  cancelLabel?: string
  // Tono de la intención: coral para salir o borrar, lime para continuar o terminar, sun para volver a empezar.
  tone?: UiTone
  symbol?: UiIconName
  requireText?: string
  requireLabel?: string
  loading?: boolean
  // Cuando la acción no se puede hacer (p. ej., algo la impide): el cuerpo explica por qué.
  disabled?: boolean
}>(), {
  tone: 'coral',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
}>()

const labels = useUiLabels()
const texto = ref('')

// Cada apertura arranca limpia.
watch(() => props.open, (v) => { if (v) texto.value = '' })

const bloqueado = computed(() => props.disabled || (!!props.requireText && texto.value.trim() !== props.requireText))
</script>
