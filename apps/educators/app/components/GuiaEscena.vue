<template>
  <!-- Lo que dice la guía de una escena, para conducirla: sus secciones con texto, en el orden en que se conduce, como el
       panel «Guía» del runner. «No requiere» no se muestra. Una escena sin notas lo dice. -->
  <div class="flex flex-col gap-5">
    <p v-if="!secciones.length" class="ui-text">{{ t('guia.escenaSinNotas') }}</p>
    <div v-for="seccion in secciones" :key="seccion.campo">
      <p class="eyebrow mb-1.5">{{ t(`guia.${seccion.campo}`) }}</p>
      <p class="ui-text whitespace-pre-line">{{ seccion.texto }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EscenaGuia } from '~/utils/talleres'

const props = defineProps<{ escena: EscenaGuia }>()

const { t } = useT()
const CAMPOS = ['objective', 'description', 'material', 'questions', 'pedagogy', 'psychology', 'tips', 'notDoing', 'mechanic', 'science'] as const
const secciones = computed(() => CAMPOS
  .map(campo => ({ campo, texto: props.escena[campo]?.trim() ?? '' }))
  .filter(s => s.texto && !/^no requiere/i.test(s.texto)))
</script>
