<template>
  <!-- El acceso de un educador a Educators (0013): un enlace, como las invitaciones. Sin PIN es su
       «Enlace de Acceso» (primer acceso); con PIN, «Restablecer PIN». Al crearlo sale por correo y
       dice cómo quedó el envío; mientras siga pendiente se ve qué enlace es, cuándo se creó y vence,
       se copia, se reenvía y se revoca. -->
  <UiDialog :open="!!educador" :title="titulo" :split="!!enlaceVigente" @update:open="(v) => { if (!v) emit('close') }">
    <template v-if="educador">
      <p class="ui-text">
        {{ t('educators.accessIntro', { nombre: educador.nombre }) }} <strong class="text-ink">{{ educador.email }}</strong> {{ t('educators.accessIntro2') }}
      </p>

      <!-- El correo de este momento: enviándose (neutro), enviado (lima) o sin salir (coral, falta) -->
      <UiAlert v-if="envio" class="mt-4" :tone="TONO[envio]" :icon="ICONO[envio]">
        <p>{{ textoEnvio }}</p>
        <UiButton v-if="envio === 'fallido'" class="mt-3" tone="neutral" size="sm" icon="retry" @click="enviar">{{ t('invMail.retry') }}</UiButton>
      </UiAlert>

      <!-- El enlace pendiente: qué enlace es, cuándo se creó y vence, y cómo quedó su correo -->
      <div v-if="enlaceVigente" class="mt-4 rounded-control border border-line bg-canvas px-5 py-4">
        <p class="eyebrow mb-1">{{ conPin ? t('educators.linkReset') : t('educators.linkFirst') }}</p>
        <p class="select-all break-all font-mono text-caption font-semibold text-ink">{{ url || '…' }}</p>
        <p class="ui-caption mt-2">{{ fechas }}</p>
        <InvitacionCorreo v-if="!envio" class="mt-1" :enviado-en="enlaceVigente.correoEnviadoEn" :error="enlaceVigente.correoError" />
        <!-- Revocar: coral (quitar) -->
        <button type="button" class="ui-link mt-2 text-caption" data-tone="coral" @click="revocando = true">{{ t('educators.revokeLink') }}</button>
      </div>
      <p v-if="enlaceVigente && conPin" class="ui-caption mt-3">{{ t('educators.linkResetNote') }}</p>

      <template v-if="!enlaceVigente">
        <p v-if="educador.enlace?.vencido" class="ui-caption mt-4">{{ t('educators.linkExpired', { fecha: fechaCorta(educador.enlace.expiraEn, locale) }) }}</p>
        <p class="ui-caption mt-4">{{ conPin ? t('educators.hasPin') : t('educators.noPin') }}</p>
      </template>
    </template>

    <template #actions>
      <template v-if="enlaceVigente">
        <UiButton tone="neutral" icon="send" :loading="envio === 'enviando'" @click="enviar">{{ t('invMail.resend') }}</UiButton>
        <UiButton icon="copy" @click="copiar">{{ t('educators.copyLink') }}</UiButton>
      </template>
      <UiButton v-else :loading="creando" icon="link" @click="crear">
        {{ conPin ? t('educators.createLinkPin') : t('educators.createLink') }}
      </UiButton>
    </template>
  </UiDialog>

  <UiConfirmDialog
    :open="revocando"
    :title="t('educators.revokeLinkTitle')"
    :confirm-label="t('invLink.revoke')"
    symbol="ban"
    :loading="revocandoEnCurso"
    @update:open="(v) => (revocando = v)"
    @confirm="revocar"
  >
    <p>{{ t(conPin ? 'educators.revokeLinkWarnPin' : 'educators.revokeLinkWarn', { nombre: educador?.nombre ?? '' }) }}</p>
  </UiConfirmDialog>
</template>

<script setup lang="ts">
import type { UiTone } from '@playhub/ui/app/utils/ui-tones'
import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'

