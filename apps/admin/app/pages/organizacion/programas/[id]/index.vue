<template>
  <!-- La ficha de un programa (tarea 021), con el patrón del detalle del taller y de la ficha de la jornada (tarea 023).
       Arriba su nombre, su estado por fechas y sus fechas, y las acciones: «Ver Reporte» (el reporte completo del
       programa), «Agregar Taller» (uno, con «Nuevo Taller»), «Programar Sesiones» (muchos de una vez) y el menú ⋮ con
       «Editar Programa» y, aparte y en coral, «Eliminar Programa» (con talleres o jornadas no se elimina, la base lo
       rechaza y el menú dice por qué). Editar va en el menú para que los botones quepan junto al nombre; y si la
       cabecera no tiene sitio para los tres (menú lateral abierto en una pantalla mediana), «Ver Reporte» y «Agregar
       Taller» también pasan al menú: queda «Programar Sesiones», la principal, junto al nombre.
       Debajo, lo que lleva (del reporte). En dos tercios, sus talleres mes a mes: un programa dura semanas o meses, así
       que se elige el mes en un desplegable (abre en el de hoy) y cada mes muestra sus días con talleres (`TalleresPorDia`). En un
       tercio, sus datos (fechas, jornadas enlazadas y descripción) y cada audiencia en cada lugar con las sesiones que
       recibió de las previstas. -->
  <div v-if="programa" class="w-full">
    <!-- El nombre se queda con al menos 320 px. Las acciones van a su lado: las que no caben pasan al menú ⋮ (`holgada`);
         solo en el teléfono bajan a la línea siguiente. -->
    <header ref="cabecera" class="ui-page-header">
      <div class="min-w-0 flex-1 basis-80">
        <div class="flex items-center gap-3">
          <h1 class="ui-heading min-w-0 truncate">{{ programa.nombre }}</h1>
          <UiBadge :tone="TONO_PROGRAMA[estado]" dot class="shrink-0">{{ t(`programs.state.${estado}`) }}</UiBadge>
        </div>
        <p class="ui-text mt-1.5">{{ rangoJornada(programa, locale) }}</p>
      </div>
      <div class="ui-page-header-actions">
        <template v-if="holgada">
          <UiButton variant="outline" icon="chart" :to="urlReporte">{{ t('programs.report') }}</UiButton>
          <UiButton variant="outline" icon="plus" :to="urlNuevoTaller">{{ t('programs.addWorkshop') }}</UiButton>
        </template>
        <UiButton icon="calendar" :to="`/organizacion/programas/${programa.id}/sesiones`">{{ t('programs.series') }}</UiButton>
        <MenuAcciones :acciones="acciones" :ayuda="sePuedeEliminar ? undefined : t('programs.deleteBlocked')" @select="alElegir" />
      </div>
    </header>

    <!-- Lo que lleva: del reporte (`reporte_talleres`) -->
    <div class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div v-for="c in cifras" :key="c.label" class="ui-panel ui-stat">
        <UiSymbol size="md" :icon="c.icon" :tone="c.tone" />
        <div class="min-w-0">
          <p class="flex items-baseline gap-1.5">
            <span class="ui-stat-value">{{ c.value }}</span>
            <span v-if="c.sub" class="ui-caption">{{ c.sub }}</span>
          </p>
          <p class="ui-stat-label">{{ c.label }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <!-- Dos tercios: sus talleres, mes a mes y día por día; cada uno abre su ficha -->
      <section class="ui-panel lg:col-span-2">
        <div class="ui-panel-header flex-wrap gap-3">
          <h2 class="ui-title">{{ t('programs.workshopsTitle') }} <span class="text-body font-bold text-subtle">· {{ talleres.length }}</span></h2>
          <div v-if="talleres.length" class="flex flex-wrap items-center gap-3">
            <!-- El mes: un desplegable de barra con todos los meses del programa, como los filtros de las listas, del
                 alto de «Ver en Talleres»: se elige el mes directamente, sin pasar de uno en uno -->
            <UiSelect v-model="mes" variant="toolbar" size="sm" :prefix="t('programs.month')" :options="opcionesMes" />
            <UiButton tone="neutral" size="sm" :to="`/organizacion/workshops?programa=${programa.id}`">{{ t('programs.seeAll') }}</UiButton>
          </div>
        </div>
        <p v-if="!talleres.length" class="ui-text px-6 py-5">{{ t('programs.workshopsEmpty') }}</p>
        <p v-else-if="!delMes.dias.length && !sinFecha.length" class="ui-text px-6 py-5">{{ t('programs.monthEmpty') }}</p>
        <TalleresPorDia v-else :dias="delMes.dias" :sin-dia="sinFecha" con-lugar />
      </section>

      <!-- Un tercio: sus datos y sus audiencias -->
      <div class="flex flex-col gap-6">
        <section class="ui-panel">
          <div class="ui-panel-header"><h2 class="ui-title">{{ t('programs.dataTitle') }}</h2></div>
          <dl class="flex flex-col gap-4 px-6 py-5">
            <div>
              <dt class="eyebrow">{{ t('programs.datesLabel') }}</dt>
              <dd class="mt-0.5 text-body font-extrabold text-ink">{{ rangoJornada(programa, locale) }}</dd>
            </div>
            <div>
              <dt class="eyebrow">{{ t('jornadas.title') }}</dt>
              <dd v-if="jornadasDelPrograma.length" class="mt-0.5 flex flex-col gap-1">
                <NuxtLink v-for="j in jornadasDelPrograma" :key="j.id" :to="`/organizacion/jornadas/${j.id}`" class="ui-link text-body" data-tone="sky">
                  {{ j.nombre }}
                </NuxtLink>
              </dd>
              <dd v-else class="mt-0.5 text-body font-extrabold text-ink">{{ t('programs.jornadasNone') }}</dd>
            </div>
            <div v-if="programa.descripcion">
              <dt class="eyebrow">{{ t('planner.jDescription') }}</dt>
              <dd class="ui-text mt-0.5">{{ programa.descripcion }}</dd>
            </div>
          </dl>
        </section>

        <!-- Cada audiencia en cada lugar: las sesiones que recibió de las previstas -->
        <section class="ui-panel">
          <div class="ui-panel-header">
            <h2 class="ui-title">{{ t('programs.pairsTitle') }} <span class="text-body font-bold text-subtle">· {{ pares.length }}</span></h2>
          </div>
          <p v-if="!pares.length" class="ui-text px-6 py-5">{{ t('programs.pairsEmpty') }}</p>
          <ul v-else class="divide-y divide-line">
            <li v-for="p in pares" :key="`${p.grupo_audiencia_id}-${p.lugar_id}`" class="flex items-center gap-3 px-6 py-3">
              <div class="min-w-0 flex-1">
                <p class="truncate text-body font-extrabold text-ink">{{ getAudiencia(p.grupo_audiencia_id)?.nombre ?? '—' }}</p>
                <p class="ui-caption truncate">{{ getLugar(p.lugar_id)?.nombre ?? '—' }}</p>
              </div>
              <span class="shrink-0 text-caption font-extrabold tabular-nums text-muted">{{ t('programs.received', { recibidas: p.recibidas, previstas: p.previstas }) }}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <ProgramaDialog v-model:open="editando" :programa="programa" @saved="cargar" />

    <UiConfirmDialog
      :open="eliminando"
      :title="t('programs.deleteTitle', { nombre: programa.nombre })"
      :confirm-label="t('programs.delete')"
      :loading="enCurso"
      @update:open="(v) => eliminando = v"
      @confirm="eliminarPrograma"
    >
      <p>{{ t('programs.deleteText') }}</p>
    </UiConfirmDialog>
  </div>
  <UiEmptyState v-else-if="!loading" icon="bookmark" :title="t('programs.notFound')" />
</template>

<script setup lang="ts">
import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'
import type { UiTone } from '@playhub/ui/app/utils/ui-tones'
import type { AccionDelMenu } from '~/components/MenuAcciones.vue'
import type { ResumenPrograma } from '~/composables/useProgramas'
import { TONO_PROGRAMA, estadoPrograma } from '~/composables/useProgramas'
import { ordenarJornadas, rangoJornada, talleresPorDia } from '~/utils/jornadas'
import { mesInicial, mesesDelPrograma, rangoDelMes } from '~/utils/programas'

definePageMeta({ layout: 'dashboard' })

const { t, locale } = useT()
const route = useRoute()
const { toast } = useToast()
const { getPrograma, loading, refresh, resumen, eliminar } = useProgramas()
const { workshops } = useWorkshops()
const { getAudiencia } = useAudiencias()
const { getLugar } = useLugares()
const { jornadas } = useJornadas()

const id = Number(route.params.id)
const programa = computed(() => getPrograma(id))
const urlReporte = computed(() => (programa.value
  ? `/organizacion/reportes?programa=${id}&desde=${programa.value.fecha_inicio}&hasta=${programa.value.fecha_fin}`
  : ''))
const urlNuevoTaller = `/organizacion/workshops/new?programa=${id}`

// Las acciones de la cabecera: junto al nombre (que se queda con 320 px) caben «Ver Reporte», «Agregar Taller»,
// «Programar Sesiones» y el ⋮ si la cabecera mide al menos 920 px (medido: 320 + 16 de hueco + 582 de botones). Si no,
// las dos primeras pasan al menú, encima de «Editar Programa».
const cabecera = ref<HTMLElement | null>(null)
const anchoCabecera = useAncho(cabecera)
const holgada = computed(() => anchoCabecera.value >= 920)
const acciones = computed<AccionDelMenu[]>(() => [
  ...(holgada.value
    ? []
    : [
        { key: 'reporte', label: t('programs.report'), icon: 'chart' as const },
        { key: 'agregar', label: t('programs.addWorkshop'), icon: 'plus' as const },
      ]),
  { key: 'editar', label: t('programs.editTitle'), icon: 'pencil' },
  { key: 'eliminar', label: t('programs.delete'), icon: 'trash', peligro: true, disabled: !sePuedeEliminar.value },
])
function alElegir(clave: string) {
  if (clave === 'reporte') navigateTo(urlReporte.value)
  else if (clave === 'agregar') navigateTo(urlNuevoTaller)
  else if (clave === 'editar') editando.value = true
  else eliminando.value = true
}
const estado = computed(() => (programa.value ? estadoPrograma(programa.value, hoyLocal()) : 'por_venir'))
// Solo se elimina sin talleres ni jornadas (la base lo rechaza si no).
const sePuedeEliminar = computed(() => !!programa.value && !programa.value.talleres && !programa.value.jornadas)

const datos = ref<ResumenPrograma | null>(null)
async function cargar() {
  await refresh()
  if (programa.value) datos.value = await resumen(programa.value)
}
onMounted(cargar)

const pares = computed(() => datos.value?.pares ?? [])
const talleres = computed(() => workshops.value
  .filter(w => w.programa?.id === id && w.status !== 'archivado')
  .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || a.time.localeCompare(b.time)))

