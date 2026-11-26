<template>
  <!-- La cabecera de la semana y del mes: el rango («23 – 29 nov 2026», «noviembre de 2026») y, a la derecha, «Hoy» y
       anterior y siguiente, juntos y del alto de los demás controles. -->
  <div class="ui-panel-header flex-wrap">
    <h2 class="ui-title first-letter:uppercase" aria-live="polite">{{ rango }}</h2>
    <div class="flex items-center gap-3">
      <UiButton variant="outline" @click="hoy">{{ t('calendario.hoy') }}</UiButton>
      <div class="ui-group">
        <button type="button" class="ui-group-item" :aria-label="t('calendario.anterior')" :title="t('calendario.anterior')" @click="anterior">
          <UiIcon name="chevron-left" />
        </button>
        <button type="button" class="ui-group-item" :aria-label="t('calendario.siguiente')" :title="t('calendario.siguiente')" @click="siguiente">
          <UiIcon name="chevron-right" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { textoDelRango } from '~/utils/calendario'

const { t, locale } = useT()
const { fecha, vista, anterior, siguiente, hoy } = useCalendario()
const rango = computed(() => textoDelRango(fecha.value, vista.value, locale.value))
</script>
