<template>
  <!-- Cambiar el PIN en dos pasos (0013). Primero confirma que es él con su PIN actual y la base lo
       comprueba; después elige el nuevo dos veces, como en el enlace de acceso. -->
  <UiDialog :open="open" :title="t('pin.cambiar')" split @update:open="(v) => { if (!v) emit('close') }">
    <form :id="formId" ref="form" novalidate @submit.prevent="paso === 'actual' ? confirmar() : guardar()">
      <p class="eyebrow">{{ t('pin.paso', { n: paso === 'actual' ? 1 : 2 }) }}</p>
      <template v-if="paso === 'actual'">
        <p class="ui-text mt-1">{{ t('pin.pasoActual') }}</p>
        <UiInput
          v-model="actual"
          class="mt-5"
          :label="t('pin.actual')"
          type="password"
          inputmode="numeric"
          autocomplete="current-password"
          :error="error === 'pin_actual' ? t('pin.errorActual') : undefined"
        />
        <p class="ui-caption mt-3">{{ t('pin.olvido') }}</p>
      </template>
      <template v-else>
        <p class="ui-text mt-1">{{ t('pin.pasoNuevo') }}</p>
        <div class="mt-5 space-y-5">
          <UiInput
            v-model="nuevo"
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
        </div>
      </template>
      <UiAlert v-if="error === 'bloqueado'" tone="warning" class="mt-5">{{ t('entrar.errorBloqueado') }}</UiAlert>
      <UiAlert v-else-if="error === 'red'" tone="warning" class="mt-5">{{ t('pin.errorRed') }}</UiAlert>
    </form>

    <template #actions>
      <UiButton tone="neutral" @click="paso === 'actual' ? emit('close') : atras()">
        {{ paso === 'actual' ? t('kit.cancel') : t('pin.atras') }}
      </UiButton>
      <UiButton type="submit" :form="formId" :loading="enviando">
        {{ paso === 'actual' ? t('pin.continuar') : t('pin.guardar') }}
      </UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import type { ErrorPin } from '~/composables/useSesion'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useT()
const { toast } = useToast()
const { verificarPin, cambiarPin } = useSesion()

const formId = useId()
const form = ref<HTMLFormElement | null>(null)
const paso = ref<'actual' | 'nuevo'>('actual')
const actual = ref('')
const nuevo = ref('')
const repetido = ref('')
const error = ref<ErrorPin | null>(null)
const enviando = ref(false)

// El campo del paso, listo para escribir.
function enfocar() {
  nextTick(() => form.value?.querySelector('input')?.focus())
}

watch(() => props.open, (abierto) => {
  if (!abierto) return
  paso.value = 'actual'
  actual.value = nuevo.value = repetido.value = ''
  error.value = null
  enfocar()
})

async function confirmar() {
  enviando.value = true
  error.value = await verificarPin(actual.value)
  enviando.value = false
  if (error.value) {
    if (error.value === 'pin_actual') actual.value = ''
    return enfocar()
  }
  paso.value = 'nuevo'
  enfocar()
}

async function guardar() {
  enviando.value = true
  error.value = await cambiarPin(actual.value, nuevo.value, repetido.value)
  enviando.value = false
  // Si el actual ya no vale (lo cambió en otro dispositivo), vuelve a pedirlo.
  if (error.value === 'pin_actual') {
    paso.value = 'actual'
    actual.value = ''
    return enfocar()
  }
  if (error.value) return
  emit('close')
  toast.success(t('pin.cambiado'))
}

function atras() {
  paso.value = 'actual'
  nuevo.value = repetido.value = ''
  error.value = null
  enfocar()
}
</script>