// Mes a mes: abre en el de hoy (antes de empezar, en el primero; terminado, en el último). Los que aún no tienen fecha
// salen en todos los meses, al final.
const hoy = hoyLocal()
const meses = computed(() => (programa.value ? mesesDelPrograma(programa.value) : []))
const mes = ref('')
watch(meses, (lista) => {
  if (!lista.includes(mes.value)) mes.value = mesInicial(lista, hoy)
}, { immediate: true })
// «Noviembre de 2026», como el mes del planificador
const opcionesMes = computed(() => meses.value.map((m) => {
  const s = aFecha(`${m}-01`).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-ES', { month: 'long', year: 'numeric' })
  return { value: m, label: s.charAt(0).toUpperCase() + s.slice(1) }
}))
const delMes = computed(() => (mes.value ? talleresPorDia(rangoDelMes(mes.value), talleres.value.filter(w => w.date), 0) : { dias: [], sinDia: [] }))
const sinFecha = computed(() => talleres.value.filter(w => !w.date))

// Sus jornadas: primero las que no han terminado.
const jornadasDelPrograma = computed(() => ordenarJornadas(jornadas.value.filter(j => j.programa_id === id), hoy))

interface Cifra { label: string, value: number, sub: string, icon: UiIconName, tone: UiTone }
const cifras = computed<Cifra[]>(() => {
  const r = datos.value?.resumen
  const a = datos.value?.alcance
  return [
    { label: t('programs.statPlanned'), value: r?.previstos ?? talleres.value.length, sub: '', icon: 'calendar', tone: 'sky' },
    { label: t('programs.statDone'), value: r?.realizados ?? 0, sub: r?.previstos ? `/ ${r.previstos}` : '', icon: 'check-circle', tone: 'lime' },
    { label: t('programs.statAudiences'), value: pares.value.length, sub: '', icon: 'heart', tone: 'neutral' },
    { label: t('programs.statReach'), value: a?.total ?? 0, sub: a?.total ? t('programs.reachSplit', { ninas: a.ninas, ninos: a.ninos }) : '', icon: 'users', tone: 'neutral' },
  ]
})

const editando = ref(false)
const eliminando = ref(false)
const enCurso = ref(false)
async function eliminarPrograma() {
  enCurso.value = true
  const { error } = await eliminar(id)
  enCurso.value = false
  eliminando.value = false
  if (error) { toast.error(error); return }
  toast.success(t('programs.deleted'))
  navigateTo('/organizacion/programas')
}
</script>
