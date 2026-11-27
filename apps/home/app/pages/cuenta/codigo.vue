<template>
  <!-- Crear la cuenta o elegir un PIN nuevo (`?para=pin`: lo olvidó o lo cambia desde su cuenta), en dos pasos: el
       correo, y después el código de 6 dígitos que llega a él y el PIN. El código confirma que el correo es suyo; es un
       código y no un enlace para que todo pase en la app instalada, donde están los perfiles (0018). -->
  <form class="ui-panel ui-panel-body mx-auto w-full max-w-md" novalidate @submit.prevent="paso === 'correo' ? enviarCodigo() : confirmarCodigo()">
    <h1 class="ui-title">{{ paraPin ? t('cuenta.nuevoPin') : t('cuenta.crearTitulo') }}</h1>
    <p v-if="paso === 'codigo'" class="ui-caption mt-1">{{ t('cuenta.enviadoA', { correo: correo.trim().toLowerCase() }) }}</p>
    <div class="mt-6 space-y-5">
      <UiInput
        v-if="paso === 'correo'"
        v-model="correo"
        :label="t('cuenta.correo')"
        type="email"
        inputmode="email"
        autocomplete="email"
        :disabled="Boolean(cuenta)"
      />
      <template v-else>
        <UiInput v-model="codigo" :label="t('cuenta.codigo')" inputmode="numeric" autocomplete="one-time-code" />
        <UiInput v-model="pin" :label="t('cuenta.pinNuevo')" type="password" inputmode="numeric" autocomplete="new-password" />
      </template>
      <UiAlert v-if="aviso" :tone="aviso.tono">{{ aviso.texto }}</UiAlert>
      <div class="flex gap-3 pt-5">
        <UiButton v-if="paso === 'correo'" type="button" variant="outline" class="flex-1" :to="cuenta || paraPin ? '/cuenta' : '/'">{{ t('perfil.cancelar') }}</UiButton>
        <UiButton v-else type="button" variant="outline" class="flex-1" :loading="reenviando" @click="reenviar">{{ t('cuenta.reenviar') }}</UiButton>
        <UiButton type="submit" class="flex-1" :loading="ocupado">
          {{ paso === 'correo' ? t('cuenta.enviarCodigo') : paraPin ? t('cuenta.guardarPin') : t('cuenta.crear') }}
        </UiButton>
      </div>
    </div>
    <PerfilesPorGuardar :perfiles="pendientes" @listo="navigateTo('/')" />
  </form>
</template>

<script setup lang="ts">
import type { ErrorDeCuenta } from '~/composables/useCuenta'
import type { Perfil } from '~/utils/perfiles'

definePageMeta({ layout: 'familia' })

const { t } = useT()
const { toast } = useToast()
const { cuenta, pedirCodigo, confirmar, alEntrar } = useCuenta()
const route = useRoute()
const paraPin = computed(() => route.query.para === 'pin')
useHead({ title: () => (paraPin.value ? t('cuenta.nuevoPin') : t('cuenta.crearTitulo')) })

const paso = ref<'correo' | 'codigo'>('correo')
const correo = ref(cuenta.value?.correo ?? '')
const codigo = ref('')
const pin = ref('')
const error = ref<ErrorDeCuenta | null>(null)
const ocupado = ref(false)
const reenviando = ref(false)
const pendientes = ref<Perfil[]>([])
const aviso = computed(() => avisoDeCuenta(error.value, t, paso.value === 'codigo'))

async function enviarCodigo() {
  ocupado.value = true
  error.value = await pedirCodigo(correo.value)
  ocupado.value = false
  if (!error.value) paso.value = 'codigo'
}

async function reenviar() {
  reenviando.value = true
  error.value = await pedirCodigo(correo.value)
  reenviando.value = false
  if (!error.value) toast.success(t('cuenta.reenviado'))
}

async function confirmarCodigo() {
  const yaDentro = Boolean(cuenta.value)
  ocupado.value = true
  error.value = await confirmar(correo.value, codigo.value, pin.value)
  if (error.value) {
    ocupado.value = false
    return
  }
  // Un PIN nuevo con la sesión abierta: la misma cuenta, nada que combinar.
  if (yaDentro) {
    toast.success(t('cuenta.pinGuardado'))
    await navigateTo('/cuenta')
    return
  }
  pendientes.value = await alEntrar()
  ocupado.value = false
  if (!pendientes.value.length) await navigateTo('/')
}
</script>
