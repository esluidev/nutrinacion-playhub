<template>
  <!-- «Programar Sesiones» de un programa (tarea 021): muchos talleres de una vez. Se eligen los
       storyboards en orden (uno por sesión), las audiencias con su lugar, su educador, su día de la
       semana y su hora, y desde cuándo. Cada audiencia recibe una sesión por semana, en su día, con
       los storyboards en el orden elegido. Se ven las fechas antes de guardar; las que caen fuera del
       programa se marcan y no dejan guardar (la base las rechazaría). Después son talleres normales. -->
  <div v-if="programa" class="mx-auto max-w-[980px]">
    <UiPageHeader :title="t('programs.seriesTitle')" :description="`${programa.nombre} · ${rangoJornada(programa, locale)}`" />

    <div class="flex flex-col gap-6">
      <!-- 1. Los storyboards, en orden: uno por sesión -->
      <section class="ui-panel">
        <div class="ui-panel-header">
          <h2 class="ui-title">{{ t('programs.seriesStoryboards') }} <span class="text-body font-bold text-subtle">· {{ elegidos.length }}</span></h2>
        </div>
        <div class="ui-panel-body flex flex-col gap-4">
          <ol v-if="elegidos.length" class="divide-y divide-line rounded-control-sm border-2 border-line">
            <li v-for="(sb, i) in elegidos" :key="`${sb.id}-${i}`" class="flex items-center gap-3 px-4 py-2.5">
              <span class="w-20 shrink-0 text-caption font-extrabold text-muted">{{ t('programs.sessionN', { n: i + 1 }) }}</span>
              <span class="min-w-0 flex-1 truncate text-body font-extrabold text-ink">{{ sb.title }}</span>
              <span class="ui-caption shrink-0">{{ sb.duration }}</span>
              <UiButton tone="neutral" size="sm" icon="chevron-up" icon-only :label="t('programs.moveUp')" :disabled="i === 0" @click="mover(i, -1)" />
              <UiButton tone="neutral" size="sm" icon="chevron-down" icon-only :label="t('programs.moveDown')" :disabled="i === elegidos.length - 1" @click="mover(i, 1)" />
              <UiButton tone="neutral" size="sm" icon="trash" icon-only :label="t('programs.remove')" @click="storyboardIds.splice(i, 1)" />
            </li>
          </ol>
          <div class="flex flex-wrap items-end gap-3">
            <UiSelect
              v-model="porAgregar"
              class="min-w-0 flex-1 basis-64"
              :options="opcionesStoryboard"
              :label="t('programs.seriesAddStoryboard')"
              :placeholder="t('programs.seriesPickStoryboard')"
            />
            <UiButton variant="outline" icon="plus" :disabled="!porAgregar" @click="agregarStoryboard">{{ t('programs.add') }}</UiButton>
          </div>
        </div>
      </section>

      <!-- 2. Las audiencias: dónde, quién lo da, qué día y a qué hora -->
      <section class="ui-panel">
        <div class="ui-panel-header">
          <h2 class="ui-title">{{ t('programs.seriesAudiences') }} <span class="text-body font-bold text-subtle">· {{ filas.length }}</span></h2>
          <UiButton tone="neutral" size="sm" icon="plus" @click="agregarFila">{{ t('programs.seriesAddAudience') }}</UiButton>
        </div>
        <div class="divide-y divide-line">
          <div v-for="(f, i) in filas" :key="f.key" class="ui-panel-body grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AudienciaSelector v-model="f.audienciaId" class="sm:col-span-2" />
            <LugarSelector v-model="f.lugarId" />
            <UiInput :id="`serie-espacio-${f.key}`" v-model="f.espacio" :label="t('wizard.fSpace')" :placeholder="t('wizard.fSpacePh')" optional />
            <UiSelect v-model="f.educadorId" :options="opcionesEducador" :label="t('programs.seriesEducator')" :placeholder="t('programs.seriesPickEducator')" />
            <div class="grid grid-cols-2 gap-4">
              <UiSelect v-model="f.dia" :options="opcionesDia" :label="t('programs.seriesDay')" />
              <UiInput :id="`serie-hora-${f.key}`" v-model="f.hora" type="time" :label="t('programs.seriesTime')" required />
            </div>
            <div v-if="filas.length > 1" class="flex justify-end sm:col-span-2">
              <UiButton tone="neutral" size="sm" icon="trash" @click="filas.splice(i, 1)">{{ t('programs.seriesRemoveAudience') }}</UiButton>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Desde cuándo -->
      <section class="ui-panel">
        <div class="ui-panel-body grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UiInput id="serie-desde" v-model="desde" type="date" :label="t('programs.seriesFrom')" :min="programa.fecha_inicio" :max="programa.fecha_fin" :hint="t('programs.seriesFromHint')" required />
        </div>
      </section>

      <!-- 4. Así quedan: las fechas de cada audiencia, antes de guardar -->
      <section class="ui-panel">
        <div class="ui-panel-header">
          <h2 class="ui-title">{{ t('programs.seriesPreview') }} <span class="text-body font-bold text-subtle">· {{ total }}</span></h2>
        </div>
        <p v-if="!vista.length" class="ui-caption px-6 py-6">{{ t('programs.seriesPreviewEmpty') }}</p>
        <div v-else class="divide-y divide-line">
          <div v-for="v in vista" :key="v.key" class="px-6 py-4">
            <p class="text-body font-extrabold text-ink">{{ v.titulo }}</p>
            <ul class="mt-2 flex flex-col gap-1">
              <li v-for="s in v.sesiones" :key="s.n" class="flex flex-wrap items-baseline gap-x-2 text-body font-semibold text-muted">
                <span class="w-10 text-caption font-extrabold text-subtle">{{ `S${s.n}` }}</span>
                <span class="tabular-nums" :class="s.fuera ? 'font-extrabold text-(--tone-strong)' : 'text-ink'" :data-tone="s.fuera ? 'coral' : undefined">{{ fechaCorta(s.fecha, locale) }}</span>
                <span>· {{ s.storyboard }}</span>
                <span v-if="s.fuera" class="text-caption font-extrabold text-(--tone-strong)" data-tone="coral">{{ t('programs.seriesOutside') }}</span>
              </li>
            </ul>
          </div>
        </div>
        <div class="ui-panel-footer flex flex-wrap items-center justify-end gap-3">
          <p v-if="aviso" class="ui-caption mr-auto">{{ aviso }}</p>
          <UiButton variant="outline" :disabled="!!aviso" :loading="guardando === 'borrador'" @click="guardar(false)">{{ t('programs.seriesSaveDrafts') }}</UiButton>
          <UiButton icon="check" :disabled="!!aviso" :loading="guardando === 'publicar'" @click="guardar(true)">{{ t('programs.seriesPublish', { n: total }) }}</UiButton>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { rangoJornada } from '~/utils/jornadas'
