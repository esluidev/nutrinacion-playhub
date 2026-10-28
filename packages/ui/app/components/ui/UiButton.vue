<template>
  <component
    :is="tag"
    v-bind="linkAttrs"
    :class="classes"
    :data-tone="quiet ? undefined : resolvedTone"
    :aria-busy="loading || undefined"
    :aria-label="iconOnly ? label : undefined"
  >
    <span v-if="loading" class="spinner" aria-hidden="true" />
    <UiIcon v-else-if="icon" :name="icon" />
    <span v-if="!iconOnly" class="contents"><slot>{{ label }}</slot></span>
    <UiIcon v-if="iconRight && !iconOnly" :name="iconRight" />
  </component>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { UiTone, UiSize } from '../../utils/ui-tones'
import type { UiIconName } from '../../utils/ui-icons'

// Botón del kit: rectángulo redondeado con base en relieve. `variant` es el tipo: principal (lima,
// una por vista), contorno (secundaria, neutra) o discreto (sin relieve). El color va en `tone`.
const props = withDefaults(defineProps<{
  variant?: 'primary' | 'outline' | 'ghost'
  tone?: UiTone
  size?: UiSize
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  icon?: UiIconName
  iconRight?: UiIconName
  // Solo icono: `label` pasa a ser el nombre accesible.
  iconOnly?: boolean
  label?: string
  block?: boolean
  to?: RouteLocationRaw
  href?: string
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
})

const VARIANT_TONE: Record<string, UiTone | undefined> = {
  primary: undefined,
  outline: 'neutral',
  ghost: undefined,
}

const quiet = computed(() => props.variant === 'ghost' && !props.tone)
const resolvedTone = computed(() => props.tone ?? VARIANT_TONE[props.variant])

const tag = computed(() => {
  if (props.to) return resolveComponent('NuxtLink')
  if (props.href) return 'a'
  return 'button'
})

const linkAttrs = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) return { href: props.href }
  return { type: props.type, disabled: props.disabled || props.loading }
})

const classes = computed(() => quiet.value
  ? ['ui-quiet', props.block && 'w-full']
  : [
      'ui-button',
      props.size === 'sm' && 'ui-button-sm',
      props.size === 'lg' && 'ui-button-lg',
      props.iconOnly && 'ui-icon-button',
      props.block && 'ui-button-block',
    ])
</script>
