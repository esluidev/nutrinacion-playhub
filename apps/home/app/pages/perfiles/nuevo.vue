<template>
  <!-- Crear un perfil. La primera vez, en la tarjeta de la entrada, como el país (con «Ya Tengo Cuenta» para entrar en
       vez de crearlo); después, desde «¿Quién juega?», con la barra de la familia y el formulario en su card. -->
  <NuxtLayout :name="primeraVez ? 'entrada' : 'familia'">
    <PerfilForm v-if="primeraVez" />
    <div v-else class="ui-panel ui-panel-body mx-auto w-full max-w-md">
      <PerfilForm />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { t } = useT()
const { perfiles } = useHogar()
const primeraVez = computed(() => !perfiles.value.length)
useHead({ title: () => t('perfil.nuevo') })
</script>
