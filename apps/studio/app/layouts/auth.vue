<template>
  <!-- Espejo del layout de auth de admin: fondo gris frío, círculos de marca y card de 20px
       con shadow-auth. La UI de Studio es solo español, así que el copy va literal (en admin
       sale de i18n). -->
  <div class="min-h-screen bg-brand-bg flex items-center justify-center p-6 relative overflow-hidden">
    <!-- Círculos decorativos de marca -->
    <div class="absolute -top-36 -right-24 w-[420px] h-[420px] rounded-full bg-brand-primary/[0.05]" />
    <div class="absolute -bottom-40 -left-28 w-[480px] h-[480px] rounded-full bg-brand-secondary/[0.05]" />

    <div class="w-full max-w-[420px] relative">
      <div class="text-center mb-9">
        <div class="flex justify-center mb-5">
          <UiLogo :show-text="false" />
        </div>
        <h1 class="text-[28px] font-display font-semibold text-brand-dark tracking-[-0.01em]">
          StoryPlay Studio
        </h1>
        <p class="text-[15px] text-gray-500 mt-2">Gestor de storyboards y juegos educativos</p>
      </div>

      <div class="bg-white rounded-[20px] border border-gray-200 shadow-auth p-9">
        <slot />
      </div>
    </div>
  </div>
</template>
