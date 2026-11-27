<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <UiToaster />
</template>

<script setup lang="ts">
const { t, locale } = useT()

// Los textos propios del UI Kit salen del i18n de Educators (español e inglés).
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

// La versión nueva de la app instalada: el aviso con «Actualizar», nunca durante un taller en curso.
useActualizacionApp(() => ({ mensaje: t('kit.updateReady'), accion: t('kit.update') }), ruta => ruta.endsWith('/play'))

useHead({ htmlAttrs: { lang: locale }, titleTemplate: title => (title ? `${title} · ${t('app.name')}` : `PlayHub ${t('app.name')}`) })
</script>
