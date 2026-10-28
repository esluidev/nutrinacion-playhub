<template>
  <!-- Estado terminal, no inicial: al registrarte la invitación SIEMPRE te engancha a algo
       (y el CHECK de 0003 lo garantiza). Se llega aquí si te removieron de todo después.
       Color: sol (a la espera de un acceso); invitaciones es un enlace (cielo); salir, coral. -->
  <div class="mx-auto max-w-lg py-16 text-center">
    <UiSymbol icon="alert" tone="sun" class="mx-auto mb-4" />
    <h1 class="ui-title mb-2">{{ t('ctx.noAccessTitle') }}</h1>
    <p class="ui-text mb-6">{{ t('ctx.noAccessText') }}</p>

    <div class="flex items-center justify-center gap-3 text-body">
      <NuxtLink to="/invitaciones" data-tone="sky" class="ui-link">
        {{ t('inbox.title') }}
      </NuxtLink>
      <span class="text-subtle" aria-hidden="true">·</span>
      <button type="button" data-tone="coral" class="ui-link" @click="salir">
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
