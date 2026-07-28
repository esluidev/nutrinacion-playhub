<template>
  <div class="flex items-center gap-[11px]">
    <div
      :class="[
        'rounded-[11px] bg-brand-primary shadow-btn flex items-center justify-center shrink-0',
        size === 'lg' ? 'w-[52px] h-[52px] rounded-[14px]' : 'w-[38px] h-[38px]',
      ]"
    >
      <span
        :class="[
          'text-white font-display font-semibold leading-none',
          size === 'lg' ? 'text-[26px]' : 'text-[19px]',
        ]"
      >N</span>
    </div>
    <div v-if="showText" class="min-w-0">
      <p class="font-display font-semibold text-[17px] text-brand-dark leading-[1.1]">Nutrinación</p>
      <p class="text-[10px] font-bold tracking-[0.12em] uppercase text-gray-400 mt-px">Workshops</p>
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