// `crearAlAbrir`: el alta de un educador abre el diálogo y su enlace se crea y se envía solo.
const props = defineProps<{ educadorId: number | null, crearAlAbrir?: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { t, locale } = useT()
const { toast } = useToast()
const { educators, crearAcceso, revocarAcceso, enviarCorreoAcceso } = useEducators()

const educador = computed(() => (props.educadorId === null ? null : educators.value.find(e => e.id === props.educadorId) ?? null))
const enlaceVigente = computed(() => (educador.value?.enlace && !educador.value.enlace.vencido ? educador.value.enlace : null))
// Con PIN, el enlace es para restablecerlo; sin él, el de primer acceso.
const conPin = computed(() => educador.value?.acceso === 'pin')
const titulo = computed(() => (conPin.value ? t('educators.resetPin') : t('educators.accessLink')))
const fechas = computed(() => {
  const e = enlaceVigente.value
  if (!e) return ''
  return [
    e.creadoEn && t('educators.linkCreated', { fecha: fechaCorta(e.creadoEn, locale.value) }),
    t('educators.linkExpires', { fecha: fechaCorta(e.expiraEn, locale.value) }),
    t('educators.linkOnce'),
  ].filter(Boolean).join(' · ')
})

const base = ref<string | null>(null)
const url = computed(() => (base.value && enlaceVigente.value ? enlaceAcceso(base.value, enlaceVigente.value.token) : ''))
onMounted(async () => { base.value = await urlDeEducators() })

type Envio = 'enviando' | 'enviado' | 'fallido'
const TONO: Record<Envio, UiTone> = { enviando: 'neutral', enviado: 'lime', fallido: 'coral' }
const ICONO: Record<Envio, UiIconName> = { enviando: 'send', enviado: 'check-circle', fallido: 'warning' }
const envio = ref<Envio | null>(null)
const motivo = ref('')
const creando = ref(false)
const revocando = ref(false)
const revocandoEnCurso = ref(false)

const textoEnvio = computed(() => {
  const correo = educador.value?.email ?? ''
  if (envio.value === 'enviado') return t('educators.linkSent', { correo })
  if (envio.value === 'fallido') return t('invMail.failed', { motivo: motivo.value })
  return t('educators.linkSending', { correo })
})

async function enviar() {
  const id = props.educadorId
  if (id === null || envio.value === 'enviando') return
  envio.value = 'enviando'
  const r = await enviarCorreoAcceso(id)
  if (props.educadorId !== id) return
  motivo.value = sinPuntoFinal(r.error ?? t('invMail.unreachable'))
  envio.value = r.ok ? 'enviado' : 'fallido'
}

// Crear el enlace y mandarlo por correo enseguida, como al crear una invitación.
async function crear() {
  const id = props.educadorId
  if (id === null || creando.value) return
  creando.value = true
  const { error } = await crearAcceso(id)
  creando.value = false
  if (error) {
    toast.error(error)
    return
  }
  await enviar()
}

// Revocar el pendiente, como una invitación: deja de valer y el diálogo vuelve a ofrecer crear otro.
async function revocar() {
  const id = props.educadorId
  if (id === null) return
  revocandoEnCurso.value = true
  const { error } = await revocarAcceso(id)
  revocandoEnCurso.value = false
  revocando.value = false
  if (error) {
    toast.error(error)
    return
  }
  envio.value = null
  toast.success(t('educators.linkRevoked'))
}

async function copiar() {
  if (url.value && await copiarTexto(url.value)) toast.success(t('educators.linkCopied'))
  else toast.error(t('educators.copyFailed'))
}

// Al abrir: el estado del correo es el de la fila (InvitacionCorreo); en el alta, se crea y se envía.
watch(() => props.educadorId, (id) => {
  envio.value = null
  motivo.value = ''
  revocando.value = false
  // Con PIN (un alta que reactivó a alguien que ya lo tenía), no hace falta enlace.
  if (id !== null && props.crearAlAbrir && !enlaceVigente.value && !conPin.value) crear()
}, { immediate: true })
</script>
