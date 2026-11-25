<template>
  <!-- Una sección de «Nuevo Taller» (tarea 023): su marca (check lima si está completa, su número si no), su título y, a la
       derecha, su acción («Cambiar») o lo que le falta. Lo que falta va en gris mientras se llena y en coral después de
       pulsar «Publicar» (lo que falta, DESIGN.md «Roles de color»). Su contenido va debajo. -->
  <section :id="`seccion-${id}`" class="scroll-mt-6 px-6 py-5">
    <div class="mb-4 flex items-center gap-3">
      <span :data-tone="completa ? 'lime' : 'night'" class="ui-dot size-7 shrink-0 text-caption">
        <UiIcon v-if="completa" name="check" class="size-4" />
        <template v-else>{{ numero }}</template>
      </span>
      <h2 class="ui-title min-w-0 flex-1">{{ titulo }}</h2>
      <slot name="accion">
        <span
          v-if="!completa && falta"
          :data-tone="marcar ? 'coral' : undefined"
          :class="['text-right text-caption font-bold', marcar ? 'text-(--tone-strong)' : 'text-muted']"
        >{{ falta }}</span>
      </slot>
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  id: string
  numero: number
  titulo: string
  completa: boolean
  falta?: string
  // Ya se pulsó «Publicar»: lo que falta, en coral.
  marcar?: boolean
}>()
</script>
