<template>
  <!-- Una unidad de estudio: su título y su descripción arriba y, en un card, sus juegos en su orden. -->
  <div v-if="unidad" class="flex flex-col">
    <UiPageHeader :title="textoEn(unidad.titulo, locale)" :description="textoEn(unidad.descripcion, locale) || undefined" />
    <section class="ui-panel">
      <div class="rejilla-juegos ui-panel-body">
        <TarjetaStoryboard v-for="s in juegos" :key="s.clave" :storyboard="s" />
      </div>
    </section>
  </div>
  <div v-else-if="cargando" class="grid place-items-center py-16"><UiSpinner /></div>
</template>

<script setup lang="ts">
import { textoEn } from '~/utils/catalogo'
import type { StoryboardHogar } from '~/utils/catalogo'

const { locale } = useT()
const { catalogo, cargando } = useCatalogo()
const route = useRoute()
const unidad = computed(() => catalogo.value.unidades.find(u => String(u.id) === route.params.id) ?? null)
const juegos = computed(() => (unidad.value?.storyboards ?? [])
  .map(clave => catalogo.value.storyboards.find(s => s.clave === clave))
  .filter((s): s is StoryboardHogar => Boolean(s)))
useHead({ title: () => (unidad.value ? textoEn(unidad.value.titulo, locale.value) : '') })
</script>
