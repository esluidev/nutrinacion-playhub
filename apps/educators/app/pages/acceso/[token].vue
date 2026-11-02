<template>
  <!-- El enlace de acceso que manda la organización (0013), como una invitación: dice de quién es
       y solo pide el PIN. Sirve la primera vez y cuando se olvidó; vale una vez y vence a los 7 días. -->
  <p v-if="estado === 'cargando'" class="ui-text">{{ t('acceso.cargando') }}</p>

  <UiEmptyState v-else-if="estado === 'no_vale'" icon="warning" :title="t('acceso.noValeTitulo')" :text="t('acceso.noValeTexto')">
    <UiButton variant="outline" @click="navigateTo('/entrar')">{{ t('acceso.irAEntrar') }}</UiButton>
  </UiEmptyState>

  <div v-else-if="info">
    <h1 class="ui-title">{{ info.primeraVez ? t('acceso.tituloPrimera') : t('acceso.tituloNuevo') }}</h1>
    <p class="ui-text mt-1">{{ info.primeraVez ? t('acceso.textoPrimera', { org: info.organizacion }) : t('acceso.textoNuevo') }}</p>
    <form class="mt-6 space-y-5" novalidate @submit.prevent="guardar">
      <!-- El correo ya va en el enlace: se muestra, no se escribe -->
      <div>
        <p class="field-label">{{ t('acceso.correo') }}</p>
        <p class="field">{{ info.correo }}</p>
      </div>
      <UiInput
        v-model="pin"
        :label="t('pin.nuevo')"
        type="password"
        inputmode="numeric"
        autocomplete="new-password"
        :hint="t('pin.ayuda')"
        :error="error === 'pin_invalido' ? t('pin.errorInvalido') : undefined"
      />
      <UiInput
        v-model="repetido"
        :label="t('pin.repetir')"
        type="password"
        inputmode="numeric"
        autocomplete="new-password"
        :error="error === 'no_coinciden' ? t('pin.errorNoCoinciden') : undefined"
      />
      <UiAlert v-if="error === 'red'" tone="warning">{{ t('entrar.errorRed') }}</UiAlert>
      <UiButton type="submit" block :loading="guardando">{{ t('acceso.boton') }}</UiButton>
    </form>
  </div>

  <UiAlert v-else tone="warning">{{ t('entrar.errorRed') }}</UiAlert>
</template>

<script setup lang="ts">
import type { InfoAcceso, ResultadoAcceso } from '~/composables/useSesion'

definePageMeta({ layout: 'entrar' })

const { t } = useT()
const route = useRoute()
const { infoAcceso, usarAcceso } = useSesion()

const enlace = String(route.params.token ?? '')
const estado = ref<'cargando' | 'listo' | 'no_vale' | 'red'>('cargando')
const info = ref<InfoAcceso | null>(null)
const pin = ref('')
const repetido = ref('')
const error = ref<ResultadoAcceso | null>(null)
const guardando = ref(false)

onMounted(async () => {
  const r = await infoAcceso(enlace)
  if (r === 'no_vale' || r === 'red') {
    estado.value = r
    return
  }
  info.value = r
  estado.value = 'listo'
})

async function guardar() {
  guardando.value = true
  const resultado = await usarAcceso(enlace, pin.value, repetido.value)
  guardando.value = false
  if (resultado === 'dentro') return navigateTo('/')
  if (resultado === 'no_vale') {
    estado.value = 'no_vale'
    return
  }
  if (resultado !== 'no_coinciden' && resultado !== 'red') pin.value = repetido.value = ''
  error.value = resultado
}

useHead({ title: computed(() => (estado.value === 'no_vale' ? t('acceso.noValeTitulo') : info.value && !info.value.primeraVez ? t('acceso.tituloNuevo') : t('acceso.tituloPrimera'))) })
</script>
