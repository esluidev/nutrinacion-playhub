<template>
  <!-- El menú ⋮ de una ficha (tarea 023): lo que se usa poco, fuera de la cabecera. Igual en el taller, la jornada y el
       programa: las acciones en neutro y, al final, separadas por una línea, las que borran en coral («Eliminar
       Taller»). Una que hoy no cabe se ve deshabilitada y `ayuda`, abajo, dice por qué. El coral vuelve en su
       confirmación (`UiConfirmDialog`). Reka da el menú accesible: flechas, Escape y foco. Dentro de un diálogo (el panel
       de la jornada), el menú se abre dentro de él: el <dialog> nativo va en la capa superior y taparía uno en <body>. -->
  <RekaDropdownMenuRoot v-model:open="abierto">
    <RekaDropdownMenuTrigger as-child>
      <UiButton ref="boton" variant="outline" icon="more-vertical" icon-only :label="label ?? t('common.moreActions')" />
    </RekaDropdownMenuTrigger>
    <RekaDropdownMenuPortal :to="dialogo ?? 'body'">
      <RekaDropdownMenuContent align="end" :side-offset="6" class="ui-listbox ui-listbox-floating w-64">
        <RekaDropdownMenuItem
          v-for="a in normales"
          :key="a.key"
          :disabled="a.disabled"
          class="ui-option justify-start gap-2.5"
          @select="emit('select', a.key)"
        >
          <UiIcon :name="a.icon" class="size-4 shrink-0 text-subtle" />
          {{ a.label }}
        </RekaDropdownMenuItem>
        <RekaDropdownMenuSeparator v-if="normales.length && peligrosas.length" class="mx-2 my-1 h-px bg-line" />
        <RekaDropdownMenuItem
          v-for="a in peligrosas"
          :key="a.key"
          :disabled="a.disabled"
          data-tone="coral"
          class="ui-option justify-start gap-2.5 text-(--tone-strong)"
          @select="emit('select', a.key)"
        >
          <UiIcon :name="a.icon" class="size-4 shrink-0" />
          {{ a.label }}
        </RekaDropdownMenuItem>
        <p v-if="ayuda" class="ui-caption mx-3 mb-2 mt-1.5">{{ ayuda }}</p>
      </RekaDropdownMenuContent>
    </RekaDropdownMenuPortal>
  </RekaDropdownMenuRoot>
</template>

<script setup lang="ts">
import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'

export interface AccionDelMenu {
  key: string
  label: string
  icon: UiIconName
  // Borra algo: va al final, separada y en coral.
  peligro?: boolean
  disabled?: boolean
}

const props = defineProps<{
  acciones: AccionDelMenu[]
  label?: string
  ayuda?: string
}>()
const emit = defineEmits<{ select: [key: string] }>()

const { t } = useT()
const abierto = ref(false)
// El diálogo en el que está, si está en uno.
const boton = ref<{ $el?: Element } | null>(null)
const dialogo = ref<HTMLElement | null>(null)
onMounted(() => {
  dialogo.value = boton.value?.$el?.closest?.('dialog') ?? null
})
const normales = computed(() => props.acciones.filter(a => !a.peligro))
const peligrosas = computed(() => props.acciones.filter(a => a.peligro))
</script>
