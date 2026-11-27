<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <UiToaster />
</template>

<script setup lang="ts">
const { t, locale } = useT()

// Los textos propios del UI Kit salen del i18n de la app (español e inglés).
provideUiLabels(() => ({
  cancel: t('kit.cancel'),
  close: t('kit.close'),
  loading: t('kit.loading'),
  optional: t('kit.optional'),
  search: t('kit.search'),
  select: t('kit.select'),
  retry: t('kit.retry'),
  runner: t('kit.runner'),
  runnerFailed: t('kit.runnerFailed'),
  runnerFailedText: t('kit.runnerFailedText'),
}))

// La versión nueva de la app instalada: el aviso con «Actualizar», nunca mientras se juega.
useActualizacionApp(() => ({ mensaje: t('kit.updateReady'), accion: t('kit.update') }), ruta => ruta.startsWith('/jugar'))

useHead({ htmlAttrs: { lang: locale }, titleTemplate: title => (title ? `${title} · ${t('app.name')}` : t('app.name')) })
</script>
