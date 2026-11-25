<template>
  <!-- El filtro de fechas de una lista (tarea 023, Talleres): un solo control en la barra, como los demás filtros
       («Fecha: Esta semana»), con la misma forma que un UiSelect de barra. Al abrirse, los periodos y, abajo, «Entre
       dos fechas» con Desde y Hasta. Un periodo se elige y cierra; las fechas se escriben sin cerrar y el control dice
       cuáles son («Fecha: 1 dic 2026 – 15 dic 2026»). Elegir un periodo borra las fechas escritas; borrar las dos
       vuelve a «Todas». Los días que abarca cada periodo, en utils/listaTalleres. -->
  <RekaPopoverRoot v-model:open="abierto">
    <RekaPopoverTrigger as-child>
      <button type="button" class="field field-trigger w-auto whitespace-nowrap">
        <span class="truncate">{{ t('common.dates.label') }}: {{ etiqueta }}</span>
        <UiIcon name="chevron-down" />
      </button>
    </RekaPopoverTrigger>
    <RekaPopoverPortal>
      <RekaPopoverContent side="bottom" align="start" :side-offset="6" class="ui-listbox ui-listbox-floating max-h-none w-64">
        <p class="eyebrow ui-listbox-legend">{{ t('common.dates.label') }}</p>
        <button
          v-for="p in PERIODOS"
          :key="p"
          type="button"
          class="ui-option"
          :aria-selected="modelValue.periodo === p"
          @click="elegirPeriodo(p)"
        >
          <span class="truncate">{{ t(`common.dates.${p}`) }}</span>
          <UiIcon v-if="modelValue.periodo === p" name="check" class="size-4" />
        </button>
        <div class="mx-2 my-1.5 h-px bg-line" />
        <p class="eyebrow ui-listbox-legend">{{ t('common.dates.entre') }}</p>
        <div class="grid gap-3 px-3 pb-2.5 pt-1">
          <UiInput
            :id="`${uid}-desde`"
            :model-value="modelValue.desde"
            type="date"
            size="sm"
            :label="t('common.dates.desde')"
            :max="modelValue.hasta || undefined"
            @update:model-value="(v) => escribir('desde', v)"
          />
          <UiInput
            :id="`${uid}-hasta`"
            :model-value="modelValue.hasta"
            type="date"
            size="sm"
            :label="t('common.dates.hasta')"
            :min="modelValue.desde || undefined"
            @update:model-value="(v) => escribir('hasta', v)"
          />
        </div>
      </RekaPopoverContent>
    </RekaPopoverPortal>
  </RekaPopoverRoot>
</template>

<script setup lang="ts">
import type { FiltroFechas, Periodo } from '~/utils/listaTalleres'
import { PERIODOS } from '~/utils/listaTalleres'

const props = defineProps<{ modelValue: FiltroFechas }>()
const emit = defineEmits<{ 'update:modelValue': [valor: FiltroFechas] }>()

const { t, locale } = useT()
const uid = useId()
const abierto = ref(false)

const etiqueta = computed(() => {
  const { periodo, desde, hasta } = props.modelValue
  if (periodo !== 'elegir') return t(`common.dates.${periodo}`)
  if (desde && hasta) return desde === hasta ? fechaCorta(desde, locale.value) : `${fechaCorta(desde, locale.value)} – ${fechaCorta(hasta, locale.value)}`
  if (desde) return t('common.dates.desdeEl', { fecha: fechaCorta(desde, locale.value) })
  return t('common.dates.hastaEl', { fecha: fechaCorta(hasta, locale.value) })
})

function elegirPeriodo(periodo: Exclude<Periodo, 'elegir'>) {
  emit('update:modelValue', { periodo, desde: '', hasta: '' })
  abierto.value = false
}

function escribir(campo: 'desde' | 'hasta', valor: string) {
  const siguiente = { ...props.modelValue, [campo]: valor }
  emit('update:modelValue', { ...siguiente, periodo: siguiente.desde || siguiente.hasta ? 'elegir' : 'todas' })
}
</script>
