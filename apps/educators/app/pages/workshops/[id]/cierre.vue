<template>
  <!-- Feedback del taller, como en la app original: el paso final al terminar el taller en el runner
       (calificación, asistentes, participación y comentarios, más lo que pide la constitución: solo
       observaciones del grupo). En una audiencia cerrada, de los asistentes, cuántas eran niñas: los
       niños salen de la resta (tarea 021); en una abierta (una feria) basta el total. Cuántos
       dispositivos se unieron es opcional y lo anota el educador (tarea 021). Al finalizar, el taller queda completado; se puede corregir después.
       Un taller cancelado no tiene feedback. Una sola tarjeta, del ancho de la ventana grande del kit
       (640, `UiDialog` lg): en el teléfono ocupa el ancho de la pantalla. -->
  <div v-if="taller && puedeIniciarse(taller)" class="mx-auto w-full max-w-[640px]">
    <form class="ui-panel ui-panel-body space-y-7" novalidate @submit.prevent="guardar">
      <header>
        <h1 class="ui-heading">{{ t('cierre.titulo') }}</h1>
        <p class="ui-text mt-1">{{ t('cierre.texto') }}</p>
      </header>
      <Estrellas v-model="form.calificacion" :label="t('cierre.calificacion')" :etiqueta="n => t('cierre.estrellas', { n })" />
      <div class="space-y-4">
        <Contador v-model="form.asistentes" :label="t('cierre.asistentes')" />
        <p v-if="taller.grupoAbierto" class="ui-caption">{{ t('cierre.abierta') }}</p>
        <div v-else class="flex flex-wrap items-end gap-x-8 gap-y-3">
          <Contador v-model="form.ninas" :label="t('cierre.ninas')" :invalido="ninasDeMas" />
          <div>
            <p class="field-label">{{ t('cierre.ninos') }}</p>
            <p class="ui-title flex h-(--ph-control) items-center tabular-nums">{{ ninos ?? '—' }}</p>
          </div>
        </div>
        <p v-if="ninasDeMas" class="field-error">{{ t('cierre.ninasDeMas') }}</p>
      </div>
      <div>
        <Contador v-model="form.dispositivos" :label="t('cierre.dispositivos')" />
        <p class="field-help">{{ t('cierre.dispositivosAyuda') }}</p>
      </div>
      <OpcionesGrupo
        v-model="form.participacion"
        :label="t('cierre.participacion')"
        :opciones="(['baja', 'media', 'alta'] as const).map(v => ({ value: v, label: t(`cierre.participacion.${v}`) }))"
      />
      <OpcionesGrupo
        v-model="form.claridad"
        :label="t('cierre.claridad')"
        :opciones="(['poco_clara', 'clara', 'muy_clara'] as const).map(v => ({ value: v, label: t(`cierre.claridad.${v}`) }))"
      />
      <UiTextarea v-model="form.costo" :label="t('cierre.costo')" optional :rows="3" />
      <UiTextarea v-model="form.faltoMaterial" :label="t('cierre.falto')" optional :rows="2" />
      <UiAlert v-if="incompleto" tone="warning">{{ t('cierre.incompleto') }}</UiAlert>
      <UiButton type="submit" size="lg" block icon="check" :loading="guardando">{{ t('cierre.finalizar') }}</UiButton>
      <p class="ui-caption flex items-center gap-2"><UiIcon name="info" class="size-4" />{{ t('cierre.privacidad') }}</p>
    </form>
  </div>
  <div v-else-if="cargando" class="grid place-items-center py-16"><UiSpinner /></div>
  <UiCard v-else class="mx-auto w-full max-w-[640px]">
    <UiEmptyState
      v-if="taller"
      icon="ban"
      tone="coral"
      :title="t('taller.cancelado')"
      :text="taller.motivoCancelacion ?? t('taller.canceladoSinMotivo')"
    >
      <UiButton to="/" icon="calendar">{{ t('nav.talleres') }}</UiButton>
    </UiEmptyState>
    <UiEmptyState v-else icon="search" :title="t('taller.noEncontrado')">
      <UiButton to="/" icon="calendar">{{ t('nav.talleres') }}</UiButton>
    </UiEmptyState>
  </UiCard>
</template>

<script setup lang="ts">
import { cierreCompleto, ninosDe, puedeIniciarse } from '~/utils/talleres'
import type { Claridad, Participacion } from '~/utils/talleres'

const { t } = useT()
const route = useRoute()
const { taller: buscar, cargando, guardarCierre } = useTalleres()
const { toast } = useToast()

const taller = computed(() => buscar(String(route.params.id)))
const form = reactive<{ calificacion?: number, asistentes?: number, ninas?: number, dispositivos?: number, participacion?: Participacion, claridad?: Claridad, costo: string, faltoMaterial: string }>({
  asistentes: 0,
  costo: '',
  faltoMaterial: '',
})
// Los niños salen de los asistentes menos las niñas; más niñas que asistentes no cuadra.
const ninos = computed(() => ninosDe(form.asistentes ?? 0, form.ninas))
const ninasDeMas = computed(() => typeof form.ninas === 'number' && form.ninas > (form.asistentes ?? 0))
// El formulario parte del feedback que ya tenía (se puede corregir) o de los asistentes previstos.
// Los talleres pueden llegar después de abrir la página: se rellena una vez, cuando están.
let relleno = false
watch(taller, (actual) => {
  if (!actual || relleno) return
  relleno = true
  const previo = actual.cierre
  Object.assign(form, {
    calificacion: previo?.calificacion,
    asistentes: previo?.asistentes ?? actual.asistentesEstimados ?? 0,
    ninas: previo?.ninas ?? undefined,
    dispositivos: previo?.dispositivos ?? actual.dispositivosUnidos ?? undefined,
    participacion: previo?.participacion,
    claridad: previo?.claridad,
    costo: previo?.costo ?? '',
    faltoMaterial: previo?.faltoMaterial ?? '',
  })
}, { immediate: true })
const incompleto = ref(false)
const guardando = ref(false)

async function guardar() {
  const abierto = taller.value?.grupoAbierto ?? false
  const cierre = {
    ...form,
    asistentes: form.asistentes ?? 0,
    ninas: abierto ? null : form.ninas ?? null,
    ninos: abierto ? null : ninos.value,
    dispositivos: form.dispositivos ?? null,
    costo: form.costo.trim(),
    faltoMaterial: form.faltoMaterial.trim(),
  }
  if (!taller.value || !cierreCompleto(cierre, abierto)) {
    incompleto.value = true
    return
  }
  guardando.value = true
  const guardado = await guardarCierre(taller.value.id, cierre)
  guardando.value = false
  if (!guardado) {
    toast.error(t('cierre.error'))
    return
  }
  toast.success(t('cierre.guardado'))
  // Como en la app original: al finalizar se vuelve a Mis talleres.
  await navigateTo('/')
}

useHead({ title: computed(() => t('cierre.titulo')) })
</script>
