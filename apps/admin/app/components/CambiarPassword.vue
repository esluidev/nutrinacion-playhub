<template>
  <!-- Cambiar la contraseña en dos pasos, como el PIN en Educators. Primero confirma que es él con la
       actual (Supabase Auth la comprueba) y después elige la nueva dos veces. -->
  <UiDialog :open="open" :title="t('perfil.pwSubmit')" split @update:open="(v) => { if (!v) emit('close') }">
    <form :id="formId" ref="form" novalidate @submit.prevent="paso === 'actual' ? confirmar() : guardar()">
      <p class="eyebrow">{{ t('perfil.pwStep', { n: paso === 'actual' ? 1 : 2 }) }}</p>
      <template v-if="paso === 'actual'">
        <p class="ui-text mt-1">{{ t('perfil.pwStepCurrent') }}</p>
        <UiInput
          v-model="actual"
          class="mt-5"
          type="password"
          autocomplete="current-password"
          :label="t('perfil.pwCurrent')"
          :error="errores.actual"
        />
        <p class="ui-caption mt-3">{{ t('perfil.pwForgot') }}</p>
      </template>
      <template v-else>
        <p class="ui-text mt-1">{{ t('perfil.pwStepNew') }}</p>
        <div class="mt-5 space-y-5">
          <UiInput
            v-model="nueva"
            type="password"
            autocomplete="new-password"
            :label="t('perfil.pwNew')"
            :hint="t('perfil.pwMin')"
            :error="errores.nueva"
          />
          <UiInput
            v-model="repetida"
            type="password"
            autocomplete="new-password"
            :label="t('perfil.pwConfirm')"
            :error="errores.confirmar"
          />
        </div>
      </template>
    </form>

    <template #actions>
      <UiButton tone="neutral" @click="paso === 'actual' ? emit('close') : atras()">
        {{ paso === 'actual' ? t('common.cancel') : t('perfil.pwBack') }}
      </UiButton>
      <UiButton type="submit" :form="formId" :loading="enviando" :disabled="paso === 'actual' && !actual">
        {{ paso === 'actual' ? t('perfil.pwContinue') : t('perfil.pwSave') }}
      </UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useT()
const { toast } = useToast()
const demo = !isSupabaseConfigured()

const formId = useId()
const form = ref<HTMLFormElement | null>(null)
const paso = ref<'actual' | 'nueva'>('actual')
const actual = ref('')
const nueva = ref('')
const repetida = ref('')
const errores = reactive({ actual: '', nueva: '', confirmar: '' })
const enviando = ref(false)

// El campo del paso, listo para escribir.
function enfocar() {
  nextTick(() => form.value?.querySelector('input')?.focus())
}

function limpiarErrores() {
  Object.assign(errores, { actual: '', nueva: '', confirmar: '' })
}

watch(() => props.open, (abierto) => {
  if (!abierto) return
  paso.value = 'actual'
  actual.value = nueva.value = repetida.value = ''
  limpiarErrores()
  enfocar()
})

async function confirmar() {
  limpiarErrores()
  if (!demo) {
    enviando.value = true
    const { error } = await useAuth().verificarPassword(actual.value)
    enviando.value = false
    if (error === 'actual') {
      errores.actual = t('perfil.pwWrong')
      actual.value = ''
      return enfocar()
    }
    if (error) return toast.error(error)
  }
  paso.value = 'nueva'
  enfocar()
}

async function guardar() {
  limpiarErrores()
  if (nueva.value.length < 6) {
    errores.nueva = t('auth.invite.pwShort')
    return
  }
  if (nueva.value !== repetida.value) {
    errores.confirmar = t('auth.invite.pwMismatch')
    return
  }
  if (!demo) {
    enviando.value = true
    const { error } = await useAuth().cambiarPassword(actual.value, nueva.value)
    enviando.value = false
    // Si la actual ya no vale (la cambió en otra sesión), vuelve a pedirla.
    if (error === 'actual') {
      paso.value = 'actual'
      actual.value = ''
      errores.actual = t('perfil.pwWrong')
      return enfocar()
    }
    if (error) {
      errores.nueva = error
      return
    }
  }
  emit('close')
  toast.success(t('perfil.pwChanged'))
}

function atras() {
  paso.value = 'actual'
  nueva.value = repetida.value = ''
  limpiarErrores()
  enfocar()
}
</script>
