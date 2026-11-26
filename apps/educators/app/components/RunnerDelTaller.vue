<template>
  <!-- El runner de Player a pantalla completa dentro de Educators (decisión 004, docs/runner.md), en el idioma del
       workshop y con la guía que le da Educators (`/workshops/<id>/play?mode=live|rehearsal`). Ejecutar (`live`, solo
       el día del taller, con el runner en modo `educator`): con «listo» la base lo anota como
       empezado y abre la conexión del taller (tarea 013), cuyo código y llave van al runner, que muestra el QR; con
       «terminado» sigue en el reporte. Ensayar (`rehearsal`, cualquier día, el runner en modo `rehearsal`): no se anota
       nada, sin dispositivos, y al
       terminar vuelve a su ficha. Salir a medias vuelve a donde estaba. La dirección de Player sale de la base
       (`configuraciones.player_url`). -->
  <div class="taller-runner">
    <UiRunner
      v-if="taller && disponible && playerUrl"
      :src="urlDelTaller(playerUrl, taller, ensayo)"
      :guide="guiaDelTaller"
      :conexion="conexion"
      :title="taller.titulo"
      @ready="empezar"
      @finish="alTerminar"
      @exit="salir"
    >
      <template #failed>
        <UiButton variant="outline" icon="calendar" @click="salir">{{ t('nav.talleres') }}</UiButton>
      </template>
    </UiRunner>
    <div v-else-if="cargando || playerUrl === undefined" class="grid h-full place-items-center p-6"><UiSpinner /></div>
    <div v-else class="grid h-full place-items-center p-6">
      <!-- Sin la dirección de Player en la base no hay runner que abrir: falta configurarla -->
      <UiEmptyState v-if="taller && disponible" icon="warning" tone="coral" :title="t('taller.sinPlayer')" :text="t('taller.sinPlayerTexto')">
        <UiButton to="/" icon="calendar">{{ t('nav.talleres') }}</UiButton>
      </UiEmptyState>
      <UiEmptyState
        v-else-if="taller?.estadoWorkshop === 'cancelado'"
        icon="ban"
        tone="coral"
        :title="t('taller.cancelado')"
        :text="taller.motivoCancelacion ?? t('taller.canceladoSinMotivo')"
      >
        <UiButton to="/" icon="calendar">{{ t('nav.talleres') }}</UiButton>
      </UiEmptyState>
      <!-- Ejecutar fuera de su día (o ya reportado): lo que toca hacer en su momento -->
      <UiEmptyState
        v-else-if="taller"
        icon="calendar"
        :title="taller.cierre ? t('taller.yaReportado') : t('taller.noHoy')"
        :text="`${fechaLarga(taller.fecha, locale)} · ${horario(taller)}`"
      >
        <div class="flex flex-wrap justify-center gap-3">
          <TallerBotones :taller="taller" principal />
          <UiButton to="/" variant="outline" icon="calendar">{{ t('nav.talleres') }}</UiButton>
        </div>
      </UiEmptyState>
      <UiEmptyState v-else icon="search" :title="t('taller.noEncontrado')">
        <UiButton to="/" icon="calendar">{{ t('nav.talleres') }}</UiButton>
      </UiEmptyState>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StoryboardGuide } from '@playhub/ui/app/utils/runner-contract'
import { fechaLarga } from '~/utils/fechas'
import { horario, puedeEjecutarse, puedeEnsayarse, urlDelTaller } from '~/utils/talleres'

const props = defineProps<{ id: string, ensayo?: boolean }>()

const { t, locale } = useT()
const router = useRouter()
const { taller: buscar, cargando, guia, iniciar, terminar } = useTalleres()
// Dónde está Player, de la base. `undefined` mientras se lee; `null` si no está configurada.
const playerUrl = ref<string | null | undefined>(undefined)
onMounted(async () => { playerUrl.value = await urlDeApp('player') })

const taller = computed(() => buscar(props.id))
// Se decide al abrir: un taller que se está ejecutando no se cierra porque cambie algo mientras tanto.
const disponible = computed(() => (taller.value ? (props.ensayo ? puedeEnsayarse(taller.value) : puedeEjecutarse(taller.value)) : false))

// La guía llega aparte: el runner arranca sin esperarla y UiRunner se la da cuando está.
const guiaDelTaller = ref<StoryboardGuide | null>(null)
watch(() => taller.value?.id, async () => {
  if (taller.value && !guiaDelTaller.value) guiaDelTaller.value = await guia(taller.value)
}, { immediate: true })

// «listo» llega otra vez si el educador reintenta: la ejecución empieza una sola vez. Un ensayo no empieza nada.
let empezado = false
const conexion = shallowRef<{ codigo: string, llave: string } | null>(null)
async function empezar() {
  if (empezado || props.ensayo) return
  empezado = true
  conexion.value = await iniciar(props.id)
}

// Ejecutado: del runner al reporte, sin dejar el taller en el historial («atrás» desde el reporte no vuelve a
// abrirlo); con mala conexión no se espera a la base más de unos segundos. Ensayado: de vuelta a su ficha.
async function alTerminar() {
  if (props.ensayo) {
    await navigateTo(`/workshops/${props.id}`, { replace: true })
    return
  }
  await Promise.race([terminar(props.id), new Promise(resolve => setTimeout(resolve, 4000))])
  await navigateTo(`/workshops/${props.id}/report`, { replace: true })
}

function salir() {
  if (window.history.state?.back) router.back()
  else navigateTo(`/workshops/${props.id}`, { replace: true })
}

useHead({ title: computed(() => taller.value?.titulo ?? '') })
</script>
