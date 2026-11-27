<template>
  <!-- Unirse a un taller con su código (tarea 025): el QR de la pantalla del educador abre esta página. Si en este
       dispositivo hay perfiles, primero «¿Quién se une?» (uno de ellos, o «Con otro nombre»); después, a pantalla
       completa, la página para unirse de Player incrustada: con un perfil, entra con su avatar y su nombre sin elegir
       nada; sin él, se eligen ahí, como siempre. Espera la aprobación del educador (mientras, «Instalar App» con un toque
       donde el navegador lo permite) y, aprobado, juega el taller en modo dispositivo. Si se cierra (lo rechazan, lo
       quitan, sale o el taller termina), vuelve a la app. -->
  <div v-if="!quien" class="contents">
    <UiAuthShell :label="t('app.corto')">
      <h1 class="ui-title">{{ t('code.quien') }}</h1>
      <div class="perfiles mt-6">
        <button v-for="perfil in perfiles" :key="perfil.id" type="button" class="perfil-elegir" @click="unirseCon(perfil.id)">
          <UiAvatar :name="perfil.nombre" :src="dibujoDe(perfil.avatar)" :tone="tonoDe(perfil.avatar)" size="xl" />
          <span class="w-full truncate">{{ perfil.nombre }}</span>
        </button>
      </div>
      <UiButton class="mt-6" variant="outline" block @click="unirseCon('otro')">{{ t('code.otro') }}</UiButton>
    </UiAuthShell>
  </div>
  <div v-else class="juego-runner">
    <iframe v-if="src" :src="src" class="unirse-marco" :title="t('code.titulo')" allow="autoplay; fullscreen; screen-wake-lock" />
    <div v-else class="grid h-full place-items-center"><UiSpinner /></div>
    <div v-if="esperando && puedeInstalar" class="unirse-instalar">
      <UiButton icon="download" @click="instalar">{{ t('code.instalar') }}</UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { normalizarCodigo } from '@playhub/ui/app/utils/codigo-taller'
import { parseRunnerEvent } from '@playhub/ui/app/utils/runner-contract'

definePageMeta({ layout: false })

const { t } = useT()
const { perfiles, actual } = useHogar()
const { puedeInstalar, instalar } = useInstalarApp()
const player = useUrlDePlayer()
const route = useRoute()
const codigo = normalizarCodigo(String(route.params.codigo ?? ''))
useHead({ title: () => t('code.titulo') })

// Con alguien jugando («Unirme» desde su inicio), se une él; si no, con perfiles en el dispositivo, primero quién se
// une (lo que abre el QR); sin ellos, directo.
const quien = ref<string | null>(actual.value?.id ?? (perfiles.value.length ? null : 'otro'))
const perfil = computed(() => perfiles.value.find(p => p.id === quien.value) ?? null)
function unirseCon(id: string) {
  quien.value = id
}

const src = computed(() => {
  if (!player.value || !quien.value) return null
  const url = new URL(`workshop/join/${codigo}`, `${player.value.replace(/\/+$/, '')}/`)
  if (perfil.value) {
    url.searchParams.set('avatar', perfil.value.avatar)
    url.searchParams.set('nombre', perfil.value.nombre)
  }
  return url.toString()
})

// Lo que cuenta la página de Player: si espera (se puede ofrecer instalar) o si se cerró (vuelve a la app). Ya en el
// taller, el runner cuenta si salió o si terminó. Solo se escucha a Player.
const esperando = ref(false)
function alMensaje(event: MessageEvent) {
  if (!player.value || event.origin !== new URL(player.value).origin) return
  const m = parseRunnerEvent(event.data)
  if (!m) return
  if (m.tipo === 'unirse') {
    esperando.value = m.fase === 'esperando'
    if (m.fase === 'cerrado') volver()
  }
  else if (m.tipo === 'listo') esperando.value = false
  else if (m.tipo === 'salir' || m.tipo === 'terminado') volver()
}
onMounted(() => window.addEventListener('message', alMensaje))
onBeforeUnmount(() => window.removeEventListener('message', alMensaje))

function volver() {
  navigateTo(actual.value ? '/inicio' : perfiles.value.length ? '/' : '/code', { replace: true })
}
</script>
