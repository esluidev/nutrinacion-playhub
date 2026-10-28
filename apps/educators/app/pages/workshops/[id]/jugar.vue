<template>
  <!-- El taller: el runner de Player a pantalla completa dentro de Educators (decisión 004,
       docs/runner.md), en el idioma del workshop. Educators le da la guía; con «listo» empieza la
       ejecución real, con «terminado» el educador sigue en el feedback del taller y, si sale a
       medias, vuelve a donde estaba. Un taller cancelado no se abre. -->
  <div class="taller-runner">
    <UiRunner
      v-if="taller && puedeIniciarse(taller)"
      :src="urlDelTaller(playerUrl, taller)"
      :guide="guiaDelTaller"
      :title="taller.storyboard.titulo"
      @ready="empezar"
      @finish="alTerminar"
      @exit="salir"
    >
      <template #failed>
        <UiButton variant="outline" icon="calendar" @click="salir">{{ t('nav.talleres') }}</UiButton>
      </template>
    </UiRunner>
    <div v-else-if="cargando" class="grid h-full place-items-center p-6"><UiSpinner /></div>
    <div v-else class="grid h-full place-items-center p-6">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { urlEnEsteEquipo } from '@playhub/ui/app/utils/equipo-local'
import type { StoryboardGuide } from '@playhub/ui/app/utils/runner-contract'
import { puedeIniciarse, urlDelTaller } from '~/utils/talleres'

definePageMeta({ layout: false })

const { t } = useT()
const route = useRoute()
const router = useRouter()
const { taller: buscar, cargando, guia, iniciar, terminar } = useTalleres()
// En la misma máquina que Player: compartida por Tailscale, localhost pasa a ser este equipo.
const playerUrl = urlEnEsteEquipo(useRuntimeConfig().public.playerUrl as string)

const id = String(route.params.id)
const taller = computed(() => buscar(id))

// La guía llega aparte: el runner arranca sin esperarla y UiRunner se la da cuando está.
const guiaDelTaller = ref<StoryboardGuide | null>(null)
watch(() => taller.value?.id, async () => {
  if (taller.value && !guiaDelTaller.value) guiaDelTaller.value = await guia(taller.value)
}, { immediate: true })

// «listo» llega otra vez si el educador reintenta: la ejecución empieza una sola vez.
let empezado = false
function empezar() {
  if (empezado) return
  empezado = true
  void iniciar(id)
}

// Del runner al feedback sin dejar el taller en el historial: «atrás» desde el feedback no
// vuelve a abrirlo. Con mala conexión no se espera a la base más de unos segundos.
async function alTerminar() {
  await Promise.race([terminar(id), new Promise(resolve => setTimeout(resolve, 4000))])
  await navigateTo(`/workshops/${id}/cierre`, { replace: true })
}

function salir() {
  if (window.history.state?.back) router.back()
  else navigateTo('/', { replace: true })
}

useHead({ title: computed(() => taller.value?.storyboard.titulo ?? '') })
</script>
