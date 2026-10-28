<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <UiToaster />
</template>

<script setup lang="ts">
const { t, locale } = useT()

// Textos del UI Kit en el idioma de Educators.
provideUiLabels(() => (locale.value === 'en'
  ? {
      cancel: 'Cancel', close: 'Close', loading: 'Loading…', optional: '(optional)', search: 'Search…', select: 'Select…',
      retry: 'Retry', runner: 'Workshop', runnerFailed: 'The workshop could not be opened', runnerFailedText: 'Check the connection and try again.',
    }
  : {}))

useHead({ htmlAttrs: { lang: locale }, titleTemplate: title => (title ? `${title} · PlayHub` : `PlayHub ${t('app.name')}`) })
</script>
