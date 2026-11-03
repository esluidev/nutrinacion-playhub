<template>
  <!-- La vista principal: un día. Si es hoy, el siguiente taller va en grande con sus dos acciones a
       la vista, y debajo lo que falta cerrar. Al lado (debajo en teléfono y tableta vertical), lo
       que viene después de ese día, día por día. -->
  <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
    <div class="space-y-8">
      <section :aria-label="fechaLarga(fecha, locale)">
        <TallerDestacado v-if="dia.siguiente" :taller="dia.siguiente" />
        <div v-if="dia.delDia.length" :class="['grid gap-3 sm:grid-cols-2', dia.siguiente && 'mt-3']">
          <TallerTarjeta v-for="taller in dia.delDia" :key="taller.id" :taller="taller" :obvio="obvio" />
        </div>
        <div v-if="!dia.siguiente && !dia.delDia.length" class="ui-panel">
          <UiEmptyState
            icon="calendar"
            :title="talleres.length ? (fecha === hoy ? t('talleres.vacioHoy') : t('talleres.vacioDia')) : t('talleres.vacio')"
            :text="talleres.length ? undefined : t('talleres.vacioTexto')"
          />
        </div>
      </section>

      <!-- Ya pasaron y les falta el feedback: en coral, como en Admin (UI_SESSION_TONES). Se ve en hoy. -->
      <section v-if="fecha === hoy && dia.porCerrar.length">
        <h2 class="ui-title flex items-center gap-2.5">{{ t('talleres.porCerrar') }}<span class="filter-count">{{ dia.porCerrar.length }}</span></h2>
        <p class="ui-caption mb-3 mt-0.5">{{ t('talleres.porCerrarTexto') }}</p>
        <div class="grid gap-3 sm:grid-cols-2">
          <TallerTarjeta v-for="taller in dia.porCerrar" :key="taller.id" :taller="taller" />
        </div>
      </section>
    </div>

    <section>
      <h2 class="ui-title mb-3 flex items-center gap-2.5">
        {{ t('talleres.proximos') }}<span v-if="numDespues" class="filter-count">{{ numDespues }}</span>
      </h2>
      <div class="space-y-5">
        <div v-for="d in dia.despues.slice(0, dias)" :key="d.dia">
          <h3 class="eyebrow mb-2 first-letter:uppercase">{{ nombreDelDia(d.dia) }}</h3>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <TallerTarjeta v-for="taller in d.talleres" :key="taller.id" :taller="taller" obvio="proximo" />
          </div>
        </div>
      </div>
      <UiButton v-if="dia.despues.length > dias" variant="outline" block class="mt-4" @click="dias += 5">{{ t('talleres.verMas') }}</UiButton>
      <p v-if="!dia.despues.length" class="ui-panel ui-panel-body ui-text">{{ t('talleres.sinProximos') }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { fechaLarga } from '~/utils/fechas'
import { agenda, diaRelativo, isoDia } from '~/utils/talleres'
import type { EstadoTaller, Taller } from '~/utils/talleres'

const props = defineProps<{ fecha: string, talleres: Taller[] }>()

const { t, locale } = useT()
const hoy = isoDia(new Date())
const dia = computed(() => agenda(props.talleres, props.fecha))
// El estado que ya dice el día (hoy o próximo) no se repite en cada tarjeta.
const obvio = computed<EstadoTaller | undefined>(() => (props.fecha === hoy ? 'hoy' : props.fecha > hoy ? 'proximo' : undefined))
const numDespues = computed(() => dia.value.despues.reduce((n, d) => n + d.talleres.length, 0))

// «Mañana · miércoles, 4 de noviembre»; los demás días, solo la fecha.
function nombreDelDia(iso: string) {
  const fecha = fechaLarga(iso, locale.value)
  return iso === diaRelativo(1) ? `${t('talleres.manana')} · ${fecha}` : fecha
}

// Lo que viene después puede ser largo: los primeros días y «Ver más». Al cambiar de día, vuelve a empezar.
const dias = ref(5)
watch(() => props.fecha, () => (dias.value = 5))
</script>
