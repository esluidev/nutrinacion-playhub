<template>
  <!-- La invitación recién creada (decisión 012): al abrirse se envía por correo y dice cómo quedó el
       envío; el enlace se puede copiar igual, salga o no. Al cerrar, la página vuelve a su lista, donde
       mientras siga pendiente se puede copiar el enlace o reenviar el correo. -->
  <UiDialog :open="!!invitacion" :title="t('invLink.title')" symbol="mail" tone="grape" :closable="false" persistent>
    <!-- El correo: enviándose (neutro), enviado (lima, completado) o sin salir (coral, falta) -->
    <UiAlert v-if="invitacion?.email && envio" :tone="TONO[envio]" :icon="ICONO[envio]">
      <p>{{ textoEnvio }}</p>
      <UiButton v-if="envio === 'fallido'" class="mt-3" tone="neutral" size="sm" icon="retry" @click="enviar">
        {{ t('invMail.retry') }}
      </UiButton>
    </UiAlert>

    <p class="ui-text mt-4">{{ t('invLink.intro', { nombre: nombre || t('invLink.person') }) }}</p>

    <div v-if="invitacion" class="mt-4 rounded-control border border-line bg-canvas px-5 py-4">
      <p class="eyebrow mb-1">{{ t('invLink.label') }}</p>
      <p class="select-all break-all font-mono text-caption font-semibold text-ink">{{ enlace }}</p>
      <p class="ui-caption mt-2">{{ t('invLink.note') }}</p>
    </div>

    <template #actions>
      <UiButton variant="outline" @click="emit('done')">{{ t('invLink.done') }}</UiButton>
      <UiButton icon="copy" @click="copiar">{{ t('invLink.copy') }}</UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import type { UiTone } from '@playhub/ui/app/utils/ui-tones'
import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'

// La invitación tal como la devuelve el composable que la crea.
interface InvitacionCreada {
  id: number
  token: string
  email: string | null
}

const props = defineProps<{ invitacion: InvitacionCreada | null, nombre?: string | null }>()
const emit = defineEmits<{ done: [] }>()

const { t } = useT()
const { toast } = useToast()

type Envio = 'enviando' | 'enviado' | 'fallido'
const TONO: Record<Envio, UiTone> = { enviando: 'neutral', enviado: 'lime', fallido: 'coral' }
const ICONO: Record<Envio, UiIconName> = { enviando: 'send', enviado: 'check-circle', fallido: 'warning' }

const envio = ref<Envio | null>(null)
const motivo = ref('')

const enlace = computed(() => (props.invitacion ? enlaceInvitacion(props.invitacion.token) : ''))

const textoEnvio = computed(() => {
  const correo = props.invitacion?.email ?? ''
  if (envio.value === 'enviado') return t('invMail.sent', { correo })
  if (envio.value === 'fallido') return t('invMail.failed', { motivo: motivo.value })
  return t('invMail.sending', { correo })
})

async function enviar() {
  const inv = props.invitacion
  if (!inv?.email || envio.value === 'enviando') return
  envio.value = 'enviando'
  const r = await enviarCorreoInvitacion(inv.id)
  if (props.invitacion?.id !== inv.id) return
  motivo.value = sinPuntoFinal(r.error ?? t('invMail.unreachable'))
  envio.value = r.ok ? 'enviado' : 'fallido'
}

// Justo después de crearla, la invitación sale por correo.
watch(() => props.invitacion?.id, (id) => {
  envio.value = null
  if (id !== undefined) enviar()
}, { immediate: true })

async function copiar() {
  if (await copiarTexto(enlace.value)) toast.success(t('invLink.copied'))
  else toast.error(t('invLink.copyFailed'))
}
</script>
