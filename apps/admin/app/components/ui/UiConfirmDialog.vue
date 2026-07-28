<template>
  <!-- Confirmación destructiva seria: explica las consecuencias (el cuerpo lo pone quien
       lo usa) y, si `requireText` viene, exige escribirlo EXACTO para desbloquear el botón
       — el patrón de borrado de las grandes apps. Sobre Reka Dialog (focus trap, Esc,
       overlay y a11y vienen de ahí; los estilos son nuestros). -->
  <RekaDialogRoot :open="open" @update:open="(v) => emit('update:open', v)">
    <RekaDialogPortal>
      <RekaDialogOverlay class="fixed inset-0 bg-black/40 z-[60]" />
      <RekaDialogContent
        class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] max-w-[calc(100vw-32px)] bg-white rounded-[18px] shadow-menu p-6 z-[60] focus:outline-none"
        @escape-key-down="emit('update:open', false)"
      >
        <RekaDialogTitle class="text-[17px] font-display font-semibold text-brand-dark">
          {{ title }}
        </RekaDialogTitle>
        <RekaDialogDescription as-child>
          <div class="mt-3 text-[13.5px] text-gray-600 leading-relaxed">
            <slot />
          </div>
        </RekaDialogDescription>

        <div v-if="requireText" class="mt-5 space-y-1.5">
          <label class="block text-[12.5px] font-semibold text-gray-600">{{ requireLabel }}</label>
          <input
            v-model="texto"
            class="input"
            :placeholder="requireText"
            autocomplete="off"
            spellcheck="false"
          />
        </div>

        <div class="flex items-center justify-end gap-2 mt-6">
          <UiButton variant="outline" size="sm" type="button" @click="emit('update:open', false)">
            {{ t('common.cancel') }}
          </UiButton>
          <UiButton
            variant="danger"
            size="sm"
            type="button"
            :loading="loading"
            :disabled="bloqueado"
            @click="emit('confirm')"
          >
            {{ confirmLabel }}
          </UiButton>
        </div>
      </RekaDialogContent>
    </RekaDialogPortal>
  </RekaDialogRoot>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  confirmLabel: string
  requireText?: string     // escribirlo exacto desbloquea el botón
  requireLabel?: string
  loading?: boolean
}>(), {
  requireText: undefined,
  requireLabel: undefined,
  loading: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
}>()

const { t } = useT()
const texto = ref('')

// Cada apertura arranca limpia: nada de confirmaciones heredadas del intento anterior.
watch(() => props.open, (v) => {
  if (v) texto.value = ''
})

const bloqueado = computed(() => !!props.requireText && texto.value.trim() !== props.requireText)
</script>
