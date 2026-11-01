<template>
  <div class="mx-auto max-w-xl">
    <h1 class="ui-heading mb-6">{{ t('cuenta.titulo') }}</h1>
    <UiCard>
      <div class="flex items-center gap-4">
        <UiAvatar :name="nombre" size="lg" />
        <div class="min-w-0">
          <p class="ui-title truncate">{{ nombre }}</p>
          <p class="ui-caption truncate">{{ educador?.correo }}</p>
        </div>
      </div>
      <!-- Dónde trabaja: sus organizaciones (una sesión puede abarcar varias). -->
      <dl v-if="educador?.organizaciones?.length" class="mt-6">
        <dt class="ui-caption">{{ t('cuenta.organizaciones') }}</dt>
        <dd v-for="org in educador.organizaciones" :key="org.id" class="font-black">{{ org.nombre }}</dd>
      </dl>
    </UiCard>
    <UiCard class="mt-6">
      <p class="field-label">{{ t('cuenta.idioma') }}</p>
      <UiTabs :model-value="locale" :items="[{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }]" :label="t('cuenta.idioma')" @update:model-value="(v) => setLocale(v as 'es' | 'en')" />
    </UiCard>
    <UiCard class="mt-6">
      <form class="space-y-5" novalidate @submit.prevent="cambiar">
        <div>
          <h2 class="ui-title">{{ t('pin.cambiar') }}</h2>
          <p class="ui-text mt-1">{{ t('pin.cambiarTexto') }}</p>
        </div>
        <UiInput
          v-model="nuevo"
          :label="t('pin.nuevo')"
          type="password"
          inputmode="numeric"
          autocomplete="new-password"
          :hint="t('pin.ayuda')"
          :error="error === 'pin_invalido' ? t('pin.errorInvalido') : undefined"
          size="lg"
        />
        <UiInput
          v-model="repetido"
          :label="t('pin.repetir')"
          type="password"
          inputmode="numeric"
          autocomplete="new-password"
          :error="error === 'no_coinciden' ? t('pin.errorNoCoinciden') : undefined"
          size="lg"
        />
        <UiAlert v-if="error === 'red'" tone="warning">{{ t('pin.errorRed') }}</UiAlert>
        <UiButton type="submit" variant="outline" icon="key" block :loading="guardando">{{ t('pin.cambiar') }}</UiButton>
      </form>
    </UiCard>
    <UiButton class="mt-6" block size="lg" variant="outline" icon="logout" @click="salir">{{ t('cuenta.salir') }}</UiButton>
  </div>
</template>

<script setup lang="ts">
import type { ErrorPin } from '~/composables/useSesion'
import { nombreCompleto } from '~/utils/sesion'

const { t, locale, setLocale } = useT()
const { educador, salir, cambiarPin } = useSesion()
const { toast } = useToast()

const nombre = computed(() => (educador.value ? nombreCompleto(educador.value) : ''))

// Cambiar el PIN: 6 dígitos, dos veces. Vale para todos sus accesos de la sesión.
const nuevo = ref('')
const repetido = ref('')
const error = ref<ErrorPin | null>(null)
const guardando = ref(false)

async function cambiar() {
  guardando.value = true
  error.value = await cambiarPin(nuevo.value, repetido.value)
  guardando.value = false
  if (error.value) return
  nuevo.value = repetido.value = ''
  toast.success(t('pin.cambiado'))
}

useHead({ title: computed(() => t('cuenta.titulo')) })
</script>
