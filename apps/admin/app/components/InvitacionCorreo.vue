<template>
  <!-- Cómo quedó el correo de una invitación pendiente (decisión 012), en una línea discreta: si el
       último intento falló, en coral con su motivo (falta que llegue); si salió o aún no se intentó,
       apagada. -->
  <p v-if="estado.tipo === 'fallido'" class="ui-caption break-words font-bold text-(--tone-strong)" data-tone="coral">{{ texto }}</p>
  <p v-else class="ui-caption">{{ texto }}</p>
</template>

<script setup lang="ts">
const props = defineProps<{ enviadoEn?: string | null, error?: string | null }>()

const { t, locale } = useT()

const estado = computed(() => estadoCorreo({ correo_enviado_en: props.enviadoEn, correo_error: props.error }))

const texto = computed(() => {
  const e = estado.value
  if (e.tipo === 'enviado') return t('invMail.stateSent', { fecha: fechaHora(e.enviadoEn, locale.value) })
  if (e.tipo === 'fallido') {
    return e.enviadoEn
      ? t('invMail.stateResendFailed', { motivo: e.motivo, fecha: fechaHora(e.enviadoEn, locale.value) })
      : t('invMail.stateFailed', { motivo: e.motivo })
  }
  return t('invMail.stateNone')
})
</script>
