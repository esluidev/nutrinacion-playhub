<template>
  <!-- «¿Quién juega?», con la barra de la familia (lo del adulto está en su menú): los perfiles de este dispositivo,
       cada uno con su avatar y su nombre (tocarlo es jugar con él), y al final «Agregar». Editar un perfil se hace
       dentro, desde el menú de quien juega (Luis, 2026-11-27). Sale al abrir la app y al cambiar de perfil. -->
  <div class="ui-panel ui-panel-body mx-auto w-full max-w-md">
    <h1 class="ui-title">{{ t('quien.titulo') }}</h1>
    <div class="perfiles mt-6">
      <button v-for="perfil in perfiles" :key="perfil.id" type="button" class="perfil-elegir" @click="jugarCon(perfil.id)">
        <UiAvatar :name="perfil.nombre" :src="dibujoDe(perfil.avatar)" :tone="tonoDe(perfil.avatar)" size="xl" />
        <span class="w-full truncate">{{ perfil.nombre }}</span>
      </button>
      <NuxtLink to="/perfiles/nuevo" class="perfil-elegir">
        <span class="perfil-agregar"><UiIcon name="plus" class="size-8" /></span>
        <span>{{ t('quien.agregar') }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'familia' })

const { t } = useT()
const { perfiles, elegir } = useHogar()
useHead({ title: () => t('quien.titulo') })

function jugarCon(id: string) {
  elegir(id)
  navigateTo('/inicio')
}
</script>
