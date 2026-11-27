<template>
  <!-- La cuenta de la familia (0018; Luis, 2026-11-27), opcional, con la barra de la familia y en su card. Sin ella,
       entrar con correo y PIN («Olvidé Mi PIN» lleva al código por correo; crearla está en el menú). Con ella, su correo,
       cambiar el PIN, cerrar sesión y, en la papelera junto al título, eliminarla. -->
  <div class="ui-panel ui-panel-body mx-auto w-full max-w-md">
    <template v-if="cuenta">
      <div class="flex items-center justify-between gap-3">
        <h1 class="ui-title">{{ t('cuenta.titulo') }}</h1>
        <UiButton type="button" tone="neutral" size="sm" icon="trash" icon-only :label="t('cuenta.eliminar')" :title="t('cuenta.eliminar')" @click="eliminando = true" />
      </div>
      <div class="mt-6 space-y-5">
        <UiInput :model-value="cuenta.correo" :label="t('cuenta.correo')" disabled />
        <div class="flex gap-3 pt-5">
          <UiButton variant="outline" class="flex-1" to="/cuenta/codigo?para=pin">{{ t('cuenta.cambiarPin') }}</UiButton>
          <UiButton variant="outline" class="flex-1" @click="salir">{{ t('cuenta.salirBoton') }}</UiButton>
        </div>
      </div>
      <UiConfirmDialog
        :open="eliminando"
        :title="t('cuenta.eliminar')"
        :confirm-label="t('cuenta.eliminar')"
        symbol="trash"
        :loading="ocupado"
        @update:open="(v: boolean) => (eliminando = v)"
        @confirm="eliminarCuenta"
      >
        {{ t('cuenta.eliminarTexto') }}
      </UiConfirmDialog>
    </template>

    <form v-else novalidate @submit.prevent="enviar">
      <h1 class="ui-title">{{ t('cuenta.entrar') }}</h1>
      <div class="mt-6 space-y-5">
        <UiInput v-model="correo" :label="t('cuenta.correo')" type="email" inputmode="email" autocomplete="email" />
        <UiInput v-model="pin" :label="t('cuenta.pin')" type="password" inputmode="numeric" autocomplete="current-password" />
        <UiAlert v-if="aviso" :tone="aviso.tono">{{ aviso.texto }}</UiAlert>
        <div class="flex gap-3 pt-5">
          <UiButton type="button" variant="outline" class="flex-1" to="/cuenta/codigo?para=pin">{{ t('cuenta.olvide') }}</UiButton>
          <UiButton type="submit" class="flex-1" :loading="ocupado">{{ t('cuenta.entrarBoton') }}</UiButton>
        </div>
      </div>
    </form>

    <PerfilesPorGuardar :perfiles="pendientes" @listo="navigateTo('/')" />
  </div>
</template>

<script setup lang="ts">
import type { ErrorDeCuenta } from '~/composables/useCuenta'
import type { Perfil } from '~/utils/perfiles'

definePageMeta({ layout: 'familia' })

const { t } = useT()
const { toast } = useToast()
const { cuenta, entrar, alEntrar, salir, eliminar } = useCuenta()
useHead({ title: () => (cuenta.value ? t('cuenta.titulo') : t('cuenta.entrar')) })

const correo = ref('')
const pin = ref('')
const error = ref<ErrorDeCuenta | null>(null)
const ocupado = ref(false)
const eliminando = ref(false)
const pendientes = ref<Perfil[]>([])

const aviso = computed(() => avisoDeCuenta(error.value, t))

async function enviar() {
  ocupado.value = true
  error.value = await entrar(correo.value, pin.value)
  if (!error.value) {
    pendientes.value = await alEntrar()
    if (!pendientes.value.length) await navigateTo('/')
  }
  else pin.value = ''
  ocupado.value = false
}

async function eliminarCuenta() {
  ocupado.value = true
  const listo = await eliminar()
  ocupado.value = false
  eliminando.value = false
  if (listo) toast.success(t('cuenta.eliminada'))
  else toast.error(t('cuenta.errorRed'))
}
</script>
