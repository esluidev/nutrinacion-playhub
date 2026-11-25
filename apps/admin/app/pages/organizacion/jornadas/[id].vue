<template>
  <!-- La ficha de una jornada (tarea 023), con el patrón del detalle del taller: arriba su nombre, su estado por fechas,
       su lugar y sus días, «Agregar Taller» y el menú ⋮ con «Editar Jornada» y, aparte y en coral, «Eliminar Jornada»
       (deja sus talleres independientes, con su lugar y su espacio), igual que en la ficha del programa. Debajo, en dos tercios, sus talleres día por día (`TalleresPorDia`):
       todos sus días, cada uno con su ficha de fecha, sus talleres y un hueco para agregar otro ese día mientras no haya
       pasado. En un tercio, sus datos (lugar, días, programa enlazado y descripción) y sus educadores,
       con cuántos talleres da cada uno. -->
  <div v-if="jornada" class="w-full">
    <!-- El nombre se queda con al menos 320 px: si los botones no caben a su lado, bajan a la línea siguiente -->
    <header class="ui-page-header">
      <div class="min-w-0 flex-1 basis-80">
        <div class="flex items-center gap-3">
          <h1 class="ui-heading min-w-0 truncate">{{ jornada.nombre }}</h1>
          <UiBadge :tone="TONO_PROGRAMA[estado]" dot class="shrink-0">{{ t(`jornadas.state.${estado}`) }}</UiBadge>
        </div>
        <p class="ui-text mt-1.5">{{ [jornada.ubicacion, rangoJornada(jornada, locale), duracion].filter(Boolean).join(' · ') }}</p>
      </div>
      <div class="ui-page-header-actions">
        <UiButton icon="plus" :to="nuevoTaller(primerDia)">{{ t('jornadas.addWorkshop') }}</UiButton>
        <MenuAcciones
          :acciones="[
            { key: 'editar', label: t('planner.jEditTitle'), icon: 'pencil' },
            { key: 'eliminar', label: t('planner.jDelete'), icon: 'trash', peligro: true },
          ]"
          @select="(k) => (k === 'editar' ? (editando = true) : (eliminando = true))"
        />
      </div>
    </header>

    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <!-- Dos tercios: sus talleres, día por día; cada uno abre su ficha -->
      <section class="ui-panel lg:col-span-2">
        <div class="ui-panel-header">
          <h2 class="ui-title">{{ t('jornadas.workshopsTitle') }} <span class="text-body font-bold text-subtle">· {{ talleres.length }}</span></h2>
        </div>
        <p v-if="!porDia.dias.length && !porDia.sinDia.length" class="ui-text px-6 py-5">{{ t('jornadas.workshopsEmpty') }}</p>
        <TalleresPorDia
          v-else
          :dias="porDia.dias"
          :sin-dia="porDia.sinDia"
          :agregar="(fecha) => (fecha >= hoy ? nuevoTaller(fecha) : undefined)"
        />
      </section>

      <!-- Un tercio: sus datos y sus educadores -->
      <div class="flex flex-col gap-6">
        <section class="ui-panel">
          <div class="ui-panel-header"><h2 class="ui-title">{{ t('jornadas.dataTitle') }}</h2></div>
          <dl class="flex flex-col gap-4 px-6 py-5">
            <div>
              <dt class="eyebrow">{{ t('planner.jLocation') }}</dt>
              <dd class="mt-0.5 text-body font-extrabold text-ink">{{ jornada.ubicacion || '—' }}</dd>
            </div>
            <div>
              <dt class="eyebrow">{{ t('planner.jDates') }}</dt>
              <dd class="mt-0.5 text-body font-extrabold text-ink">{{ rangoJornada(jornada, locale) }}</dd>
            </div>
            <div>
              <dt class="eyebrow">{{ t('jornadas.colProgram') }}</dt>
              <dd class="mt-0.5 text-body font-extrabold text-ink">
                <NuxtLink v-if="programa" :to="`/organizacion/programas/${programa.id}`" class="ui-link" data-tone="sky">{{ programa.nombre }}</NuxtLink>
                <template v-else>{{ t('programs.none') }}</template>
              </dd>
            </div>
            <div v-if="jornada.descripcion">
              <dt class="eyebrow">{{ t('planner.jDescription') }}</dt>
              <dd class="ui-text mt-0.5">{{ jornada.descripcion }}</dd>
            </div>
          </dl>
        </section>

        <section class="ui-panel">
          <div class="ui-panel-header">
            <h2 class="ui-title">{{ t('jornadas.educatorsTitle') }} <span class="text-body font-bold text-subtle">· {{ educadores.length }}</span></h2>
          </div>
          <ul v-if="educadores.length" class="divide-y divide-line">
            <li v-for="e in educadores" :key="e.id" class="flex items-center gap-2.5 px-6 py-3">
              <UiAvatar :name="e.nombre" size="sm" />
              <span class="min-w-0 flex-1 truncate text-body font-extrabold text-ink">{{ e.nombre }}</span>
              <span class="ui-caption shrink-0">{{ tCount(t, 'jornadas.dayWorkshops', e.talleres) }}</span>
            </li>
          </ul>
          <p v-else class="ui-text px-6 py-5">{{ t('jornadas.educatorsEmpty') }}</p>
        </section>
      </div>
    </div>

    <JornadaDialog v-model:open="editando" :jornada="jornada" />

    <!-- Eliminar: los talleres se quedan, independientes -->
    <UiConfirmDialog
      :open="eliminando"
      :title="t('planner.jDeleteTitle')"
      :confirm-label="t('planner.jDelete')"
      :loading="enCurso"
      @update:open="(v) => eliminando = v"
      @confirm="eliminarJornada"
    >
      <p>{{ avisoEliminar }}</p>
    </UiConfirmDialog>
  </div>
  <UiEmptyState v-else-if="!loading" icon="layers" :title="t('jornadas.notFound')" />
