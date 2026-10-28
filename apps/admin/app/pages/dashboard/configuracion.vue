<template>
  <div class="mx-auto max-w-3xl">
    <UiPageHeader :title="t('config.title')" :description="subtitulo" />

    <div v-if="cargando" class="ui-panel ui-text p-10 text-center">{{ t('common.loading') }}</div>

    <div v-else class="flex flex-col gap-6">
      <!-- Datos de la comunidad: los edita quien administra la organización (RLS) -->
      <section class="ui-panel">
        <div class="ui-panel-header">
          <div class="min-w-0">
            <h2 class="ui-title">{{ t('coms.section') }}</h2>
            <p class="ui-caption mt-0.5">{{ puedeEditar ? t('config.sectionDesc', { comunidad }) : t('config.readOnly') }}</p>
          </div>
        </div>
        <div class="ui-panel-body grid grid-cols-1 gap-5 sm:grid-cols-2">
          <UiInput v-model="form.nombre" class="sm:col-span-2" :label="t('coms.name')" :disabled="!puedeEditar" required />
          <UiTextarea v-model="form.descripcion" class="sm:col-span-2" :label="t('coms.description')" optional :rows="3" :disabled="!puedeEditar" />
          <UiInput v-model="form.correo" type="email" :label="t('coms.email')" :disabled="!puedeEditar" />
          <UiInput v-model="form.telefono" :label="t('coms.phone')" :disabled="!puedeEditar" />
          <UiSelect v-model="form.pais" class="sm:col-span-2" :label="t('coms.country')" :placeholder="t('coms.countryPh')" :options="paisOptions" :disabled="!puedeEditar" />
          <p v-if="error" class="field-error sm:col-span-2">{{ error }}</p>
        </div>
      </section>

      <!-- Organización -->
      <section class="ui-panel">
        <div class="ui-panel-header">
          <h2 class="ui-title">{{ t('config.org') }}</h2>
        </div>
        <div class="flex items-center gap-3 px-6 py-4">
          <!-- Organización: tono estable por nombre -->
          <UiSymbol size="md" :tone="uiToneFor(organizacion)" class="text-body font-black">
            {{ organizacion.charAt(0) }}
          </UiSymbol>
          <div class="min-w-0 flex-1">
            <p class="text-body font-extrabold text-ink">{{ organizacion }}</p>
            <p class="ui-caption mt-0.5">{{ t('config.orgDesc') }}</p>
          </div>
          <UiButton v-if="administraOrgActiva" variant="outline" size="sm" class="shrink-0" @click="navigateTo('/organizacion/comunidades')">
            {{ t('config.goOrg') }}
          </UiButton>
        </div>
      </section>

      <!-- Zona de peligro: eliminar es coral -->
      <section v-if="puedeEditar" class="ui-panel flex items-center gap-4 border-(--tone-tint-edge) p-5" data-tone="coral">
        <div class="min-w-0 flex-1">
          <h2 class="text-body font-extrabold text-(--tone-strong)">{{ t('coms.deleteTitle') }}</h2>
          <p class="ui-caption mt-0.5">{{ t('config.deleteDesc') }}</p>
        </div>
        <UiButton tone="coral" size="sm" class="shrink-0" @click="pedirEliminar">{{ t('common.delete') }}</UiButton>
      </section>
    </div>

    <!-- Una sola acción principal: Guardar -->
    <div v-if="puedeEditar && !cargando" class="mt-6 flex items-center justify-end gap-3">
      <UiButton variant="outline" @click="navigateTo('/dashboard')">{{ t('common.cancel') }}</UiButton>
      <UiButton :loading="guardando" icon="check" @click="submit">{{ t('common.save') }}</UiButton>
    </div>

    <!-- Borrar es PERMANENTE y cascadea: dice qué se lleva y exige escribir el nombre -->
    <UiConfirmDialog
      :open="borrando"
      :title="t('coms.deleteTitle')"
      :confirm-label="t('coms.deleteConfirm')"
      :require-text="comunidad"
      :require-label="t('coms.deleteTypeName')"
      :loading="guardando"
      @update:open="(v) => borrando = v"
      @confirm="confirmarEliminar"
    >
      <p>{{ t('coms.deleteWarn', { nombre: comunidad }) }}</p>
      <ul v-if="resumen && lineasResumen.length" class="mt-3 space-y-1 font-semibold text-muted">
        <li v-for="linea in lineasResumen" :key="linea" class="flex items-center gap-2">
          <!-- Lo que se pierde: coral -->
          <span class="size-1.5 shrink-0 rounded-full bg-(--tone-fill)" data-tone="coral" />{{ linea }}
        </li>
      </ul>
      <p v-else-if="resumen" class="mt-3 text-subtle">{{ t('coms.deleteNoData') }}</p>
      <p v-else class="mt-3 text-subtle">{{ t('common.loading') }}</p>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
