<template>
  <!-- «País e idioma» del dispositivo, en el menú de la familia: el país, con el que se trae el catálogo, y el idioma de
       la app. Instalarla está en el mismo menú, donde el navegador la instala con un toque. -->
  <div class="flex flex-col">
    <UiPageHeader :title="t('ajustes.titulo')" />
    <div class="ui-panel max-w-xl">
      <div class="ui-panel-body space-y-5">
        <UiSelect :model-value="pais" :options="opcionesPais" :label="t('ajustes.pais')" @update:model-value="(v) => v && elegirPais(String(v))" />
        <UiSelect :model-value="locale" :options="idiomas" :label="t('ajustes.idioma')" @update:model-value="(v) => setLocale(v as Locale)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Locale } from '~/i18n/messages'

definePageMeta({ layout: 'familia' })

const { t, locale, setLocale } = useT()
const { pais, elegirPais } = useHogar()
const { paises } = usePaises()
useHead({ title: () => t('ajustes.titulo') })

const opcionesPais = computed(() => (paises.value ?? [])
  .map(p => ({ value: p.codigo, label: `${p.bandera ?? ''} ${p.nombre[locale.value] ?? p.nombre.es ?? p.codigo}`.trim() }))
  .sort((a, b) => a.label.localeCompare(b.label, locale.value)))
const idiomas = computed(() => (['es', 'en'] as const).map(v => ({ value: v, label: t(`idioma.${v}`) })))
</script>
