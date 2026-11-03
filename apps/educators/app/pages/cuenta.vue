<template>
  <!-- Mi perfil, con el patrón de las fichas: quién es arriba y, debajo, lo que se cambia (idioma y
       PIN) en dos tercios y sus organizaciones en el tercio de al lado. En el teléfono y la tableta
       vertical, uno debajo de otro. Salir está en el menú de la cuenta, igual que en Admin y Player. -->
  <div>
    <div class="mb-7 flex items-center gap-5">
      <UiAvatar :name="nombre" size="lg" />
      <div class="min-w-0">
        <h1 class="ui-heading truncate">{{ nombre }}</h1>
        <p class="ui-text mt-1 truncate">{{ educador?.correo }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div class="space-y-6 lg:col-span-2">
        <!-- Preferencias: el idioma de la interfaz, recordado en este dispositivo -->
        <section class="ui-panel">
          <div class="ui-panel-header">
            <div class="min-w-0">
              <h2 class="ui-title">{{ t('cuenta.preferencias') }}</h2>
              <p class="ui-caption mt-0.5">{{ t('cuenta.preferenciasTexto') }}</p>
            </div>
          </div>
          <div class="ui-panel-body">
            <UiSelect class="sm:max-w-xs" :model-value="locale" :options="IDIOMAS" :label="t('cuenta.idioma')" @update:model-value="(v) => setLocale(v as Locale)" />
          </div>
        </section>

        <!-- Su PIN: se cambia en dos pasos (CambiarPin). Sin el actual, el enlace de la organización. -->
        <section class="ui-panel">
          <div class="ui-panel-header">
            <div class="min-w-0">
              <h2 class="ui-title">{{ t('pin.titulo') }}</h2>
              <p class="ui-caption mt-0.5">{{ t('pin.tituloTexto') }}</p>
            </div>
          </div>
          <div class="ui-panel-body">
            <UiButton variant="outline" icon="key" @click="cambiando = true">{{ t('pin.cambiar') }}</UiButton>
            <p class="ui-caption mt-3">{{ t('pin.olvido') }}</p>
          </div>
        </section>
      </div>

      <!-- Sus organizaciones: una sesión puede abarcar varias -->
      <section v-if="educador?.organizaciones?.length" class="ui-panel">
        <div class="ui-panel-header">
          <div class="min-w-0">
            <h2 class="ui-title">{{ t('cuenta.organizaciones') }}</h2>
            <p class="ui-caption mt-0.5">{{ t('cuenta.organizacionesTexto') }}</p>
          </div>
        </div>
        <div class="divide-y divide-line">
          <div v-for="org in educador.organizaciones" :key="org.id" class="flex items-center gap-3 px-6 py-4">
            <!-- Organización: tono estable por nombre, como en Admin -->
            <UiSymbol size="md" :tone="uiToneFor(org.nombre)" class="text-body font-black">{{ org.nombre.charAt(0) }}</UiSymbol>
            <p class="min-w-0 flex-1 truncate text-body font-extrabold text-ink">{{ org.nombre }}</p>
          </div>
        </div>
      </section>
    </div>

    <CambiarPin :open="cambiando" @close="cambiando = false" />
  </div>
</template>

<script setup lang="ts">
import type { Locale } from '~/i18n/messages'
import { nombreCompleto } from '~/utils/sesion'

const { t, locale, setLocale } = useT()
const { educador } = useSesion()

const nombre = computed(() => (educador.value ? nombreCompleto(educador.value) : ''))
const IDIOMAS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
]

const cambiando = ref(false)

useHead({ title: computed(() => t('cuenta.titulo')) })
</script>