// Configuración de la comunidad activa. Leerla, cualquiera que la opere; editarla y eliminarla,
// quien administra su organización (la RLS de `comunidades` lo exige igual).
definePageMeta({ layout: 'dashboard' })

const { t, locale } = useT()
const { toast } = useToast()
const { comunidadActiva, orgActiva, administraOrgActiva } = useContexto()
const { fetchUser } = useAuth()
const { get, update, remove, resumenBorrado } = useComunidades()

const comunidad = computed(() => comunidadActiva.value?.nombre ?? '')
const organizacion = computed(() => orgActiva.value?.nombre ?? 'Nutrinación')
const subtitulo = computed(() => `${comunidad.value} · ${organizacion.value}`)
const puedeEditar = computed(() => administraOrgActiva.value)

const cargando = ref(true)
const guardando = ref(false)
const error = ref('')
const form = reactive({ nombre: '', descripcion: '', correo: '', telefono: '', pais: '' })

const paises = ref<{ codigo: string, nombre: Record<string, string>, bandera: string | null }[]>([])
const paisOptions = computed(() => paises.value.map(p => ({
  value: p.codigo,
  label: `${p.bandera ?? ''} ${p.nombre[locale.value] ?? p.nombre.es ?? p.codigo}`.trim(),
})))

async function cargar() {
  const id = comunidadActiva.value?.id
  if (!id) return
  cargando.value = true
  const [fila, lista] = await Promise.all([get(id), isSupabaseConfigured() ? usePlatform().listPaises() : Promise.resolve([])])
  paises.value = lista
  Object.assign(form, {
    nombre: fila?.nombre ?? comunidad.value,
    descripcion: fila?.descripcion ?? '',
    correo: fila?.correo ?? '',
    telefono: fila?.telefono ?? '',
    pais: fila?.pais ?? '',
  })
  cargando.value = false
}
watch(() => comunidadActiva.value?.id, cargar, { immediate: true })

async function submit() {
  error.value = ''
  if (!form.nombre.trim()) { error.value = t('coms.nameRequired'); return }
  if (!form.pais) { error.value = t('coms.countryRequired'); return }
  const c = comunidadActiva.value
  if (!c) return
  guardando.value = true
  const { error: e } = await update(c.id, { ...form, organizacion_id: c.organizacionId })
  guardando.value = false
  if (e) { error.value = e; return }
  toast.success(t('config.saved'))
  // El nombre sale en el switcher y la cabecera: se recarga el árbol de acceso.
  await fetchUser()
}

// ── Eliminar ─────────────────────────────────────────────────────────────────
const borrando = ref(false)
const resumen = ref<Awaited<ReturnType<typeof resumenBorrado>> | null>(null)
const lineasResumen = computed(() => {
  const r = resumen.value
  if (!r) return []
  return [
    [r.educadores, tCount(t, 'orgHome.educadoresCount', r.educadores)],
    [r.grupos, tCount(t, 'coms.gruposCount', r.grupos)],
    [r.talleres, tCount(t, 'orgHome.talleresCount', r.talleres)],
    [r.colaboradores, tCount(t, 'coms.colaboradoresCount', r.colaboradores)],
    [r.participantes, tCount(t, 'coms.participantesCount', r.participantes)],
  ].filter(([n]) => (n as number) > 0).map(([, linea]) => linea as string)
})

function pedirEliminar() {
  const id = comunidadActiva.value?.id
  if (!id) return
  resumen.value = null
  borrando.value = true
  resumenBorrado(id).then((r) => { resumen.value = r })
}

async function confirmarEliminar() {
  const id = comunidadActiva.value?.id
  if (!id) return
  guardando.value = true
  const { error: e } = await remove(id)
  guardando.value = false
  if (e) { toast.error(e); return }
  borrando.value = false
  toast.success(t('coms.deleted'))
  await fetchUser()
  navigateTo('/organizacion/comunidades')
}
</script>
