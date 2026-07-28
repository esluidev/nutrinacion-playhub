<template>
  <!-- Elegir contexto ≠ navegar dentro del contexto: por eso vive aquí arriba y no en el menú.
       El panel es además el "hub": de un vistazo se ve a qué tienes acceso y con qué rol.
       REGLAS: el switcher SOLO elige contexto — ninguna acción (crear/editar) vive aquí.
       El trigger refleja el TIPO actual (lo dicta la ruta, vía useContexto). Con un solo
       destino no hay nada que elegir: queda como etiqueta estática (sin chevron ni panel). -->
  <RekaPopoverRoot v-model:open="abierto">
    <RekaPopoverTrigger as-child>
      <button
        :disabled="esEstatico"
        :class="[
          'w-full flex items-center rounded-[13px] bg-brand-bg text-left transition-colors',
          esEstatico ? 'cursor-default' : 'hover:bg-[#e9ebee]',
          isCollapsed ? 'lg:justify-center lg:gap-0 lg:px-0 lg:py-2 gap-[11px] px-3 py-[11px]' : 'gap-[11px] px-3 py-[11px]',
        ]"
        :title="esEstatico ? undefined : t('ctx.switch')"
      >
        <!-- El morado de Platform vive SOLO aquí: es la pista de que estás en otro módulo -->
        <div
          class="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0 font-extrabold text-sm"
          :class="tipo === 'platform' ? 'bg-brand-purple-50 text-brand-purple-600' : 'bg-brand-primary-100 text-brand-primary-800'"
        >
          {{ inicial }}
        </div>
        <div v-if="!isCollapsed" class="min-w-0 flex-1">
          <p
            class="text-[9.5px] font-extrabold tracking-[0.1em] uppercase leading-tight truncate"
            :class="tipo === 'platform' ? 'text-brand-purple-300' : 'text-gray-400'"
          >{{ subtitulo }}</p>
          <p class="text-[14px] font-bold text-brand-dark leading-[1.2] truncate mt-px">{{ titulo }}</p>
        </div>
        <svg v-if="!isCollapsed && !esEstatico" xmlns="http://www.w3.org/2000/svg" class="w-[15px] h-[15px] text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15 12 18.75 15.75 15M8.25 9 12 5.25 15.75 9" />
        </svg>
      </button>
    </RekaPopoverTrigger>

    <RekaPopoverPortal>
      <RekaPopoverContent
        side="bottom"
        align="start"
        :side-offset="6"
        class="w-[236px] max-h-[70vh] overflow-y-auto scrollbar-thin bg-white rounded-[14px] border border-[#e0e6e2] shadow-menu p-1.5 z-50"
      >
        <!-- Platform no es una org más: es otro módulo (la consola del operador) -->
        <template v-if="esSuperadmin">
          <button
            :class="[
              'w-full flex items-center gap-2.5 px-3 py-[9px] rounded-[10px] text-[13px] transition-colors',
              tipo === 'platform' ? 'bg-brand-purple-50 text-brand-purple-700 font-extrabold' : 'text-gray-700 font-bold hover:bg-brand-purple-50/60',
            ]"
            @click="seleccionarPlatform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-brand-purple-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.66-6.66-1.42 1.42M7.76 16.24l-1.42 1.42m0-11.32 1.42 1.42m8.48 8.48 1.42 1.42" />
            </svg>
            Platform
            <span class="ml-auto text-[9.5px] font-extrabold tracking-[0.1em] text-brand-purple-300 uppercase">{{ t('ctx.operator') }}</span>
          </button>
          <div v-if="orgs.length" class="h-px bg-[#f0f2f0] my-1.5 mx-1" />
        </template>

        <!-- Una sección por organización; sus comunidades dentro. Así se ve que la comunidad
             vive DENTRO de la org, que es como está el modelo. La cabecera es SOLO etiqueta;
             lo elegible siempre es una FILA (la org, si la administras, y sus comunidades). -->
        <template v-for="o in orgs" :key="o.id">
          <div class="w-full flex items-center justify-between gap-2 px-3 pt-2 pb-[5px]">
            <span class="text-[10px] font-extrabold tracking-[0.12em] uppercase truncate text-gray-400">{{ o.nombre }}</span>
            <span class="text-[10px] font-bold text-gray-300 shrink-0">
              {{ o.esAdmin ? t('ctx.admin') : t('ctx.collab') }}
            </span>
          </div>

          <!-- La org como contexto: una opción con el mismo lenguaje que las comunidades -->
          <button
            v-if="o.esAdmin"
            :class="[
              'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] transition-colors',
              esOrgActiva(o.id) ? 'bg-brand-primary-50' : 'hover:bg-gray-50',
            ]"
            :title="t('ctx.goOrg')"
            @click="seleccionarOrg(o.id)"
          >
            <div
              :class="[
                'w-[26px] h-[26px] rounded-[8px] flex items-center justify-center shrink-0',
                esOrgActiva(o.id) ? 'bg-brand-primary-100 text-brand-primary-800' : 'bg-[#eef0f2] text-[#5a6b5f]',
              ]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-[13px] h-[13px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <span
              :class="[
                'text-[13px] truncate',
                esOrgActiva(o.id) ? 'font-extrabold text-brand-primary-800' : 'font-bold text-gray-700',
              ]"
            >{{ t('ctx.org') }}</span>
            <svg v-if="esOrgActiva(o.id)" xmlns="http://www.w3.org/2000/svg" class="w-[15px] h-[15px] ml-auto shrink-0 text-brand-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </button>

          <button
            v-for="c in o.comunidades"
            :key="c.id"
            :class="[
              'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] transition-colors',
              esActiva(o.id, c.id) ? 'bg-brand-primary-50' : 'hover:bg-gray-50',
            ]"
            @click="seleccionarComunidad(o.id, c.id)"
          >
            <div
              :class="[
                'w-[26px] h-[26px] rounded-[8px] flex items-center justify-center shrink-0 font-extrabold text-[11px]',
                esActiva(o.id, c.id) ? 'bg-brand-primary-100 text-brand-primary-800' : 'bg-[#eef0f2] text-[#5a6b5f]',
              ]"
            >
              {{ c.nombre.charAt(0).toUpperCase() }}
            </div>
            <span
              :class="[
                'text-[13px] truncate',
                esActiva(o.id, c.id) ? 'font-extrabold text-brand-primary-800' : 'font-bold text-gray-700',
              ]"
            >{{ c.nombre }}</span>
            <svg v-if="esActiva(o.id, c.id)" xmlns="http://www.w3.org/2000/svg" class="w-[15px] h-[15px] ml-auto shrink-0 text-brand-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </button>
        </template>

        <p v-if="!orgs.length && !esSuperadmin" class="px-3 py-4 text-xs text-gray-400 text-center">
          {{ t('ctx.noAccess') }}
        </p>
      </RekaPopoverContent>
    </RekaPopoverPortal>
  </RekaPopoverRoot>
