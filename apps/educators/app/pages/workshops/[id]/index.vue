<template>
  <div v-if="taller" :data-area="taller.storyboard.eje">
    <header class="mb-6">
      <div class="mb-2 flex flex-wrap items-center gap-2">
        <EstadoBadge :estado="estado" />
        <span class="badge" :data-area="taller.storyboard.eje">{{ resumen }}</span>
      </div>
      <h1 class="ui-heading">{{ taller.storyboard.titulo }}</h1>
      <p class="ui-text">{{ fechaLarga(taller.fecha, locale) }} · {{ horario(taller) }}</p>
    </header>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-6">
        <!-- Cancelado: en coral, con el motivo y sin «Iniciar taller». -->
        <UiAlert v-if="estado === 'cancelado'" tone="coral" icon="ban" :title="t('taller.cancelado')">
          {{ taller.motivoCancelacion ?? t('taller.canceladoSinMotivo') }}
        </UiAlert>

        <UiCard v-else-if="estado !== 'cerrado'">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
            <UiSymbol icon="play" size="xl" />
            <div class="min-w-0 flex-1">
              <h2 class="ui-title">{{ t('taller.abrir') }}</h2>
              <p class="ui-text mt-1">{{ t('taller.abrirTexto') }}</p>
            </div>
          </div>
          <div class="mt-5 flex flex-col gap-3 sm:flex-row">
            <UiButton :to="`/workshops/${taller.id}/jugar`" size="lg" icon="play" class="sm:flex-1">{{ t('taller.abrir') }}</UiButton>
          </div>
        </UiCard>

        <UiCard v-else>
          <h2 class="ui-title mb-4">{{ t('cierre.titulo') }}</h2>
          <dl class="grid grid-cols-2 gap-x-4 gap-y-5">
            <div v-if="taller.cierre!.calificacion" class="col-span-2">
              <dt class="ui-caption">{{ t('cierre.calificacion') }}</dt>
              <dd class="mt-1 flex gap-1" data-tone="sun" :aria-label="t('cierre.estrellas', { n: taller.cierre!.calificacion })">
                <UiIcon v-for="n in 5" :key="n" :name="n <= taller.cierre!.calificacion ? 'star-solid' : 'star'" :class="['size-6', n <= taller.cierre!.calificacion ? 'text-(--tone-fill)' : 'text-disabled']" />
              </dd>
            </div>
            <div><dt class="ui-caption">{{ t('cierre.asistentes') }}</dt><dd class="ui-title">{{ taller.cierre!.asistentes }}</dd></div>
            <div><dt class="ui-caption">{{ t('cierre.participacion') }}</dt><dd class="ui-title">{{ t(`cierre.participacion.${taller.cierre!.participacion}`) }}</dd></div>
          </dl>
        </UiCard>

        <UiCard>
          <h2 class="ui-title mb-3">{{ t('taller.antes') }}</h2>
          <ul class="space-y-3">
            <li v-for="paso in ['antes1', 'antes2', 'antes3']" :key="paso" class="flex items-start gap-3">
              <span class="ui-symbol ui-symbol-sm" data-tone="sky"><UiIcon name="check" /></span>
              <span class="ui-text !text-ink">{{ t(`taller.${paso}`) }}</span>
            </li>
          </ul>
        </UiCard>
      </div>

      <aside class="space-y-6">
        <UiCard>
          <dl class="space-y-4">
            <div v-for="dato in datos" :key="dato.label" class="flex items-center gap-3">
              <span class="ui-symbol ui-symbol-sm" data-tone="neutral"><UiIcon :name="dato.icon" /></span>
              <div><dt class="ui-caption">{{ dato.label }}</dt><dd class="font-black">{{ dato.valor }}</dd></div>
            </div>
          </dl>
        </UiCard>
        <UiCard>
          <h2 class="ui-title mb-2">{{ t('taller.materiales') }}</h2>
          <p class="ui-text">{{ t('taller.materialesPendiente') }}</p>
        </UiCard>
      </aside>
    </div>
  </div>
  <div v-else-if="cargando" class="grid place-items-center py-16"><UiSpinner /></div>
  <UiCard v-else>
    <UiEmptyState icon="search" :title="t('taller.noEncontrado')">
      <UiButton to="/" icon="calendar">{{ t('nav.talleres') }}</UiButton>
    </UiEmptyState>
  </UiCard>
</template>

<script setup lang="ts">
import { estadoDe, grupoYAsistentes, horario } from '~/utils/talleres'

const { t, locale } = useT()
const route = useRoute()
const { taller: buscar, cargando } = useTalleres()

const taller = computed(() => buscar(String(route.params.id)))
const estado = computed(() => (taller.value ? estadoDe(taller.value) : 'proximo'))
// «4 escenas · 30 min», sin la duración si el storyboard no la tiene.
const resumen = computed(() => {
  const sb = taller.value?.storyboard
  if (!sb) return ''
  return [t('taller.escenas', { n: sb.escenas }), sb.duracion ? t('taller.minutos', { n: sb.duracion }) : ''].filter(Boolean).join(' · ')
})
const EDICION: Record<string, string> = { KIDS: 'Infantil · 4–8', PREADOLESCENTES: 'Preadolescencia · 9–12', ADOLESCENTES: 'Adolescencia · 13–17' }

// Los datos del taller; los que la comunidad no rellenó no se muestran.
const datos = computed(() => taller.value
  ? [
      { label: t('taller.hora'), valor: horario(taller.value), icon: 'clock' as const },
      { label: t('taller.comunidad'), valor: taller.value.comunidad.nombre, icon: 'building' as const },
      { label: t('taller.lugar'), valor: taller.value.lugar, icon: 'map-pin' as const },
      { label: t('taller.grupo'), valor: grupoYAsistentes(taller.value, n => t('taller.asistentes', { n })), icon: 'users' as const },
      { label: t('taller.modalidad'), valor: t(`modalidad.${taller.value.modalidad}`), icon: 'devices' as const },
      { label: t('taller.idioma'), valor: t(`idioma.${taller.value.idioma}`), icon: 'globe' as const },
      { label: t('taller.edicion'), valor: EDICION[taller.value.storyboard.edicion] ?? taller.value.storyboard.edicion, icon: 'book' as const },
    ].filter(dato => dato.valor)
  : [])

useHead({ title: computed(() => taller.value?.storyboard.titulo ?? '') })
</script>
