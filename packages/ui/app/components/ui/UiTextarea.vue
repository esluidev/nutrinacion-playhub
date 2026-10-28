<template>
  <div>
    <label v-if="label" :for="inputId" class="field-label">
      {{ label }}
      <span v-if="required" class="text-danger" aria-hidden="true">*</span>
      <span v-if="optional" class="font-semibold text-muted">{{ labels.optional }}</span>
    </label>
    <textarea
      :id="inputId"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :rows="rows"
      :aria-invalid="!!error || undefined"
      class="field"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <p v-if="error" class="field-error">{{ error }}</p>
    <p v-else-if="hint" class="field-help">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  id?: string
  label?: string
  modelValue?: string
  placeholder?: string
  required?: boolean
  optional?: boolean
  disabled?: boolean
  error?: string
  hint?: string
  rows?: number
}>(), {
  rows: 4,
})

defineEmits<{ 'update:modelValue': [value: string] }>()

const labels = useUiLabels()
const autoId = useId()
const inputId = computed(() => props.id ?? autoId)
</script>