import { fechasDeSerie, fueraDelPrograma } from '~/utils/programas'

definePageMeta({ layout: 'dashboard' })

const { t, locale } = useT()
const route = useRoute()
const { toast } = useToast()
const { getPrograma, refresh } = useProgramas()
const { storyboards, getStoryboard } = useStoryboards()
const { activeEducators } = useEducators()
const { getAudiencia } = useAudiencias()
const { getLugar } = useLugares()
const { crearSerie } = useWorkshops()

const id = Number(route.params.id)
const programa = computed(() => getPrograma(id))
onMounted(() => refresh())

// ── Los storyboards, en orden ─────────────────────────────────────────────────
const storyboardIds = ref<number[]>([])
const porAgregar = ref<string | number | null>(null)
const elegidos = computed(() => storyboardIds.value.map(i => getStoryboard(i)).filter((s): s is NonNullable<typeof s> => !!s))
const opcionesStoryboard = computed(() => storyboards.value.map(s => ({ value: s.id, label: s.title })))
function agregarStoryboard() {
  if (typeof porAgregar.value === 'number') storyboardIds.value.push(porAgregar.value)
  porAgregar.value = null
}
function mover(i: number, d: number) {
  const lista = storyboardIds.value
  const [x] = lista.splice(i, 1)
  lista.splice(i + d, 0, x!)
}

