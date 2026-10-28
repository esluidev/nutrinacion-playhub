<template>
  <!-- Elegir contexto ≠ navegar dentro del contexto: por eso vive aquí arriba y no en el menú.
       El panel es además el "hub": de un vistazo se ve a qué tienes acceso y con qué rol.
       REGLAS: el switcher SOLO elige contexto — ninguna acción (crear/editar) vive aquí.
       El trigger refleja el TIPO actual (lo dicta la ruta, vía useContexto). Con un solo
       destino no hay nada que elegir: queda como etiqueta estática (sin chevron ni panel).
       COLOR: el contexto activo es estructura (hundido y en tinta), nunca lima. Cada org y
       comunidad lleva un tono estable que sale de su nombre (uiToneFor); Platform, noche. -->
  <RekaPopoverRoot v-model:open="abierto">
    <RekaPopoverTrigger as-child>
      <!-- ui-picker del kit; con un solo destino queda deshabilitado y se ve como etiqueta plana -->
      <button
        type="button"
        :disabled="esEstatico"
        :class="['ui-picker', isCollapsed && 'lg:justify-center lg:px-0']"
        :title="esEstatico ? undefined : t('ctx.switch')"
      >
        <!-- Platform es otro módulo (la consola del operador): su símbolo va en noche -->
        <UiSymbol size="sm" :tone="simboloTono">{{ inicial }}</UiSymbol>
        <div v-if="!isCollapsed" class="min-w-0 flex-1">
          <p class="eyebrow truncate leading-tight">{{ subtitulo }}</p>
          <p class="mt-px truncate text-body font-bold leading-tight text-ink">{{ titulo }}</p>
        </div>
        <UiIcon v-if="!isCollapsed && !esEstatico" name="chevrons-up-down" />
      </button>
    </RekaPopoverTrigger>

    <RekaPopoverPortal>
      <!-- Menú del kit dentro del portal de Reka (ui-listbox-floating), por encima del sidebar. -->
      <RekaPopoverContent
        side="bottom"
        align="start"
        :side-offset="6"
        class="ui-listbox ui-listbox-floating scrollbar-thin max-h-[70vh] w-60"
      >
        <!-- Platform no es una org más: es otro módulo (la consola del operador) -->
        <template v-if="esSuperadmin">
          <button
            type="button"
            :class="['ui-option py-1', tipo === 'platform' && 'bg-sunken font-black']"
            :aria-current="tipo === 'platform' ? 'true' : undefined"
            @click="seleccionarPlatform"
          >
            <span class="flex min-w-0 items-center gap-2.5">
              <UiSymbol size="sm" icon="sun" tone="night" />
              Platform
            </span>
            <span class="eyebrow shrink-0">{{ t('ctx.operator') }}</span>
          </button>
          <div v-if="orgs.length" class="mx-1 my-1.5 h-px bg-line" />
        </template>

        <!-- Una sección por organización; sus comunidades dentro. Así se ve que la comunidad
             vive DENTRO de la org, que es como está el modelo. La cabecera es SOLO etiqueta;
             lo elegible siempre es una FILA (la org, si la administras, y sus comunidades). -->
        <template v-for="o in orgs" :key="o.id">
          <div class="flex w-full items-center justify-between gap-2 px-3 pb-1.5 pt-2">
            <span class="eyebrow truncate">{{ o.nombre }}</span>
            <span class="shrink-0 text-micro font-bold text-disabled">
              {{ o.esAdmin ? t('ctx.admin') : t('ctx.collab') }}
            </span>
          </div>

          <!-- La org como contexto: una opción con el mismo lenguaje que las comunidades -->
          <button
            v-if="o.esAdmin"
            type="button"
            :class="['ui-option py-1', esOrgActiva(o.id) && 'bg-sunken font-black']"
            :aria-current="esOrgActiva(o.id) ? 'true' : undefined"
            :title="t('ctx.goOrg')"
            @click="seleccionarOrg(o.id)"
          >
            <span class="flex min-w-0 items-center gap-2.5">
              <UiSymbol size="sm" icon="building" :tone="uiToneFor(o.nombre)" />
              <span class="truncate">{{ t('ctx.org') }}</span>
            </span>
            <UiIcon v-if="esOrgActiva(o.id)" name="check" class="size-4" />
          </button>

          <button
            v-for="c in o.comunidades"
            :key="c.id"
            type="button"
            :class="['ui-option py-1', esActiva(o.id, c.id) && 'bg-sunken font-black']"
            :aria-current="esActiva(o.id, c.id) ? 'true' : undefined"
            @click="seleccionarComunidad(o.id, c.id)"
          >
            <span class="flex min-w-0 items-center gap-2.5">
              <UiSymbol size="sm" :tone="uiToneFor(c.nombre)">{{ c.nombre.charAt(0).toUpperCase() }}</UiSymbol>
              <span class="truncate">{{ c.nombre }}</span>
            </span>
            <UiIcon v-if="esActiva(o.id, c.id)" name="check" class="size-4" />
          </button>
        </template>

        <p v-if="!orgs.length && !esSuperadmin" class="px-3 py-4 text-center text-caption text-subtle">
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

// El símbolo del trigger lleva el mismo tono que la org o comunidad en el panel.
const simboloTono = computed(() => (tipo.value === 'platform' ? 'night' : uiToneFor(titulo.value || '?')))

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
