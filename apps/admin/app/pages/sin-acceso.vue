<template>
  <!-- Estado terminal, no inicial: al registrarte la invitación SIEMPRE te engancha a algo
       (y el CHECK de 0003 lo garantiza). Se llega aquí si te removieron de todo después. -->
  <div class="max-w-lg mx-auto py-16 text-center">
    <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
      </svg>
    </div>
    <h1 class="text-xl font-display font-bold text-brand-dark mb-2">{{ t('ctx.noAccessTitle') }}</h1>
    <p class="text-sm text-gray-500 mb-6">{{ t('ctx.noAccessText') }}</p>

    <div class="flex items-center justify-center gap-3">
      <NuxtLink to="/invitaciones" class="text-sm text-brand-primary-600 font-semibold hover:underline">
        {{ t('inbox.title') }}
      </NuxtLink>
      <span class="text-gray-200">·</span>
      <button class="text-sm text-gray-500 font-semibold hover:underline" @click="salir">
        {{ t('nav.signOut') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { t } = useT()

async function salir() {
  if (isSupabaseConfigured()) {
    const { signOut } = useAuth()
    await signOut()
  }
  else {
    navigateTo('/login')
  }
}
</script>
