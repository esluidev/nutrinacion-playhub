<template>
  <div>
    <label v-if="label" :for="inputId" class="field-label">
      {{ label }}
      <span v-if="required" class="text-danger" aria-hidden="true">*</span>
      <span v-if="optional" class="font-semibold text-muted">{{ labels.optional }}</span>
    </label>
    <div :class="icon && 'field-with-icon'">
      <UiIcon v-if="icon" :name="icon" />
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :min="min"
        :max="max"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :aria-invalid="!!error || undefined"
        :aria-describedby="error || hint ? `${inputId}-help` : undefined"
        :class="['field', size === 'sm' && 'field-sm', size === 'lg' && 'field-lg']"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      >
    </div>
    <p v-if="error" :id="`${inputId}-help`" class="field-error">{{ error }}</p>
    <p v-else-if="hint" :id="`${inputId}-help`" class="field-help">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import type { UiSize } from '../../utils/ui-tones'
import type { UiIconName } from '../../utils/ui-icons'

const props = withDefaults(defineProps<{
  id?: string
  label?: string
  type?: string
  modelValue?: string | number
  placeholder?: string
  required?: boolean
  optional?: boolean
  disabled?: boolean
  error?: string
  hint?: string
  min?: string
  max?: string
  size?: UiSize
  icon?: UiIconName
  autocomplete?: string
  inputmode?: 'text' | 'email' | 'numeric' | 'tel' | 'search' | 'url' | 'decimal' | 'none'
}>(), {
  type: 'text',
  size: 'md',
})

defineEmits<{ 'update:modelValue': [value: string] }>()

const labels = useUiLabels()
const autoId = useId()
const inputId = computed(() => props.id ?? autoId)
</script>
