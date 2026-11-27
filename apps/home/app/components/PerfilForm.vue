<template>
  <!-- Crear o editar un perfil: el avatar (los seis animales, sin etiqueta: se entiende), el nombre, el mes y el año de
       nacimiento y el género. Se guarda en el dispositivo (y, con la cuenta, también en ella). Con otros perfiles ya
       creados, «Cancelar» vuelve atrás; la primera vez, «Ya Tengo Cuenta» lleva a entrar con la cuenta. -->
  <form novalidate @submit.prevent="guardar">
    <div class="flex items-center justify-between gap-3">
      <h1 class="ui-title">{{ perfil ? t('perfil.editar') : t('perfil.nuevo') }}</h1>
      <UiButton v-if="perfil" type="button" tone="neutral" size="sm" icon="trash" icon-only :label="t('perfil.eliminar')" :title="t('perfil.eliminar')" @click="eliminando = true" />
    </div>
    <div class="mt-6 space-y-5">
      <div>
        <div class="avatares" role="group" :aria-label="t('perfil.avatar')">
          <button v-for="a in AVATARES" :key="a.clave" type="button" class="avatar-opcion" :aria-pressed="borrador.avatar === a.clave" :aria-label="a.nombre" @click="borrador.avatar = a.clave">
            <UiAvatar :name="a.nombre" :src="dibujoDe(a.clave)" :tone="a.tono" size="lg" />
          </button>
        </div>
      </div>
      <UiInput v-model="borrador.nombre" :label="t('perfil.nombre')" />
      <div>
        <p class="field-label">{{ t('perfil.nacimiento') }}</p>
        <div class="grid grid-cols-2 gap-3">
          <UiSelect v-model="borrador.mes" :options="meses" :placeholder="t('perfil.mes')" />
          <UiSelect v-model="borrador.anio" :options="anios" :placeholder="t('perfil.anio')" />
        </div>
      </div>
      <div>
        <p class="field-label">{{ t('perfil.genero') }}</p>
        <UiChips v-model="genero" :items="generos" />
      </div>
      <p v-if="intento && falta.length" class="field-error">{{ t('perfil.falta', { campos: falta.map(c => t(`perfil.${c}`)).join(', ') }) }}</p>
      <!-- Abajo, solo guardar y, si hay a dónde volver, cancelar; eliminar es la papelera junto al título (Luis: no
           amontonar botones). -->
      <div class="flex gap-3 pt-5">
        <UiButton v-if="perfil" type="button" variant="outline" class="flex-1" to="/inicio">{{ t('perfil.cancelar') }}</UiButton>
        <UiButton v-else-if="perfiles.length" type="button" variant="outline" class="flex-1" to="/">{{ t('perfil.cancelar') }}</UiButton>
        <UiButton v-else type="button" variant="outline" class="flex-1" to="/cuenta">{{ t('perfil.tengoCuenta') }}</UiButton>
        <UiButton type="submit" class="flex-1">{{ perfil ? t('perfil.guardar') : t('perfil.crear') }}</UiButton>
      </div>
    </div>
    <UiConfirmDialog
      v-if="perfil"
      :open="eliminando"
      :title="t('perfil.eliminar')"
      :confirm-label="t('perfil.eliminar')"
      symbol="trash"
      @update:open="(v: boolean) => (eliminando = v)"
      @confirm="eliminar"
    >
      {{ t('perfil.eliminarTexto', { nombre: perfil.nombre }) }}
    </UiConfirmDialog>
  </form>
</template>

<script setup lang="ts">
import { AVATARES, limpiarApodo } from '@playhub/ui/app/utils/avatares'
import type { Avatar } from '@playhub/ui/app/utils/avatares'
import { aniosDeNacimiento, faltaEnPerfil, GENEROS, nuevoIdDePerfil } from '~/utils/perfiles'
import type { BorradorPerfil, Genero, Perfil } from '~/utils/perfiles'

const props = defineProps<{ perfil?: Perfil | null }>()

const { t } = useT()
const { perfiles, guardarPerfil, eliminarPerfil, elegir } = useHogar()

const borrador = reactive<BorradorPerfil>({
  nombre: props.perfil?.nombre ?? '',
  avatar: props.perfil?.avatar ?? null,
  mes: props.perfil?.mes ?? null,
  anio: props.perfil?.anio ?? null,
  genero: props.perfil?.genero ?? null,
})
const genero = computed({ get: () => borrador.genero ?? '', set: (v: string) => { borrador.genero = v as Genero } })
const meses = computed(() => Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: t(`mes.${i + 1}`) })))
const anios = aniosDeNacimiento().map(a => ({ value: a, label: String(a) }))
const generos = computed(() => GENEROS.map(g => ({ value: g, label: t(`perfil.${g}`) })))
const falta = computed(() => faltaEnPerfil(borrador))
const intento = ref(false)
const eliminando = ref(false)

function guardar() {
  intento.value = true
  if (falta.value.length) return
  const perfil: Perfil = {
    id: props.perfil?.id ?? nuevoIdDePerfil(),
    nombre: limpiarApodo(borrador.nombre)!,
    avatar: borrador.avatar as Avatar,
    mes: borrador.mes!,
    anio: borrador.anio!,
    genero: borrador.genero!,
  }
  guardarPerfil(perfil)
  // Un perfil nuevo empieza a jugar; uno editado (desde el menú de quien juega) vuelve a su inicio.
  if (props.perfil) navigateTo('/inicio')
  else {
    elegir(perfil.id)
    navigateTo('/inicio')
  }
}

function eliminar() {
  if (!props.perfil) return
  eliminarPerfil(props.perfil.id)
  eliminando.value = false
  navigateTo('/')
}
</script>
