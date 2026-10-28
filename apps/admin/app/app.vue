<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <!-- Avisos de acciones, globales: una sola instancia para toda la app. -->
  <UiToaster :region-label="t('common.notifications')" />
</template>

<script setup lang="ts">
const { t } = useT()

// Los textos propios del UI Kit salen del i18n de Admin (español e inglés).
provideUiLabels(() => ({
  cancel: t('common.cancel'),
  close: t('common.close'),
  loading: t('table.loading'),
  empty: t('table.empty'),
  emptyFiltered: t('table.emptyFiltered'),
  search: t('table.searchPh'),
  all: t('common.all'),
  optional: `(${t('common.optional')})`,
  showing: (desde, hasta, total) => t('table.showing', { desde, hasta, total }),
}))

onMounted(() => {
  if (isSupabaseConfigured()) {
    const { fetchUser } = useAuth()
    fetchUser()
  }
})
</script>
