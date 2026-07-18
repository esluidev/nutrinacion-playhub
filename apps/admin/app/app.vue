<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <!-- Feedback de acciones, global: una sola instancia para toda la app. -->
  <UiToaster />
</template>

<script setup lang="ts">
onMounted(() => {
  if (isSupabaseConfigured()) {
    const { fetchUser } = useAuth()
    fetchUser()
  }
})
</script>
