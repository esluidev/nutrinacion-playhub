<template>
  <dialog
    ref="el"
    :class="['dialog', size === 'lg' ? 'max-w-[640px]' : size === 'sm' ? 'max-w-[380px]' : '']"
    :aria-labelledby="title ? `${uid}-title` : undefined"
    @close="onClose"
    @cancel.prevent="close"
    @click="onBackdrop"
  >
    <UiButton
      v-if="closable"
      class="dialog-close"
      tone="neutral"
      size="sm"
      icon="close"
      icon-only
      :label="labels.close"
      @click="close"
    />
    <div :class="center && 'dialog-center'">
      <UiSymbol v-if="symbol" :icon="symbol" :tone="tone" />
      <h2 v-if="title" :id="`${uid}-title`" class="ui-title pr-10">{{ title }}</h2>
      <div class="dialog-body ui-text">
        <slot />
      </div>
    </div>
    <div v-if="$slots.actions" :class="['dialog-actions', split && 'dialog-actions-split']">
      <slot name="actions" />
    </div>
  </dialog>
</template>

<script setup lang="ts">
import type { UiTone, UiSize } from '../../utils/ui-tones'
import type { UiIconName } from '../../utils/ui-icons'

// Ventana del kit sobre <dialog> nativo: foco atrapado, Escape y capa superior los da el
// navegador. `open` se usa con v-model:open. Clic en el velo cierra salvo `persistent`.
const props = withDefaults(defineProps<{
  open: boolean
  title?: string
  symbol?: UiIconName
  tone?: UiTone
  size?: UiSize
  center?: boolean
  split?: boolean
  closable?: boolean
  persistent?: boolean
}>(), {
  size: 'md',
  closable: true,
})

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const labels = useUiLabels()
const uid = useId()
const el = ref<HTMLDialogElement | null>(null)

function sync(open: boolean) {
  const d = el.value
  if (!d) return
  if (open && !d.open) d.showModal()
  if (!open && d.open) d.close()
}

watch(() => props.open, sync)
onMounted(() => sync(props.open))

function close() {
  if (!props.persistent) emit('update:open', false)
}

function onClose() {
  if (props.open) emit('update:open', false)
}

function onBackdrop(e: MouseEvent) {
  if (e.target === el.value) close()
}
</script>
