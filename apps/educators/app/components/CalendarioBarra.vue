<template>
  <!-- Barra de la app original: el rango con anterior/siguiente a la izquierda; Hoy, el calendario
       y el cambio Semana/Mes a la derecha. Todo mide lo mismo y comparte la base del kit. -->
  <div class="mb-4 flex flex-wrap items-center gap-3">
    <div class="ui-group grow sm:grow-0">
      <button type="button" class="ui-group-item" :aria-label="t('calendario.anterior')" @click="anterior">
        <UiIcon name="chevron-left" />
      </button>
      <span class="ui-group-label flex-1 justify-center first-letter:uppercase sm:min-w-56" aria-live="polite">{{ rango }}</span>
      <button type="button" class="ui-group-item" :aria-label="t('calendario.siguiente')" @click="siguiente">
        <UiIcon name="chevron-right" />
      </button>
    </div>

    <div class="flex items-center gap-3 sm:ml-auto">
      <UiButton variant="outline" @click="hoy">{{ t('calendario.hoy') }}</UiButton>
      <div ref="ancla" class="sm:relative">
        <UiButton
          variant="outline"
          icon="calendar"
          icon-only
          :label="t('calendario.elegir')"
          :aria-expanded="selector"
          @click="selector = !selector"
        />
        <SelectorFecha
          v-if="selector"
          class="fixed inset-x-4 top-36 z-40 mx-auto sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2"
          :fecha="fecha"
          :con-talleres="conTalleres"
          @elegir="elegir"
        />
      </div>
      <UiTabs v-model="vistaModel" :items="vistas" :label="t('calendario.vista')" fit />
    </div>
  </div>
</template>

<script setup lang="ts">
import { textoDelRango } from '~/utils/calendario'
import type { VistaCalendario } from '~/utils/calendario'

defineProps<{ conTalleres: Set<string> }>()

const { t, locale } = useT()
const { fecha, vista, anterior, siguiente, hoy, irA } = useCalendario()

const rango = computed(() => textoDelRango(fecha.value, vista.value, locale.value))
const vistas = computed(() => [
  { value: 'semana', label: t('calendario.semana') },
  { value: 'mes', label: t('calendario.mes') },
])
// Puente tipado: UiTabs habla en string; la vista es una unión cerrada.
const vistaModel = computed({
  get: () => vista.value as string,
  set: v => (vista.value = v as VistaCalendario),
})

const selector = ref(false)
const ancla = ref<HTMLElement | null>(null)
function elegir(iso: string) {
  irA(iso)
  selector.value = false
}
function fuera(e: PointerEvent) {
  if (selector.value && ancla.value && !ancla.value.contains(e.target as Node)) selector.value = false
}
function escape(e: KeyboardEvent) {
  if (e.key === 'Escape') selector.value = false
}
onMounted(() => {
  document.addEventListener('pointerdown', fuera)
  document.addEventListener('keydown', escape)
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', fuera)
  document.removeEventListener('keydown', escape)
})
</script>
