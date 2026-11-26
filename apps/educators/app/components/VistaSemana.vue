<template>
  <!-- La semana, de lunes a domingo, en un card con su rango y para moverse. En pantallas anchas, siete columnas, una
       por día, con sus talleres en tarjetas (TallerTarjeta) y hoy en sol; nunca se desplaza de lado. En el teléfono y
       la tableta vertical, los siete días uno debajo de otro, con la misma fila de la vista Día. Tocar un taller abre su
       ficha. -->
  <section class="ui-panel overflow-hidden">
    <CalendarioRango />

    <div class="hidden grid-cols-7 lg:grid">
      <div
        v-for="dia in dias"
        :key="dia"
        :data-tone="dia === hoy ? 'sun' : undefined"
        class="flex min-w-0 flex-col border-r border-line last:border-r-0"
        :aria-label="fechaLarga(dia, locale)"
      >
        <header :class="['flex items-center gap-2 border-b border-line px-3 py-2.5', dia === hoy && 'bg-(--tone-wash)']">
          <span class="ui-day" :aria-current="dia === hoy ? 'date' : undefined">{{ Number(dia.slice(8)) }}</span>
          <span class="eyebrow">{{ diaCorto(dia, locale) }}</span>
          <span v-if="dia === hoy" class="eyebrow ml-auto text-(--tone-strong)">{{ t('calendario.hoy') }}</span>
        </header>
        <div class="flex min-h-80 flex-1 flex-col gap-2 p-2">
          <TallerTarjeta v-for="taller in porDia[dia] ?? []" :key="taller.id" :taller="taller" />
          <p v-if="!porDia[dia]?.length" class="py-8 text-center text-caption font-bold text-subtle">{{ t('calendario.sinTalleres') }}</p>
        </div>
      </div>
    </div>

    <div class="divide-y divide-line lg:hidden">
      <div v-for="dia in dias" :key="`l-${dia}`" :aria-label="fechaLarga(dia, locale)">
        <h3 :class="['eyebrow px-6 pt-4 first-letter:uppercase', dia === hoy && 'text-(--tone-strong)']" :data-tone="dia === hoy ? 'sun' : undefined">{{ nombreDelDia(dia, hoy, locale, palabras) }}</h3>
        <div v-if="porDia[dia]?.length" class="divide-y divide-line">
          <TallerFila v-for="taller in porDia[dia]" :key="taller.id" :taller="taller" :obvio="obvioDelDia(dia, hoy)" />
        </div>
        <p v-else class="px-6 pb-4 pt-2 text-caption font-bold text-subtle">{{ t('calendario.sinTalleres') }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { diasDeSemana } from '~/utils/calendario'
import { diaCorto, fechaLarga, nombreDelDia } from '~/utils/fechas'
import { isoDia, obvioDelDia } from '~/utils/talleres'
import type { Taller } from '~/utils/talleres'

defineProps<{ porDia: Record<string, Taller[]> }>()

const { t, locale } = useT()
const { fecha } = useCalendario()
const hoy = isoDia(new Date())
const dias = computed(() => diasDeSemana(fecha.value))
const palabras = computed(() => ({ hoy: t('calendario.hoy'), manana: t('talleres.manana'), ayer: t('talleres.ayer') }))
</script>
