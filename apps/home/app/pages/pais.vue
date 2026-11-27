<template>
  <!-- La primera vez: dónde está la familia. Con el país, el catálogo trae lo que está disponible ahí. Se cambia en
       Ajustes. -->
  <div>
    <h1 class="ui-title">{{ t('pais.titulo') }}</h1>
    <UiAlert v-if="error" tone="warning" :title="t('pais.error')" class="mt-6">
      <UiButton class="mt-3" variant="outline" icon="retry" @click="cargar">{{ t('inicio.reintentar') }}</UiButton>
    </UiAlert>
    <div class="mt-6 space-y-5">
      <UiSelect v-model="elegido" :options="opciones" :label="t('pais.campo')" />
      <UiButton block :disabled="!elegido" @click="continuar">{{ t('pais.continuar') }}</UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'entrada' })

const { t, locale } = useT()
const { pais, elegirPais, perfiles } = useHogar()
const { paises, error, cargar } = usePaises()
useHead({ title: () => t('pais.titulo') })

const elegido = ref<string | null>(pais.value)
const opciones = computed(() => (paises.value ?? [])
  .map(p => ({ value: p.codigo, label: `${p.bandera ?? ''} ${p.nombre[locale.value] ?? p.nombre.es ?? p.codigo}`.trim() }))
  .sort((a, b) => a.label.localeCompare(b.label, locale.value)))

function continuar() {
  if (!elegido.value) return
  elegirPais(elegido.value)
  navigateTo(perfiles.value.length ? '/' : '/perfiles/nuevo')
}
</script>
