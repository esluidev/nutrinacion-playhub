<template>
  <!-- Enlace para elegir otra contraseña (decisión 009): Admin no envía correos, así que el titular
       o soporte lo genera y lo comparte. Sin `email`, soporte escribe el correo de la cuenta.
       Quién puede lo decide la base (`recuperacion_autorizar`); su mensaje se muestra tal cual. -->
  <UiDialog :open="open" :title="t('auth.recovery.title')" @update:open="(v) => { if (!v) emit('update:open', false) }">
    <p class="ui-text">{{ email ? t('auth.recovery.intro', { nombre: nombre || email }) : t('auth.recovery.introSupport') }}</p>

    <UiInput
      v-if="!email && !enlace"
      v-model="correo"
      type="email"
      class="mt-5"
      :label="t('auth.recovery.email')"
      placeholder="persona@correo.com"
      required
    />

    <UiAlert v-if="error" tone="danger" class="mt-5">{{ error }}</UiAlert>

    <!-- Se ve una sola vez: al cerrar, solo se puede generar otro -->
    <div v-if="enlace" class="mt-5 rounded-control border border-line bg-canvas px-5 py-4">
      <p class="eyebrow mb-1">{{ t('auth.recovery.linkLabel') }}</p>
      <p class="select-all break-all font-mono text-caption font-semibold text-ink">{{ enlace }}</p>
      <p class="ui-caption mt-2">{{ t('auth.recovery.linkNote') }}</p>
    </div>

    <template #actions>
      <UiButton v-if="!enlace" icon="key" :loading="generando" :disabled="!destino" @click="generar">
        {{ t('auth.recovery.generate') }}
      </UiButton>
      <UiButton v-else icon="copy" @click="copiar">{{ t('auth.recovery.copy') }}</UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean, email?: string | null, nombre?: string | null }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const { t } = useT()
const { toast } = useToast()

const correo = ref('')
const enlace = ref('')
const error = ref('')
const generando = ref(false)
const destino = computed(() => (props.email ?? correo.value).trim())

// Cada vez que se abre empieza de cero.
watch(() => props.open, (abierto) => {
  if (!abierto) return
  correo.value = ''
  enlace.value = ''
  error.value = ''
})

async function generar() {
  if (!destino.value) return
  error.value = ''
  generando.value = true
  const r = await useAuth().generarEnlaceRecuperacion(destino.value)
  generando.value = false
  if (r.error || !r.enlace) {
    error.value = r.error ?? ''
    return
  }
  enlace.value = r.enlace
}

async function copiar() {
  if (await copiarTexto(enlace.value)) toast.success(t('auth.recovery.copied'))
  else toast.error(t('auth.recovery.copyFailed'))
}
</script>
