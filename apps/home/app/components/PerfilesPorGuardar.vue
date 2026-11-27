<template>
  <!-- Al entrar con la cuenta en un dispositivo que ya tenía perfiles que ella no conoce (lo acordado el 2026-11-17):
       guardarlos en la cuenta o quitarlos de este dispositivo. Hay que responder: hasta entonces, nada se sube. -->
  <UiDialog :open="perfiles.length > 0" :title="t('cuenta.guardarTitulo')" symbol="users" tone="lime" split persistent :closable="false">
    {{ t(perfiles.length === 1 ? 'cuenta.guardarTextoUno' : 'cuenta.guardarTexto', { nombres }) }}
    <template #actions>
      <UiButton tone="neutral" :disabled="ocupado" @click="responder(false)">{{ t('cuenta.quitar') }}</UiButton>
      <UiButton :loading="ocupado" @click="responder(true)">{{ t('cuenta.guardar') }}</UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import type { Perfil } from '~/utils/perfiles'

const props = defineProps<{ perfiles: Perfil[] }>()
const emit = defineEmits<{ listo: [] }>()

const { t, locale } = useT()
const { resolver } = useCuenta()
const ocupado = ref(false)
const nombres = computed(() => new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(props.perfiles.map(p => p.nombre)))

async function responder(guardar: boolean) {
  ocupado.value = true
  await resolver(guardar, props.perfiles.map(p => p.id))
  ocupado.value = false
  emit('listo')
}
</script>
