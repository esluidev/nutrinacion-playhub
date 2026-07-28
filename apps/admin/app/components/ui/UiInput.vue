<template>
  <div class="space-y-[7px]">
    <label v-if="label" :for="id" class="block text-[13px] font-bold text-gray-700">
      {{ label }}
      <span v-if="required" class="text-brand-coral">*</span>
      <span v-if="optional" class="text-gray-400 font-semibold">(opcional)</span>
    </label>

    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :min="min"
      :max="max"
      :class="['input', disabled ? '!bg-[#e9ebee] !border-[#e6e9ea] !text-gray-500 cursor-not-allowed' : '']"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >

    <p v-if="error" class="text-[13px] text-red-500">{{ error }}</p>
    <p v-else-if="hint" class="text-[11.5px] font-semibold text-gray-400">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
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
}

withDefaults(defineProps<Props>(), {
  type: 'text',
})

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