</template>

<script setup lang="ts">
import { TONO_PROGRAMA, estadoPrograma } from '~/composables/useProgramas'
import { diasDeJornada, rangoJornada, talleresPorDia } from '~/utils/jornadas'
import { tCount } from '~/utils/i18n'

definePageMeta({ layout: 'dashboard' })

const { t, locale } = useT()
const route = useRoute()
const { toast } = useToast()
const { getJornada, loading, eliminar } = useJornadas()
const { getPrograma } = useProgramas()
const { workshops, refresh: refreshWorkshops } = useWorkshops()

const id = Number(route.params.id)
const jornada = computed(() => getJornada(id))
const programa = computed(() => getPrograma(jornada.value?.programa_id ?? null))
const hoy = hoyLocal()
const estado = computed(() => (jornada.value ? estadoPrograma(jornada.value, hoy) : 'por_venir'))
const duracion = computed(() => (jornada.value ? tCount(t, 'planner.jDays', diasDeJornada(jornada.value)) : ''))
// El día con que abre «Nuevo Taller» desde la cabecera: hoy si cae dentro de la jornada; si no, su primer día.
const primerDia = computed(() => {
  const j = jornada.value
  return j && hoy > j.fecha_inicio && hoy <= j.fecha_fin ? hoy : j?.fecha_inicio ?? ''
})
function nuevoTaller(fecha: string) {
  return `/organizacion/workshops/new?jornada=${id}&fecha=${fecha}`
}

const talleres = computed(() => workshops.value
  .filter(w => w.jornada?.id === id && w.status !== 'archivado')
  .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || a.time.localeCompare(b.time)))

const porDia = computed(() => (jornada.value ? talleresPorDia(jornada.value, talleres.value) : { dias: [], sinDia: [] }))

// Quiénes dan sus talleres (directos o por grupo) y cuántos cada uno: primero los que más.
const educadores = computed(() => {
  const porId = new Map<number, { id: number, nombre: string, talleres: number }>()
  for (const w of talleres.value) {
    for (const a of w.asignados) {
      const e = porId.get(a.id) ?? { id: a.id, nombre: a.nombre, talleres: 0 }
      e.talleres++
      porId.set(a.id, e)
    }
  }
  return [...porId.values()].sort((a, b) => b.talleres - a.talleres || a.nombre.localeCompare(b.nombre))
})

const editando = ref(false)
const eliminando = ref(false)
const enCurso = ref(false)
// «Sus 3 talleres quedan independientes» (o «Su taller queda independiente»), con el lugar de la jornada.
const avisoEliminar = computed(() => {
  const vars = { nombre: jornada.value?.nombre ?? '', n: talleres.value.length }
  if (!talleres.value.length) return t('jornadas.deleteEmpty', vars)
  return talleres.value.length === 1 ? t('planner.jDeleteWarnOne', vars) : t('planner.jDeleteWarn', vars)
})
async function eliminarJornada() {
  enCurso.value = true
  const { error } = await eliminar(id)
  enCurso.value = false
  eliminando.value = false
  if (error) { toast.error(error); return }
  await refreshWorkshops()
  toast.success(t('planner.jDeleted'))
  navigateTo('/organizacion/jornadas')
}
</script>
