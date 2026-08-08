<template>
  <!-- Misma geometría, sombra y tratamiento tipográfico que el logo de admin. El cuadro
       queda PÚRPURA a propósito: es el acento que admin reserva para el operador, y así las
       dos apps se leen como el mismo sistema sin volverse indistinguibles de un vistazo. -->
  <div class="flex items-center gap-[11px]">
    <div
      :class="[
        'rounded-[11px] bg-brand-purple shadow-btn flex items-center justify-center shrink-0',
        size === 'lg' ? 'w-[52px] h-[52px] rounded-[14px]' : 'w-[38px] h-[38px]',
      ]"
    >
      <span
        :class="[
          'text-white font-display font-semibold leading-none',
          size === 'lg' ? 'text-[26px]' : 'text-[19px]',
        ]"
      >S</span>
    </div>
    <div v-if="showText" class="min-w-0">
      <p class="font-display font-semibold text-[17px] text-brand-dark leading-[1.1]">StoryPlay</p>
      <p class="text-[10px] font-bold tracking-[0.12em] uppercase text-gray-400 mt-px">Studio</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  showText?: boolean
  size?: 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  showText: true,
  size: 'md',
})
</script>