// ── Las audiencias ────────────────────────────────────────────────────────────
interface Fila { key: number, audienciaId: number | null, lugarId: number | null, espacio: string, educadorId: string | number | null, dia: string | number, hora: string }
let siguiente = 0
const nuevaFila = (): Fila => ({ key: siguiente++, audienciaId: null, lugarId: null, espacio: '', educadorId: null, dia: 1, hora: '' })
const filas = ref<Fila[]>([nuevaFila()])
function agregarFila() {
  filas.value.push(nuevaFila())
}
const opcionesEducador = computed(() => activeEducators.value.map(e => ({ value: e.id, label: e.nombre })))
const opcionesDia = computed(() => [1, 2, 3, 4, 5, 6, 7].map(d => ({ value: d, label: t(`programs.days.${d}`) })))

// ── Desde cuándo: hoy o el inicio del programa, lo que sea después ─────────────
const desde = ref('')
watch(programa, (p) => {
  if (p && !desde.value) desde.value = [hoyLocal(), p.fecha_inicio].sort().at(-1)!
}, { immediate: true })

// ── Así quedan ────────────────────────────────────────────────────────────────
const completa = (f: Fila) => !!f.audienciaId && !!f.lugarId && typeof f.educadorId === 'number' && !!f.hora
const vista = computed(() => {
  const p = programa.value
  if (!p || !elegidos.value.length || !desde.value) return []
  return filas.value.filter(completa).map((f) => {
    const fechas = fechasDeSerie(desde.value, Number(f.dia), elegidos.value.length)
    const fuera = new Set(fueraDelPrograma(fechas, p))
    const lugar = getLugar(f.lugarId)?.nombre ?? ''
    return {
      key: f.key,
      fila: f,
      titulo: [getAudiencia(f.audienciaId)?.nombre, [lugar, f.espacio.trim()].filter(Boolean).join(' · '), `${t(`programs.days.${f.dia}`)} ${f.hora}`].filter(Boolean).join(' · '),
      sesiones: fechas.map((fecha, i) => ({ n: i + 1, fecha, storyboard: elegidos.value[i]!.title, storyboardId: elegidos.value[i]!.id, fuera: fuera.has(fecha) })),
    }
  })
})
const total = computed(() => vista.value.reduce((n, v) => n + v.sesiones.length, 0))

// Lo que falta para poder guardar (o null).
const aviso = computed(() => {
  if (!elegidos.value.length) return t('programs.seriesNeedStoryboards')
  if (!filas.value.every(completa)) return t('programs.seriesNeedAudiences')
  if (vista.value.some(v => v.sesiones.some(s => s.fuera))) return t('programs.seriesOutsideWarn')
  return null
})

// La hora de fin: la de inicio más la duración del storyboard (30 min si no la dice).
function horaFin(inicio: string, duracion: string) {
  const minutos = Number.parseInt(duracion) || 30
  const [h = 0, m = 0] = inicio.split(':').map(Number)
  const total = h * 60 + m + minutos
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

const guardando = ref<'borrador' | 'publicar' | null>(null)
async function guardar(publicar: boolean) {
  if (aviso.value) return
  const items = vista.value.flatMap(v => v.sesiones.map((s) => {
    const sb = getStoryboard(s.storyboardId)!
    return {
      titulo: sb.title,
      storyboardId: sb.id,
      fecha: s.fecha,
      horaInicio: v.fila.hora,
      horaFin: horaFin(v.fila.hora, sb.duration),
      lugarId: v.fila.lugarId!,
      espacio: v.fila.espacio,
      audienciaId: v.fila.audienciaId!,
      programaId: id,
      idioma: sb.languages[0] ?? 'es',
      capacidad: null,
      educadorId: v.fila.educadorId as number,
    }
  }))
  guardando.value = publicar ? 'publicar' : 'borrador'
  const { creados, error } = await crearSerie(items, publicar)
  guardando.value = null
  if (error && !creados) { toast.error(error); return }
  if (error) toast.error(error)
  else toast.success(t(publicar ? 'programs.seriesPublished' : 'programs.seriesSaved', { n: creados }))
  navigateTo(`/organizacion/programas/${id}`)
}
</script>
