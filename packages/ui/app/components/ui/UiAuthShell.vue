<template>
  <!-- La entrada de cada app, la misma en Admin, Player y Educators: el logo con el nombre de la
       app (como en su barra lateral) y una tarjeta con título, una línea de texto, los campos y
       «Entrar». Siempre en densidad táctil, con campos y botón del tamaño normal (48): mide igual
       en las tres apps, y los enlaces de invitación y de recuperación se abren casi siempre en el
       teléfono. En `lg` los campos quedan grandes para sus etiquetas. -->
  <main class="ui-auth" data-density="touch">
    <div class="ui-auth-box">
      <div class="mb-8 flex justify-center"><UiLogo size="lg" :label="label" /></div>
      <div class="ui-panel ui-panel-body"><slot /></div>
    </div>
  </main>
</template>

<script setup lang="ts">
// `label`: el nombre de la app (Admin, Player, Educadores).
defineProps<{ label: string }>()
</script>
