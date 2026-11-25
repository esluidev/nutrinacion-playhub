<template>
  <!-- Dar de alta algo pequeño ahí mismo, debajo de su campo (un lugar, una audiencia), sin abrir un diálogo encima del
       formulario: su nombre y «Crear» (tarea 023). Lo demás se completa después en su página (`ayuda` lo dice). Lo
       usan LugarSelector y AudienciaSelector cuando se elige «Nuevo…» en su desplegable. -->
  <div class="mt-3 rounded-control-sm border-2 border-line bg-canvas p-4">
    <div class="flex flex-wrap items-end gap-3">
      <UiInput
        :id="id"
        v-model="nombre"
        class="min-w-0 flex-1 basis-56"
        :label="label"
        :placeholder="placeholder"
        required
      />
      <UiButton variant="outline" icon="check" :loading="guardando" @click="emit('crear', nombre.trim())">{{ boton }}</UiButton>
      <UiButton tone="neutral" :disabled="guardando" @click="emit('cancelar')">{{ t('common.cancel') }}</UiButton>
    </div>
    <!-- Lo que se elige además del nombre (una audiencia abierta al público) -->
    <slot />
    <p v-if="error" class="field-error mt-2">{{ error }}</p>
    <p v-else-if="ayuda" class="field-help mt-2">{{ ayuda }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  id: string
  label: string
  placeholder?: string
  boton: string
  ayuda?: string
  guardando?: boolean
  error?: string
}>()
const emit = defineEmits<{ crear: [nombre: string], cancelar: [] }>()
const nombre = defineModel<string>('nombre', { default: '' })

const { t } = useT()
</script>