</template>

<script setup lang="ts">
const { t } = useT()
const { isCollapsed } = useSidebar()
const { orgs, destinos, tipo, esSuperadmin, orgActiva, comunidadActiva, setContexto, setOrg } = useContexto()

const abierto = ref(false)

// Con un solo destino el contexto no se elige: el trigger es solo una etiqueta de dónde
// estás. (Un botón disabled no abre el popover — Reka no recibe el click.)
const esEstatico = computed(() => destinos.value.length <= 1)

const titulo = computed(() => {
  if (tipo.value === 'platform') return 'Platform'
  if (tipo.value === 'comunidad' && comunidadActiva.value) return comunidadActiva.value.nombre
  return orgActiva.value?.nombre ?? t('ctx.pick')
})
const subtitulo = computed(() => {
  if (tipo.value === 'platform') return t('ctx.operator')
  if (tipo.value === 'comunidad' && comunidadActiva.value) return orgActiva.value?.nombre ?? ''
  return orgActiva.value ? t('ctx.org') : ''
})
const inicial = computed(() => (titulo.value || '?').charAt(0).toUpperCase())

function esActiva(oid: number, cid: number) {
  return tipo.value === 'comunidad' && orgActiva.value?.id === oid && comunidadActiva.value?.id === cid
}
function esOrgActiva(oid: number) {
  return tipo.value === 'organizacion' && orgActiva.value?.id === oid
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
// Elegir la org = contexto de nivel organización; su home es el detalle de la org. La
// comunidad recordada se conserva (setOrg): cambiar de contexto no destruye estado.
function seleccionarOrg(oid: number) {
  abierto.value = false
  setOrg(oid)
  navigateTo('/organizacion')
}
</script>
