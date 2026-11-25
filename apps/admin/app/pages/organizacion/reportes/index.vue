<template>
  <!-- El reporte (tarea 021): lo que recibió cada audiencia y cómo se dio, en un periodo y con
       filtros (programa, comunidad, lugar, audiencia). El mismo desde la ficha del programa
       (`?programa=`) y desde «Reportes». Se imprime o se guarda como PDF desde el navegador: al
       imprimir quedan solo la cabecera y las secciones (los filtros los dice el subtítulo). Todo es
       del grupo: nunca una persona. -->
  <!-- A todo el ancho del layout, como las listas (tarea 023): las cifras en 4, y las secciones de dos en dos desde
       pantallas medianas («Lo que se trabajó» e «Incidencias», desde las anchas). -->
  <div class="reporte">
    <header class="ui-page-header">
      <div class="min-w-0 flex-1 basis-80">
        <p class="eyebrow mb-2">{{ [orgActiva?.nombre, t('reports.eyebrow')].filter(Boolean).join(' · ') }}</p>
        <h1 class="ui-heading">{{ programa?.nombre ?? t('reports.title') }}</h1>
        <p class="ui-text mt-1.5">{{ subtitulo }}</p>
        <p class="ui-caption mt-1 hidden print:block">{{ t('reports.generated', { fecha: fechaCorta(hoyLocal(), locale) }) }}</p>
      </div>
      <div class="ui-page-header-actions print:hidden">
        <UiButton v-if="programa" variant="outline" icon="bookmark" :to="`/organizacion/programas/${programa.id}`">{{ t('reports.toProgram') }}</UiButton>
        <UiButton :disabled="!hayTalleres" @click="imprimir">{{ t('reports.print') }}</UiButton>
      </div>
    </header>

    <!-- Filtros: el periodo y a quién. Al elegir un programa, el periodo pasa a ser el suyo. -->
    <section class="ui-panel ui-panel-body mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 print:hidden">
      <UiSelect v-model="programaModel" :label="t('reports.fProgram')" :options="opcionesPrograma" />
      <UiSelect v-model="comunidadModel" :label="t('reports.fCommunity')" :options="opcionesComunidad" />
      <UiSelect v-model="lugarModel" :label="t('reports.fPlace')" :options="opcionesLugar" />
      <UiSelect v-model="audienciaModel" :label="t('reports.fAudience')" :options="opcionesAudiencia" />
      <UiInput id="reporte-desde" v-model="filtros.desde" type="date" :label="t('reports.fFrom')" />
      <UiInput id="reporte-hasta" v-model="filtros.hasta" type="date" :label="t('reports.fTo')" :min="filtros.desde || undefined" :error="fechasMal ? t('reports.datesOrder') : undefined" />
    </section>

    <UiAlert v-if="demo" tone="info" class="mb-6 print:hidden">{{ t('reports.demo') }}</UiAlert>
    <UiAlert v-if="error" tone="danger" class="mb-6">{{ error }}</UiAlert>

    <div v-if="!reporte && cargando" class="flex justify-center py-16"><UiSpinner /></div>

    <UiEmptyState v-else-if="reporte && !hayTalleres" icon="chart" :title="t('reports.empty')" :text="t('reports.emptyHint')" />

    <div v-else-if="reporte" :class="['flex flex-col gap-6 transition-opacity', cargando && 'opacity-60']">
      <!-- Las cifras -->
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div v-for="c in cifras" :key="c.label" class="ui-panel ui-stat break-inside-avoid">
          <UiSymbol size="md" :icon="c.icon" :tone="c.tone" />
          <div class="min-w-0">
            <p class="flex flex-wrap items-baseline gap-x-1.5">
              <span class="ui-stat-value">{{ c.value }}</span>
              <span v-if="c.of" class="ui-caption">{{ c.of }}</span>
            </p>
            <p class="ui-stat-label">{{ c.label }}</p>
            <p v-if="c.sub" class="ui-caption">{{ c.sub }}</p>
          </div>
        </div>
      </div>

      <!-- Sesiones recibidas por cada audiencia en cada lugar: una casilla por taller previsto -->
      <section v-if="filasMatriz.length" class="ui-panel break-inside-avoid">
        <div class="ui-panel-header flex-wrap">
          <div class="min-w-0">
            <h2 class="ui-title">{{ t('reports.matrixTitle') }}</h2>
            <p class="ui-caption">{{ t('reports.matrixSub') }}</p>
          </div>
          <ul class="flex flex-wrap items-center gap-x-4 gap-y-2">
            <li v-for="c in LEYENDA" :key="c" class="flex items-center gap-1.5 ui-caption">
              <span :class="['inline-flex size-5 items-center justify-center rounded-chip', CLASE_CELDA[c]]" :data-tone="TONO_CELDA[c]">
                <UiIcon v-if="ICONO_CELDA[c]" :name="ICONO_CELDA[c]!" class="size-3" />
              </span>
              {{ t(`reports.cell.${c}`) }}
            </li>
          </ul>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b border-line">
                <th scope="col" class="px-6 py-2.5 text-left text-micro font-black uppercase tracking-wider text-muted">{{ t('reports.matrixAudience') }}</th>
                <th v-for="i in columnas" :key="i" scope="col" class="px-1 py-2.5 text-center text-micro font-black tabular-nums text-muted">{{ i }}</th>
                <th scope="col" class="px-6 py-2.5 text-right text-micro font-black uppercase tracking-wider text-muted">{{ t('reports.matrixTotal') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              <tr v-for="f in filasMatriz" :key="`${f.grupoAudienciaId}-${f.lugarId}`">
                <th scope="row" class="px-6 py-2.5 text-left">
                  <p class="flex items-center gap-2 text-body font-extrabold text-ink">
                    <span class="truncate">{{ nombreAudiencia(f.grupoAudienciaId) }}</span>
                    <UiBadge v-if="f.abierto" tone="neutral" class="shrink-0">{{ t('reports.open') }}</UiBadge>
                  </p>
                  <p class="ui-caption truncate">{{ nombreLugar(f.lugarId) }}</p>
                </th>
                <td v-for="i in columnas" :key="i" class="px-1 py-2.5 text-center">
                  <span
                    v-if="f.celdas[i - 1]"
                    :class="['inline-flex size-8 items-center justify-center rounded-control-sm', CLASE_CELDA[f.celdas[i - 1]!.celda]]"
                    :data-tone="TONO_CELDA[f.celdas[i - 1]!.celda]"
                    :title="tituloCelda(f.celdas[i - 1]!)"
                  >
                    <UiIcon v-if="ICONO_CELDA[f.celdas[i - 1]!.celda]" :name="ICONO_CELDA[f.celdas[i - 1]!.celda]!" class="size-4" />
                    <span class="sr-only">{{ tituloCelda(f.celdas[i - 1]!) }}</span>
                  </span>
                </td>
                <td class="whitespace-nowrap px-6 py-2.5 text-right text-body font-extrabold tabular-nums text-ink">
                  {{ t('reports.received', { recibidas: f.recibidas, previstas: f.celdas.length }) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Asistencia semana a semana: barras con la suma de asistentes de lo realizado -->
        <section class="ui-panel break-inside-avoid">
          <div class="ui-panel-header">
            <div class="min-w-0">
              <h2 class="ui-title">{{ t('reports.weeksTitle') }}</h2>
              <p class="ui-caption">{{ t('reports.weeksSub') }}</p>
            </div>
          </div>
          <p v-if="!semanas.length" class="ui-caption px-6 py-6">{{ t('reports.noClosings') }}</p>
          <div v-else class="ui-panel-body">
            <ol class="flex h-44 items-end gap-1.5" :aria-label="t('reports.weeksTitle')">
              <li v-for="s in semanas" :key="s.lunes" class="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" :title="tituloSemana(s)">
                <span class="text-micro font-black tabular-nums text-ink">{{ s.asistencias || '' }}</span>
                <span class="w-full max-w-10 rounded-t-chip bg-(--tone-fill)" data-tone="lime" :style="{ height: `${altura(s.asistencias)}%` }" />
                <span class="sr-only">{{ tituloSemana(s) }}</span>
              </li>
            </ol>
            <div class="mt-2 flex gap-1.5 border-t border-line pt-2" aria-hidden="true">
              <span v-for="(s, i) in semanas" :key="s.lunes" class="min-w-0 flex-1 truncate text-center text-micro font-bold text-muted">
                {{ i % pasoEtiqueta === 0 ? diaMes(s.lunes) : '' }}
              </span>
            </div>
          </div>
        </section>

        <!-- Cómo salieron: participación y claridad, del cierre del educador -->
        <section class="ui-panel break-inside-avoid">
          <div class="ui-panel-header">
            <div class="min-w-0">
              <h2 class="ui-title">{{ t('reports.outcomeTitle') }}</h2>
              <p class="ui-caption">{{ t('reports.outcomeSub') }}</p>
            </div>
          </div>
          <p v-if="!realizados" class="ui-caption px-6 py-6">{{ t('reports.noClosings') }}</p>
          <div v-else class="ui-panel-body flex flex-col gap-5">
            <div v-for="d in distribuciones" :key="d.titulo">
              <h3 class="mb-2 text-body font-extrabold text-ink">{{ d.titulo }}</h3>
              <ul class="flex flex-col gap-2">
                <li v-for="n in d.niveles" :key="n.clave" class="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-3">
                  <span class="ui-caption">{{ n.label }}</span>
                  <UiProgress :value="n.valor" :max="realizados" tone="lime" :label="`${n.label}: ${n.valor}`" />
                  <span class="text-right text-body font-extrabold tabular-nums text-ink">{{ n.valor }}</span>
                </li>
              </ul>
            </div>
            <p v-if="media !== null" class="ui-caption">{{ t('reports.rating', { n: numero(media) }) }}</p>
            <p v-if="reporte.resumen.talleres_con_dispositivos" class="ui-caption">
              {{ tPlural('reports.devices', reporte.resumen.talleres_con_dispositivos, { talleres: reporte.resumen.talleres_con_dispositivos, n: reporte.resumen.dispositivos }) }}
              <template v-if="reporte.resumen.segundos_dispositivos && reporte.resumen.dispositivos">
                {{ t('reports.devicesTime', { min: numero(reporte.resumen.segundos_dispositivos / 60 / reporte.resumen.dispositivos) }) }}
              </template>
            </p>
          </div>
        </section>
      </div>

      <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <!-- Lo que se trabajó: cada storyboard, con los talleres que se dieron y cómo salieron -->
        <section class="ui-panel break-inside-avoid">
          <div class="ui-panel-header">
            <div class="min-w-0">
              <h2 class="ui-title">{{ t('reports.themesTitle') }} <span class="text-body font-bold text-subtle">· {{ temas.length }}</span></h2>
              <p class="ui-caption">{{ t('reports.themesSub') }}</p>
            </div>
          </div>
          <ul class="divide-y divide-line">
            <li v-for="tm in temas" :key="tm.storyboardId" class="flex flex-wrap items-center gap-x-3 gap-y-2 px-6 py-3">
              <div class="min-w-0 flex-1">
                <p class="truncate text-body font-extrabold text-ink">{{ tituloStoryboard(tm.storyboardId) }}</p>
                <p class="ui-caption">{{ t('reports.themeDone', { realizados: tm.realizados, previstos: tm.previstos }) }}</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <UiBadge v-if="tm.alta" tone="lime">{{ t('reports.themeHigh', { n: tm.alta }) }}</UiBadge>
                <UiBadge v-if="tm.pocoClara" tone="coral">{{ t('reports.themeUnclear', { n: tm.pocoClara }) }}</UiBadge>
              </div>
            </li>
          </ul>
        </section>

        <!-- Incidencias: lo que no se dio como estaba previsto -->
        <section class="ui-panel break-inside-avoid">
          <div class="ui-panel-header">
            <div class="min-w-0">
              <h2 class="ui-title">{{ t('reports.eventsTitle') }} <span class="text-body font-bold text-subtle">· {{ eventos.length }}</span></h2>
              <p class="ui-caption">{{ t('reports.eventsSub') }}</p>
            </div>
          </div>
          <p v-if="!eventos.length" class="ui-caption px-6 py-6">{{ t('reports.eventsEmpty') }}</p>
          <ul v-else class="divide-y divide-line">
            <li v-for="(e, i) in eventos" :key="i" class="flex items-start gap-3 px-6 py-3">
              <UiSymbol size="sm" :icon="INCIDENCIA[e.tipo].icon" :tone="INCIDENCIA[e.tipo].tone" class="mt-0.5" />
              <div class="min-w-0 flex-1">
                <p class="text-body font-extrabold text-ink">
                  {{ t(`reports.event.${e.tipo}`) }}
                  <span class="font-semibold text-muted">· {{ e.fecha ? fechaCorta(e.fecha, locale) : '—' }}</span>
                </p>
                <p class="ui-caption">{{ contextoDe(e.workshopId) }}</p>
                <p v-if="detalle(e)" class="ui-caption text-ink">{{ detalle(e) }}</p>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Lo que más le costó al grupo, tal como lo escribió el educador -->
        <section class="ui-panel break-inside-avoid">
          <div class="ui-panel-header">
            <div class="min-w-0">
              <h2 class="ui-title">{{ t('reports.hardTitle') }}</h2>
              <p class="ui-caption">{{ t('reports.hardSub') }}</p>
            </div>
          </div>
          <p v-if="!costo.length" class="ui-caption px-6 py-6">{{ t('reports.hardEmpty') }}</p>
          <ul v-else class="divide-y divide-line">
            <li v-for="(d, i) in costo" :key="i" class="px-6 py-3">
              <p class="text-body font-semibold text-ink">«{{ d.texto }}»</p>
              <p class="ui-caption">{{ contexto(d.taller) }}</p>
            </li>
          </ul>
        </section>

        <!-- Material que faltó, juntando lo que se escribió igual -->
        <section class="ui-panel break-inside-avoid">
          <div class="ui-panel-header">
            <div class="min-w-0">
              <h2 class="ui-title">{{ t('reports.materialTitle') }}</h2>
              <p class="ui-caption">{{ t('reports.materialSub') }}</p>
            </div>
          </div>
          <p v-if="!material.length" class="ui-caption px-6 py-6">{{ t('reports.materialEmpty') }}</p>
          <ul v-else class="divide-y divide-line">
            <li v-for="m in material" :key="m.texto" class="flex items-center gap-3 px-6 py-3">
              <p class="min-w-0 flex-1 text-body font-semibold text-ink">{{ m.texto }}</p>
              <UiBadge tone="neutral" class="shrink-0">{{ tCount(t, 'reports.times', m.veces) }}</UiBadge>
            </li>
          </ul>
        </section>
      </div>


      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Cómo se calcula -->
        <section class="ui-panel break-inside-avoid">
          <div class="ui-panel-header">
            <div class="min-w-0">
              <h2 class="ui-title">{{ t('reports.howTitle') }}</h2>
              <p class="ui-caption">{{ t('reports.howSub') }}</p>
            </div>
          </div>
          <dl class="ui-panel-body flex flex-col gap-3">
            <div v-for="k in COMO" :key="k">
              <dt class="text-body font-extrabold text-ink">{{ t(`reports.how${k}`) }}</dt>
              <dd class="ui-caption">{{ t(`reports.how${k}Text`) }}</dd>
            </div>
          </dl>
        </section>

        <!-- Lo que este reporte no mide -->
        <section class="ui-panel break-inside-avoid">
          <div class="ui-panel-header">
            <div class="min-w-0">
              <h2 class="ui-title">{{ t('reports.limitsTitle') }}</h2>
              <p class="ui-caption">{{ t('reports.limitsSub') }}</p>
            </div>
          </div>
          <div class="ui-panel-body">
            <ul class="flex flex-col gap-2">
              <li v-for="n in 4" :key="n" class="flex items-start gap-2.5 text-body font-semibold text-ink">
                <UiIcon name="minus" class="mt-0.5 size-4 shrink-0 text-subtle" />
                {{ t(`reports.limits${n}`) }}
              </li>
            </ul>
            <p class="ui-caption mt-4">{{ t('reports.limitsText') }}</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'
import type { UiTone } from '@playhub/ui/app/utils/ui-tones'
import type { FiltrosReporte } from '~/composables/useReportes'
import type { Celda, FilaMatriz, FilaReporte, Incidencia, Reporte, Semana, TipoIncidencia } from '~/utils/reporte'
import { calificacionMedia, claridad, dificultades, incidencias, materialAgrupado, matriz, participacion, porSemana, porTema } from '~/utils/reporte'
import { tCount } from '~/utils/i18n'

definePageMeta({ layout: 'dashboard' })

const { t, locale } = useT()
const route = useRoute()
const router = useRouter()
const demo = !isSupabaseConfigured()
const { orgActiva } = useContexto()
const { programas, getPrograma, refresh: refrescarProgramas } = useProgramas()
const { lugares, comunidades, getLugar } = useLugares()
const { audiencias, getAudiencia } = useAudiencias()
const { getStoryboard } = useStoryboards()
const { workshops, getWorkshop } = useWorkshops()
const { cargar } = useReportes()

// ── Filtros, en la URL para volver o compartir el mismo reporte ───────────────
const num = (v: unknown) => (typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : null)
const fecha = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '')
const filtros = reactive<FiltrosReporte>({
  programaId: num(route.query.programa),
  comunidadId: num(route.query.comunidad),
  lugarId: num(route.query.lugar),
  audienciaId: num(route.query.audiencia),
  desde: fecha(route.query.desde),
  hasta: fecha(route.query.hasta),
})
const fechasMal = computed(() => !!filtros.desde && !!filtros.hasta && filtros.hasta < filtros.desde)

// Sin fechas, las del programa; sin programa, el año en curso.
function fechasPorDefecto(esperarPrograma: boolean) {
  if (filtros.desde && filtros.hasta) return
  const p = getPrograma(filtros.programaId)
  if (filtros.programaId && !p && esperarPrograma) return
  const anio = hoyLocal().slice(0, 4)
  filtros.desde ||= p?.fecha_inicio ?? `${anio}-01-01`
  filtros.hasta ||= p?.fecha_fin ?? `${anio}-12-31`
}
watch(programas, () => fechasPorDefecto(true), { immediate: true })

const TODOS = 'todos'
const programa = computed(() => getPrograma(filtros.programaId))
const programaModel = computed<string | number | null>({
  get: () => filtros.programaId ?? TODOS,
  set: (v) => {
    filtros.programaId = v === TODOS || v === null ? null : Number(v)
    const p = getPrograma(filtros.programaId)
    if (p) { filtros.desde = p.fecha_inicio; filtros.hasta = p.fecha_fin }
  },
})
const comunidadModel = computed<string | number | null>({
  get: () => filtros.comunidadId ?? TODOS,
  set: (v) => {
    filtros.comunidadId = v === TODOS || v === null ? null : Number(v)
    // Un lugar de otra comunidad ya no cabe en el filtro.
    if (filtros.comunidadId && filtros.lugarId && getLugar(filtros.lugarId)?.comunidadId !== filtros.comunidadId) filtros.lugarId = null
  },
})
const lugarModel = computed<string | number | null>({
  get: () => filtros.lugarId ?? TODOS,
  set: (v) => { filtros.lugarId = v === TODOS || v === null ? null : Number(v) },
})
const audienciaModel = computed<string | number | null>({
  get: () => filtros.audienciaId ?? TODOS,
  set: (v) => { filtros.audienciaId = v === TODOS || v === null ? null : Number(v) },
})

const opcionesPrograma = computed(() => [{ value: TODOS, label: t('reports.allPrograms') }, ...programas.value.map(p => ({ value: p.id, label: p.nombre }))])
const opcionesComunidad = computed(() => [{ value: TODOS, label: t('reports.allCommunities') }, ...comunidades.value.map(c => ({ value: c.id, label: c.nombre }))])
const opcionesLugar = computed(() => [
  { value: TODOS, label: t('reports.allPlaces') },
  ...lugares.value.filter(l => !filtros.comunidadId || l.comunidadId === filtros.comunidadId).map(l => ({ value: l.id, label: l.nombre })),
])
const opcionesAudiencia = computed(() => [{ value: TODOS, label: t('reports.allAudiences') }, ...audiencias.value.map(a => ({ value: a.id, label: a.nombre }))])

const subtitulo = computed(() => [
  filtros.desde && filtros.hasta ? t('reports.period', { desde: fechaCorta(filtros.desde, locale.value), hasta: fechaCorta(filtros.hasta, locale.value) }) : '',
  filtros.comunidadId ? comunidades.value.find(c => c.id === filtros.comunidadId)?.nombre : '',
  filtros.lugarId ? getLugar(filtros.lugarId)?.nombre : '',
  filtros.audienciaId ? getAudiencia(filtros.audienciaId)?.nombre : '',
].filter(Boolean).join(' · '))

// ── Carga: cada cambio de filtros pide el reporte (el último que llega manda) ──
const reporte = ref<Reporte | null>(null)
const cargando = ref(false)
const error = ref<string | null>(null)
let pedido = 0
async function recargar() {
  if (!filtros.desde || !filtros.hasta || fechasMal.value) return
  const n = ++pedido
  cargando.value = true
  const r = await cargar({ ...filtros })
  if (n !== pedido) return
  reporte.value = r.reporte
  error.value = r.error
  cargando.value = false
}

function consulta(f: FiltrosReporte) {
  const q: Record<string, string> = {}
  if (f.programaId) q.programa = String(f.programaId)
  if (f.comunidadId) q.comunidad = String(f.comunidadId)
  if (f.lugarId) q.lugar = String(f.lugarId)
  if (f.audienciaId) q.audiencia = String(f.audienciaId)
  if (f.desde) q.desde = f.desde
  if (f.hasta) q.hasta = f.hasta
  return q
}
watch(filtros, () => {
  router.replace({ query: consulta(filtros) })
  recargar()
}, { deep: true })
watch(() => orgActiva.value?.id, () => recargar())
onMounted(async () => {
  await refrescarProgramas()
  fechasPorDefecto(false)
  recargar()
})

// ── Lo que se pinta ───────────────────────────────────────────────────────────
const talleres = computed(() => reporte.value?.talleres ?? [])
const hayTalleres = computed(() => talleres.value.length > 0)
const realizados = computed(() => reporte.value?.resumen.realizados ?? 0)

const fmtNumero = computed(() => new Intl.NumberFormat(locale.value === 'en' ? 'en-US' : 'es-ES', { maximumFractionDigits: 1 }))
const fmtPct = computed(() => new Intl.NumberFormat(locale.value === 'en' ? 'en-US' : 'es-ES', { style: 'percent' }))
const numero = (n: number) => fmtNumero.value.format(n)
// Singular o plural según `cuenta` (la clave `…One`), con más variables que `tCount`.
const tPlural = (key: string, cuenta: number, vars: Record<string, string | number>) => t(cuenta === 1 ? `${key}One` : key, vars)
const pct = (a: number, b: number) => (b ? fmtPct.value.format(a / b) : '—')

const filasMatriz = computed(() => (reporte.value ? matriz(reporte.value.talleres, reporte.value.historial) : []))
const columnas = computed(() => Math.max(0, ...filasMatriz.value.map(f => f.celdas.length)))
const enOtraFecha = computed(() => filasMatriz.value.reduce((n, f) => n + f.celdas.filter(c => c.celda === 'otra').length, 0))

interface Cifra { label: string, value: string, of: string, sub: string, icon: UiIconName, tone: UiTone }
const cifras = computed<Cifra[]>(() => {
  const r = reporte.value!
  const pares = r.pares
  const recibidas = pares.reduce((n, p) => n + p.recibidas, 0)
  const previstas = pares.reduce((n, p) => n + p.previstas, 0)
  const alcanceSub = [
    r.alcance.total ? t('reports.reachSplit', { ninas: r.alcance.ninas, ninos: r.alcance.ninos }) : '',
    r.resumen.asistencias_abiertos ? tCount(t, 'reports.reachOpen', r.resumen.asistencias_abiertos) : '',
  ].filter(Boolean).join(' · ')
  const hechosSub = [
    t('reports.donePct', { pct: pct(r.resumen.realizados, r.resumen.previstos) }),
    enOtraFecha.value ? t('reports.doneOther', { n: enOtraFecha.value }) : '',
    r.resumen.cancelados ? tCount(t, 'reports.doneCancelled', r.resumen.cancelados) : '',
  ].filter(Boolean).join(' · ')
  return [
    { label: t('reports.statReach'), value: numero(r.alcance.total), of: '', sub: alcanceSub, icon: 'users', tone: 'neutral' },
    { label: t('reports.statDone'), value: numero(r.resumen.realizados), of: t('reports.of', { n: r.resumen.previstos }), sub: hechosSub, icon: 'check-circle', tone: 'lime' },
    {
      label: t('reports.statSessions'),
      value: numero(recibidas),
      of: t('reports.of', { n: previstas }),
      sub: pares.length ? tPlural('reports.sessionsSub', pares.length, { n: pares.length, pct: pct(recibidas, previstas) }) : '',
      icon: 'layers',
      tone: 'sky',
    },
    { label: t('reports.statHours'), value: numero(r.resumen.minutos / 60), of: '', sub: tCount(t, 'reports.hoursSub', r.resumen.asistencias), icon: 'clock', tone: 'neutral' },
  ]
})

// Las casillas: realizado (lima), en otra fecha (cielo), sin realizar (coral, punteada) o por venir.
const LEYENDA: Celda[] = ['hecho', 'otra', 'no', 'pendiente']
const TONO_CELDA: Record<Celda, UiTone> = { hecho: 'lime', otra: 'sky', no: 'coral', pendiente: 'neutral' }
const ICONO_CELDA: Record<Celda, UiIconName | null> = { hecho: 'check', otra: 'retry', no: 'close', pendiente: null }
const CLASE_CELDA: Record<Celda, string> = {
  hecho: 'bg-(--tone-tint) text-(--tone-strong)',
  otra: 'bg-(--tone-tint) text-(--tone-strong)',
  no: 'border-2 border-dashed border-(--tone-tint-edge) text-(--tone-strong)',
  pendiente: 'bg-sunken text-subtle',
}
function tituloCelda(c: FilaMatriz['celdas'][number]) {
  return [
    c.taller.fecha ? fechaCorta(c.taller.fecha, locale.value) : '',
    tituloTaller(c.taller),
    t(`reports.cell.${c.celda}`),
    c.taller.realizado && c.taller.asistentes !== null ? t('reports.cellAttendees', { n: c.taller.asistentes }) : '',
  ].filter(Boolean).join(' · ')
}

const semanas = computed(() => porSemana(talleres.value))
const maxSemana = computed(() => Math.max(1, ...semanas.value.map(s => s.asistencias)))
const altura = (n: number) => (n ? Math.max(4, Math.round((n / maxSemana.value) * 100)) : 0)
const pasoEtiqueta = computed(() => Math.max(1, Math.ceil(semanas.value.length / 8)))
const diaMes = (f: string) => aFecha(f).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short' })
const tituloSemana = (s: Semana) => `${t('reports.weekOf', { fecha: diaMes(s.lunes) })}: ${tPlural('reports.weekValue', s.realizados, { n: s.asistencias, talleres: s.realizados })}`

const distribuciones = computed(() => {
  const p = participacion(talleres.value)
  const c = claridad(talleres.value)
  return [
    { titulo: t('reports.participation'), niveles: (['ALTA', 'MEDIA', 'BAJA'] as const).map(k => ({ clave: k, label: t(`reports.level.${k}`), valor: p[k] })) },
    { titulo: t('reports.clarity'), niveles: (['MUY_CLARA', 'CLARA', 'POCO_CLARA'] as const).map(k => ({ clave: k, label: t(`reports.clarityLevel.${k}`), valor: c[k] })) },
  ]
})
const media = computed(() => calificacionMedia(talleres.value))
const temas = computed(() => porTema(talleres.value))
const costo = computed(() => dificultades(talleres.value))
const material = computed(() => materialAgrupado(talleres.value))
const eventos = computed(() => (reporte.value ? incidencias(reporte.value.talleres, reporte.value.historial) : []))

const INCIDENCIA: Record<TipoIncidencia, { icon: UiIconName, tone: UiTone }> = {
  CANCELADO: { icon: 'ban', tone: 'coral' },
  REPROGRAMADO: { icon: 'retry', tone: 'sky' },
  FECHA_CAMBIADA: { icon: 'calendar', tone: 'neutral' },
  SIN_CIERRE: { icon: 'alert', tone: 'coral' },
}
function detalle(e: Incidencia) {
  if (e.tipo === 'SIN_CIERRE') return t('reports.eventNoClosing')
  if ((e.tipo === 'REPROGRAMADO' || e.tipo === 'FECHA_CAMBIADA') && e.fecha && e.fechaNueva) {
    const movido = t('reports.eventMoved', { antes: fechaCorta(e.fecha, locale.value), despues: fechaCorta(e.fechaNueva, locale.value) })
    return e.motivo ? `${movido} · ${e.motivo}` : movido
  }
  return e.motivo ?? ''
}

// ── Nombres: el reporte trae ids y la app pone los nombres ────────────────────
const nombreAudiencia = (id: number | null) => (id ? getAudiencia(id)?.nombre : null) ?? t('reports.unknown')
const nombreLugar = (id: number | null) => (id ? getLugar(id)?.nombre : null) ?? t('reports.unknown')
const tituloStoryboard = (id: number) => getStoryboard(id)?.title ?? workshops.value.find(w => w.storyboardId === id)?.storyboard ?? t('reports.unknown')
const tituloTaller = (f: FilaReporte) => getWorkshop(f.id)?.title ?? tituloStoryboard(f.storyboard_id)
const contexto = (f: FilaReporte) => [
  f.fecha ? fechaCorta(f.fecha, locale.value) : '',
  tituloTaller(f),
  nombreAudiencia(f.grupo_audiencia_id),
  nombreLugar(f.lugar_id),
].filter(Boolean).join(' · ')
function contextoDe(workshopId: number) {
  const f = talleres.value.find(x => x.id === workshopId)
  return f ? [tituloTaller(f), nombreAudiencia(f.grupo_audiencia_id), nombreLugar(f.lugar_id)].join(' · ') : ''
}

const COMO = ['Reach', 'Done', 'Sessions', 'Attendance', 'Hours', 'Closing'] as const

function imprimir() {
  window.print()
}
</script>

<style scoped>
/* Al imprimir o guardar como PDF: los colores de las casillas y las barras se conservan y nada se
   parte entre páginas (break-inside-avoid en cada sección). */
@media print {
  .reporte { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}
</style>
