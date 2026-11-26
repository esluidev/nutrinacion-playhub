<template>
  <!-- «Reportar»: cómo fue el taller, el paso final al ejecutarlo en el runner, y lo que se hace con uno que ya pasó.
       Con esto se arma el reporte de la organización en Admin (calificación, asistentes, participación y comentarios,
       más lo que pide la constitución: solo observaciones del grupo). Una sola tarjeta, del ancho de la ventana grande
       del kit (640, `UiDialog` lg): en el teléfono ocupa el ancho de la pantalla. Arriba, de qué taller se trata; sin
       párrafo de ayuda (Luis, 2026-11-26). Nada viene rellenado con un número que no se midió: los asistentes los anota
       el educador (antes partían de los previstos). El total de asistentes es lo principal y lo único que hace falta;
       en una audiencia cerrada, debajo, las niñas y los niños, opcionales (el educador puede no haberse fijado): con
       uno, el otro es el resto y se ve en gris en su campo; con los dos, tienen que sumar el total. En una abierta (una
       feria), solo los asistentes (tarea 021). Los dispositivos conectados
       al terminar los cuenta la base al terminar (`educador_terminar`) y vienen puestos; el educador los corrige si
       hace falta. Se puede corregir después. Un taller cancelado o que aún no llega no se reporta. -->
  <div v-if="taller && puedeReportarse(taller)" class="mx-auto w-full max-w-[640px]">
    <form class="ui-panel ui-panel-body space-y-7" novalidate @submit.prevent="guardar">
      <header>
        <p class="ui-caption">{{ fechaLarga(taller.fecha, locale) }} · {{ horario(taller) }}</p>
        <h1 class="ui-heading mt-1">{{ t('cierre.titulo') }}</h1>
      </header>
      <Estrellas v-model="form.calificacion" :label="t('cierre.calificacion')" :etiqueta="n => t('cierre.estrellas', { n })" />
      <div class="space-y-4">
        <Contador v-model="form.asistentes" :label="t('cierre.asistentes')" />
        <template v-if="!taller.grupoAbierto">
          <div class="flex flex-wrap items-end gap-x-6 gap-y-4">
            <Contador v-model="form.ninas" :label="t('cierre.ninas')" opcional :sugerido="sugerido.ninas" :invalido="noCuadra" />
            <Contador v-model="form.ninos" :label="t('cierre.ninos')" opcional :sugerido="sugerido.ninos" :invalido="noCuadra" />
          </div>
          <p v-if="noCuadra" class="field-error">{{ t('cierre.noCuadra') }}</p>
        </template>
      </div>
      <Contador v-model="form.dispositivos" :label="t('cierre.dispositivos')" />
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
      v-if="taller?.estadoWorkshop === 'cancelado'"
      icon="ban"
      tone="coral"
      :title="t('taller.cancelado')"
      :text="taller.motivoCancelacion ?? t('taller.canceladoSinMotivo')"
    >
      <UiButton to="/" icon="calendar">{{ t('nav.talleres') }}</UiButton>
    </UiEmptyState>
    <!-- Aún no llega su día: primero se ejecuta -->
    <UiEmptyState v-else-if="taller" icon="calendar" :title="t('taller.reportarDespues')" :text="`${fechaLarga(taller.fecha, locale)} · ${horario(taller)}`">
      <div class="flex flex-wrap justify-center gap-3">
        <TallerBotones :taller="taller" principal />
        <UiButton to="/" variant="outline" icon="calendar">{{ t('nav.talleres') }}</UiButton>
      </div>
    </UiEmptyState>
    <UiEmptyState v-else icon="search" :title="t('taller.noEncontrado')">
      <UiButton to="/" icon="calendar">{{ t('nav.talleres') }}</UiButton>
    </UiEmptyState>
  </UiCard>
</template>

<script setup lang="ts">
import { fechaLarga } from '~/utils/fechas'
import { cierreCompleto, desgloseDe, horario, puedeReportarse } from '~/utils/talleres'
import type { Claridad, Participacion } from '~/utils/talleres'

const { t, locale } = useT()
const route = useRoute()
const { taller: buscar, cargando, guardarCierre } = useTalleres()
const { toast } = useToast()

const taller = computed(() => buscar(String(route.params.id)))
const form = reactive<{ calificacion?: number, asistentes?: number, ninas?: number, ninos?: number, dispositivos?: number, participacion?: Participacion, claridad?: Claridad, costo: string, faltoMaterial: string }>({
  costo: '',
  faltoMaterial: '',
})
// En una audiencia cerrada, las niñas y los niños de los asistentes: opcionales; con uno, el otro es el resto, que se
// sugiere en gris en su campo; con los dos, tienen que sumar el total.
const desglose = computed(() => desgloseDe(form.asistentes, form.ninas, form.ninos))
const noCuadra = computed(() => desglose.value === false && typeof form.asistentes === 'number')
const sugerido = computed(() => {
  const d = desglose.value
  return {
    ninas: d && typeof form.ninas !== 'number' ? d.ninas : null,
    ninos: d && typeof form.ninos !== 'number' ? d.ninos : null,
  }
})
// El formulario parte del reporte que ya tenía (se puede corregir) o, la primera vez, vacío salvo los dispositivos
// conectados al terminar, que contó la base. Los talleres pueden llegar después de abrir la página: se rellena una
// vez, cuando están.
let relleno = false
watch(taller, (actual) => {
  if (!actual || relleno) return
  relleno = true
  const previo = actual.cierre
  Object.assign(form, {
    calificacion: previo?.calificacion,
    asistentes: previo?.asistentes,
    ninas: previo?.ninas ?? undefined,
    ninos: previo?.ninos ?? undefined,
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
    asistentes: form.asistentes,
    ninas: abierto || !desglose.value ? null : desglose.value.ninas,
    ninos: abierto || !desglose.value ? null : desglose.value.ninos,
    dispositivos: form.dispositivos ?? null,
    costo: form.costo.trim(),
    faltoMaterial: form.faltoMaterial.trim(),
  }
  if (!taller.value || noCuadra.value || !cierreCompleto(cierre, abierto)) {
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
  // Enviado, se vuelve a Mis talleres.
  await navigateTo('/')
}

useHead({ title: computed(() => t('cierre.titulo')) })
</script>
