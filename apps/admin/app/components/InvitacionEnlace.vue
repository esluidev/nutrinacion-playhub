<template>
  <!-- El enlace de una invitación recién creada (decisión 009: Admin no envía correos). Se muestra
       en un diálogo del kit con «Copiar enlace»; al cerrar, la página vuelve a su lista, donde el
       enlace se puede volver a copiar mientras la invitación siga pendiente. -->
  <UiDialog :open="!!token" :title="t('invLink.title')" symbol="mail" tone="grape" :closable="false" persistent>
    <p class="ui-text">{{ t('invLink.intro', { nombre: nombre || t('invLink.person') }) }}</p>

    <div v-if="token" class="mt-5 rounded-control border border-line bg-canvas px-5 py-4">
      <p class="eyebrow mb-1">{{ t('invLink.label') }}</p>
      <p class="select-all break-all font-mono text-caption font-semibold text-ink">{{ enlace }}</p>
      <p class="ui-caption mt-2">{{ t('invLink.note') }}</p>
    </div>

    <template #actions>
      <UiButton variant="outline" @click="emit('done')">{{ t('invLink.done') }}</UiButton>
      <UiButton icon="copy" @click="copiar">{{ t('invLink.copy') }}</UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
const props = defineProps<{ token: string | null, nombre?: string | null }>()
const emit = defineEmits<{ done: [] }>()

const { t } = useT()
const { toast } = useToast()

const enlace = computed(() => (props.token ? enlaceInvitacion(props.token) : ''))

async function copiar() {
  if (await copiarTexto(enlace.value)) toast.success(t('invLink.copied'))
  else toast.error(t('invLink.copyFailed'))
}
</script>
