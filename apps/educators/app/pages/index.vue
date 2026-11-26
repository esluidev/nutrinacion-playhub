<template>
  <!-- Mis talleres: lo que la organización le asignó (el educador no planea), en tres vistas que se eligen en la
       cabecera. **Día**, la de entrada: arriba lo de hoy; después lo que falta reportar, los próximos día por día y
       los anteriores. **Semana** y **Mes** (VistaSemana, VistaMes): su agenda completa, para moverse por semanas o meses.
       Tocar un taller, en cualquier vista, abre su ficha: ahí están la guía y los botones de su momento (Ensayar antes
       de su día, Ejecutar el día del taller y Reportar después). En el mes, tocar un día muestra debajo sus talleres.
       Cada sección es un card con su encabezado (`ui-panel-header`), sin títulos sueltos encima. Ocupa el mismo ancho
       que la cabecera. -->
  <div class="flex flex-col">
    <UiPageHeader :title="t('talleres.saludo', { nombre: educador?.nombre ?? '' })" :description="fechaDeHoy">
      <template #actions>
        <UiTabs v-model="vistaModel" :items="vistas" :label="t('calendario.vista')" fit />
      </template>
    </UiPageHeader>
    <UiAlert v-if="error" tone="warning" :title="t('talleres.error')" class="mb-6">
      <UiButton class="mt-3" variant="outline" icon="retry" @click="cargar">{{ t('talleres.reintentar') }}</UiButton>
    </UiAlert>
    <div v-if="cargando" class="grid place-items-center py-16"><UiSpinner /></div>
    <VistaSemana v-else-if="vista === 'semana'" :por-dia="porDia" />
    <VistaMes v-else-if="vista === 'mes'" :por-dia="porDia" />
    <div v-else class="space-y-6">
      <section class="ui-panel overflow-hidden">
        <div class="ui-panel-header">
          <h2 class="ui-title flex items-center gap-2.5">{{ t('talleres.hoy') }}<span v-if="lista.hoy.length" class="filter-count">{{ lista.hoy.length }}</span></h2>
        </div>
        <div v-if="lista.hoy.length" class="divide-y divide-line">
          <TallerFila v-for="taller in lista.hoy" :key="taller.id" :taller="taller" obvio="hoy" />
        </div>
        <p v-else-if="talleres.length" class="ui-panel-body ui-text">{{ t('talleres.vacioHoy') }}</p>
        <UiEmptyState v-else icon="calendar" :title="t('talleres.vacio')" :text="t('talleres.vacioTexto')" />
      </section>

      <!-- Ya pasaron y falta reportarlos, del más reciente al más antiguo -->
      <section v-if="lista.porReportar.length" class="ui-panel overflow-hidden">
        <div class="ui-panel-header">
          <h2 class="ui-title flex items-center gap-2.5">{{ t('talleres.porCerrar') }}<span class="filter-count">{{ lista.porReportar.length }}</span></h2>
        </div>
        <div class="divide-y divide-line">
          <TallerFila v-for="taller in lista.porReportar" :key="taller.id" :taller="taller" obvio="por_cerrar" con-fecha />
        </div>
      </section>

      <section v-if="lista.proximos.length" class="ui-panel overflow-hidden">
        <div class="ui-panel-header">
          <h2 class="ui-title flex items-center gap-2.5">{{ t('talleres.proximos') }}<span class="filter-count">{{ numProximos }}</span></h2>
        </div>
        <div class="divide-y divide-line">
          <div v-for="d in lista.proximos.slice(0, diasProximos)" :key="d.dia">
            <h3 class="eyebrow px-6 pt-4 first-letter:uppercase">{{ nombreDelDia(d.dia) }}</h3>
            <div class="divide-y divide-line">
              <TallerFila v-for="taller in d.talleres" :key="taller.id" :taller="taller" obvio="proximo" />
            </div>
          </div>
        </div>
        <div v-if="lista.proximos.length > diasProximos" class="ui-panel-footer">
          <UiButton variant="outline" block @click="diasProximos += 5">{{ t('talleres.verMas') }}</UiButton>
        </div>
      </section>

      <!-- Los que ya pasaron y no falta reportar (reportados o cancelados), del más reciente al más antiguo -->
      <section v-if="lista.anteriores.length" class="ui-panel overflow-hidden">
        <div class="ui-panel-header">
          <h2 class="ui-title">{{ t('talleres.anteriores') }}</h2>
        </div>
        <div class="divide-y divide-line">
          <div v-for="d in lista.anteriores.slice(0, diasAnteriores)" :key="d.dia">
            <h3 class="eyebrow px-6 pt-4 first-letter:uppercase">{{ nombreDelDia(d.dia) }}</h3>
            <div class="divide-y divide-line">
              <TallerFila v-for="taller in d.talleres" :key="taller.id" :taller="taller" />
            </div>
          </div>
        </div>
        <div v-if="lista.anteriores.length > diasAnteriores" class="ui-panel-footer">
          <UiButton variant="outline" block @click="diasAnteriores += 5">{{ t('talleres.verMas') }}</UiButton>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VistaCalendario } from '~/utils/calendario'
import { fechaLarga, nombreDelDia as nombreDia } from '~/utils/fechas'
import { diaRelativo, portada, talleresPorDia } from '~/utils/talleres'

const { t, locale } = useT()
const { educador } = useSesion()
const { talleres, cargando, error, cargar, actualizarHoy } = useTalleres()
const { vista } = useCalendario()
const vistas = computed(() => [
  { value: 'dia', label: t('calendario.dia') },
  { value: 'semana', label: t('calendario.semana') },
  { value: 'mes', label: t('calendario.mes') },
])
// Puente tipado: UiTabs habla en string; la vista es una unión cerrada.
const vistaModel = computed({
  get: () => vista.value as string,
  set: v => (vista.value = v as VistaCalendario),
})

// Al volver se piden otra vez, sin tapar lo que ya se ve: así aparece lo que Admin asignó, movió o
// canceló mientras tanto.
onMounted(() => {
  if (!cargando.value) void cargar()
})

// Mientras está a la vista, cada minuto, solo los de hoy (unos pocos KB): la lista abierta en el aula muestra lo que
// Admin canceló, movió o asignó para hoy sin que el educador toque nada. Con la pantalla bloqueada o en otra app, nada.
// El reloj también pasa la portada al día siguiente a medianoche.
const CADA_MINUTO = 60_000
const ahora = ref(new Date())
let reloj: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  reloj = setInterval(() => {
    ahora.value = new Date()
    if (document.visibilityState === 'visible') void actualizarHoy()
  }, CADA_MINUTO)
})
onBeforeUnmount(() => clearInterval(reloj))

const lista = computed(() => portada(talleres.value, ahora.value))
const porDia = computed(() => talleresPorDia(talleres.value))
const numProximos = computed(() => lista.value.proximos.reduce((n, d) => n + d.talleres.length, 0))

const mayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)
const fechaDeHoy = computed(() => mayuscula(fechaLarga(diaRelativo(0, ahora.value), locale.value)))
// «Mañana · jueves, 26 de noviembre», «Ayer · martes, 24 de noviembre»; los demás días, solo la fecha.
const palabras = computed(() => ({ hoy: t('calendario.hoy'), manana: t('talleres.manana'), ayer: t('talleres.ayer') }))
const nombreDelDia = (iso: string) => nombreDia(iso, diaRelativo(0, ahora.value), locale.value, palabras.value)

// Las listas largas: los primeros días y «Ver más».
const diasProximos = ref(5)
const diasAnteriores = ref(3)

useHead({ title: computed(() => t('nav.talleres')) })
</script>
