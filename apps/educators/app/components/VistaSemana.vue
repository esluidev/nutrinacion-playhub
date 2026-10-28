<template>
  <div class="flex flex-col md:min-h-0 md:flex-1">
    <!-- Tableta y escritorio: como en la app original, un solo panel con las siete columnas separadas
         por líneas. Nunca pasa del alto disponible: si un día tiene más talleres de los que caben,
         su columna se desplaza por dentro. Si las columnas no caben a lo ancho, se desplazan en
         horizontal (como en la tableta del original) y la semana se mueve sola solo si hoy queda
         fuera de la vista. -->
    <div class="ui-panel hidden overflow-hidden md:flex md:min-h-0 md:flex-1 md:flex-col">
      <div ref="carril" class="grid min-h-0 flex-1 snap-x grid-cols-[repeat(7,minmax(11.5rem,1fr))] grid-rows-[minmax(0,1fr)] overflow-x-auto">
        <section
          v-for="dia in dias"
          :key="dia"
          :data-dia="dia"
          :data-tone="dia === hoy ? 'sun' : undefined"
          class="flex min-h-0 snap-start flex-col border-r border-line last:border-r-0"
          :aria-label="fechaLarga(dia, locale)"
        >
          <header :class="['flex shrink-0 items-center gap-2 border-b border-line px-3 py-2.5', dia === hoy && 'bg-(--tone-wash)']">
            <span class="ui-day" :aria-current="dia === hoy ? 'date' : undefined">{{ aFecha(dia).getDate() }}</span>
            <span class="eyebrow">{{ diaCorto(dia, locale) }}</span>
            <span v-if="dia === hoy" class="eyebrow ml-auto text-(--tone-strong)">{{ t('calendario.hoy') }}</span>
          </header>
          <div class="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-2.5">
            <TallerTarjeta v-for="taller in porDia[dia] ?? []" :key="taller.id" :taller="taller" />
            <p v-if="!porDia[dia]?.length" class="py-8 text-center text-caption font-bold text-subtle">{{ t('calendario.sinTalleres') }}</p>
          </div>
        </section>
      </div>
    </div>

    <!-- Teléfono: el mismo panel como agenda vertical, un día debajo de otro -->
    <div class="ui-panel overflow-hidden md:hidden">
      <section
        v-for="dia in dias"
        :key="`m-${dia}`"
        :data-tone="dia === hoy ? 'sun' : undefined"
        class="border-b border-line last:border-b-0"
        :aria-label="fechaLarga(dia, locale)"
      >
        <header :class="['flex items-center gap-2.5 px-3 py-2.5', dia === hoy && 'bg-(--tone-wash)']">
          <span class="ui-day" :aria-current="dia === hoy ? 'date' : undefined">{{ aFecha(dia).getDate() }}</span>
          <span class="eyebrow first-letter:uppercase">{{ fechaLarga(dia, locale) }}</span>
          <span v-if="dia === hoy" class="eyebrow ml-auto text-(--tone-strong)">{{ t('calendario.hoy') }}</span>
        </header>
        <div v-if="porDia[dia]?.length" class="space-y-2.5 px-2.5 pb-2.5">
          <TallerTarjeta v-for="taller in porDia[dia]" :key="taller.id" :taller="taller" />
        </div>
        <p v-else class="px-3 pb-3 text-caption font-bold text-subtle">{{ t('calendario.sinTalleres') }}</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { aFecha, diaCorto } from '~/utils/calendario'
import { isoDia } from '~/utils/talleres'
import type { Taller } from '~/utils/talleres'

const props = defineProps<{ dias: string[], porDia: Record<string, Taller[]> }>()

const { t, locale } = useT()
const hoy = isoDia(new Date())
const carril = ref<HTMLElement | null>(null)

// Si la semana no cabe y hoy queda fuera de la vista, se desplaza hasta hoy; en otra semana, al lunes.
function alinear() {
  const el = carril.value
  if (!el || el.scrollWidth <= el.clientWidth) return
  if (!props.dias.includes(hoy)) return el.scrollTo({ left: 0 })
  const col = el.querySelector<HTMLElement>(`[data-dia="${hoy}"]`)
  if (!col) return
  const ini = col.offsetLeft
  if (ini < el.scrollLeft || ini + col.offsetWidth > el.scrollLeft + el.clientWidth) el.scrollTo({ left: ini })
}
onMounted(alinear)
watch(() => props.dias[0], () => nextTick(alinear))
</script>
