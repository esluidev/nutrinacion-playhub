<template>
  <!-- Elegir contexto ≠ navegar dentro del contexto: por eso vive aquí arriba y no en el menú.
       El panel es además el "hub": de un vistazo se ve a qué tienes acceso y con qué rol. -->
  <RekaPopoverRoot v-model:open="abierto">
    <RekaPopoverTrigger as-child>
      <button
        class="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-gray-100 transition-colors text-left"
        :title="t('ctx.switch')"
      >
        <div class="w-7 h-7 rounded-lg bg-brand-primary/10 text-brand-primary-600 flex items-center justify-center shrink-0 font-bold text-xs">
          {{ inicial }}
        </div>
        <div v-if="!isCollapsed" class="min-w-0 flex-1">
          <p class="text-[13px] font-semibold text-brand-dark leading-tight truncate">{{ titulo }}</p>
          <p class="text-[11px] text-gray-400 leading-tight truncate">{{ subtitulo }}</p>
        </div>
        <svg v-if="!isCollapsed" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15 12 18.75 15.75 15M8.25 9 12 5.25 15.75 9" />
        </svg>
      </button>
    </RekaPopoverTrigger>

    <RekaPopoverPortal>
      <RekaPopoverContent
        side="bottom"
        align="start"
        :side-offset="6"
        class="w-72 max-h-[70vh] overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-lg py-1.5 z-50 data-[state=open]:animate-in"
      >
        <!-- Platform no es un contexto más: es otro módulo (la consola del operador) -->
        <template v-if="esSuperadmin">
          <button
            class="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
            :class="rutaActual.startsWith('/platform') ? 'text-brand-purple font-semibold' : 'text-gray-700'"
            @click="seleccionarPlatform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            Platform
            <span class="ml-auto text-[10px] text-gray-400">{{ t('ctx.operator') }}</span>
          </button>
          <div v-if="orgs.length" class="my-1.5 border-t border-gray-100" />
        </template>

        <!-- Una sección por organización; sus comunidades dentro. Así se ve que la comunidad
             vive DENTRO de la org, que es como está el modelo. -->
        <div v-for="o in orgs" :key="o.id" class="px-1">
          <div class="flex items-center gap-2 px-2 pt-1.5 pb-1">
            <p class="text-[11px] font-bold tracking-wide text-gray-400 uppercase truncate">{{ o.nombre }}</p>
            <span class="ml-auto text-[10px] text-gray-300 shrink-0">
              {{ o.esAdmin ? t('ctx.admin') : t('ctx.collab') }}
            </span>
          </div>

          <button
            v-for="c in o.comunidades"
            :key="c.id"
            class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            :class="esActiva(o.id, c.id) ? 'text-brand-primary-600 font-semibold bg-brand-primary/5' : 'text-gray-700'"
            @click="seleccionarComunidad(o.id, c.id)"
          >
            <span class="truncate">{{ c.nombre }}</span>
            <svg v-if="esActiva(o.id, c.id)" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </button>

          <!-- Org que administras sin comunidades: el único destino útil es crear la primera -->
          <button
            v-if="o.esAdmin && !o.comunidades.length"
            class="w-full text-left px-2 py-1.5 rounded-lg text-xs text-brand-primary-600 font-semibold hover:bg-gray-50 transition-colors"
            @click="seleccionarOrg(o.id)"
          >
            {{ t('ctx.createFirst') }}
          </button>
        </div>

        <p v-if="!orgs.length && !esSuperadmin" class="px-3 py-4 text-xs text-gray-400 text-center">
          {{ t('ctx.noAccess') }}
        </p>
      </RekaPopoverContent>
    </RekaPopoverPortal>
  </RekaPopoverRoot>
</template>

<script setup lang="ts">
const { t } = useT()
const route = useRoute()
const { isCollapsed } = useSidebar()
const { orgs, esSuperadmin, orgActiva, comunidadActiva, setContexto } = useContexto()

const abierto = ref(false)
const rutaActual = computed(() => route.path)

// En /platform el switcher muestra el módulo, no el contexto: es donde estás parado.
const enPlatform = computed(() => rutaActual.value.startsWith('/platform'))

const titulo = computed(() => {
  if (enPlatform.value) return 'Platform'
  return comunidadActiva.value?.nombre ?? orgActiva.value?.nombre ?? t('ctx.pick')
})
const subtitulo = computed(() => {
  if (enPlatform.value) return t('ctx.operator')
  if (comunidadActiva.value) return orgActiva.value?.nombre ?? ''
  return orgActiva.value ? t('ctx.noCommunity') : ''
})
const inicial = computed(() => (titulo.value || '?').charAt(0).toUpperCase())

function esActiva(oid: number, cid: number) {
  return !enPlatform.value && orgActiva.value?.id === oid && comunidadActiva.value?.id === cid
}

function seleccionarPlatform() {
  abierto.value = false
  navigateTo('/platform')
}
function seleccionarComunidad(oid: number, cid: number) {
  abierto.value = false
  setContexto(oid, cid)
  navigateTo('/dashboard')
}
function seleccionarOrg(oid: number) {
  abierto.value = false
  setContexto(oid, null)
  navigateTo('/organizacion/comunidades')
}
</script>
