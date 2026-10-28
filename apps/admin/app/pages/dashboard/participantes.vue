<template>
  <div>
    <UiPageHeader :title="t('parts.title')" :description="t('parts.desc')" />

    <!-- El código de acceso: se reparte a las familias; cambiarlo solo impide altas nuevas. -->
    <section class="ui-panel mb-6">
      <div class="ui-panel-header">
        <div class="min-w-0">
          <h2 class="ui-title">{{ t('parts.codeTitle') }}</h2>
          <p class="ui-caption mt-0.5">{{ t('parts.codeDesc', { comunidad }) }}</p>
        </div>
      </div>
      <div class="ui-panel-body flex flex-wrap items-center gap-4">
        <p v-if="codigo" class="ui-stat-value font-mono tracking-widest">{{ codigo }}</p>
        <p v-else class="ui-text">{{ t('parts.noCode') }}</p>
        <div class="ml-auto flex gap-2">
          <UiButton v-if="codigo" variant="outline" icon="copy" @click="copiar">{{ t('parts.copy') }}</UiButton>
          <UiButton :variant="codigo ? 'outline' : undefined" icon="key" :loading="generando" @click="codigo ? (cambiando = true) : generar()">
            {{ codigo ? t('parts.change') : t('parts.generate') }}
          </UiButton>
        </div>
      </div>
    </section>

    <UiDataTable
      :columns="columns"
      :rows="participantes"
      :row-key="(p) => p.id"
      :loading="loading"
      :empty-text="t('parts.empty')"
      searchable
      :search-keys="['nombre']"
      :search-placeholder="t('parts.searchPh')"
    >
      <template #cell-nombre="{ row }">
        <div class="flex min-w-0 items-center gap-3">
          <UiAvatar :name="row.nombre" />
          <p class="truncate text-body font-extrabold text-ink">{{ row.nombre }}</p>
        </div>
      </template>
      <template #cell-perfil="{ row }">
        <span class="text-body font-semibold text-muted">{{ row.genero === 'NINA' ? t('parts.girl') : t('parts.boy') }} · {{ t('parts.years', { n: row.edad }) }}</span>
      </template>
      <template #cell-desde="{ row }">
        <span class="text-body font-semibold text-muted">{{ fechaCorta(row.unidoEn, locale) }}</span>
      </template>
      <template #cell-acciones="{ row }">
        <div class="flex items-center justify-end">
          <UiButton variant="outline" size="sm" @click.stop="quitando = row">{{ t('parts.remove') }}</UiButton>
        </div>
      </template>
    </UiDataTable>

    <!-- Cambiar el código: el anterior deja de admitir altas; quienes ya se unieron siguen -->
    <UiConfirmDialog
      :open="cambiando"
      :title="t('parts.change')"
      :confirm-label="t('parts.change')"
      :loading="generando"
      @update:open="(v) => cambiando = v"
      @confirm="generar"
    >
      <p>{{ t('parts.changeWarn') }}</p>
    </UiConfirmDialog>

    <!-- Quitar a un participante: si no es de la comunidad, conviene cambiar el código después -->
    <UiConfirmDialog
      :open="!!quitando"
      :title="t('parts.removeTitle')"
      :confirm-label="t('parts.remove')"
      :loading="quitandoEnCurso"
      @update:open="(v) => { if (!v) quitando = null }"
      @confirm="confirmarQuitar"
    >
      <p>{{ t('parts.removeWarn', { nombre: quitando?.nombre ?? '' }) }}</p>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
// Participantes de la comunidad (comunidad_participantes, 0009): perfiles de la app del hogar que se
// unieron con su código de acceso. La base solo deja ver nombre, género y edad; nunca la cuenta, sus intereses
// ni su avance.
definePageMeta({ layout: 'dashboard' })

const { t, locale } = useT()
const { comunidadActiva } = useContexto()
const { get, participantes: listar, quitarParticipante, generarCodigoAcceso } = useComunidades()
const { toast } = useToast()

type Participante = Awaited<ReturnType<typeof listar>>[number]

const participantes = ref<Participante[]>([])
const loading = ref(true)
const codigo = ref<string | null>(null)
const generando = ref(false)
const cambiando = ref(false)
const quitando = ref<Participante | null>(null)
const quitandoEnCurso = ref(false)

const comunidad = computed(() => comunidadActiva.value?.nombre ?? '')

const columns = computed(() => [
  { key: 'nombre', label: t('parts.colName') },
  { key: 'perfil', label: t('parts.colProfile') },
  { key: 'desde', label: t('parts.colSince') },
  { key: 'acciones', label: '', align: 'right' as const },
])


async function cargar() {
  const id = comunidadActiva.value?.id
  if (!id) return
  loading.value = true
  const [lista, fila] = await Promise.all([listar(id), get(id)])
  participantes.value = lista
  codigo.value = (fila?.codigo_acceso as string | null) ?? null
  loading.value = false
}

async function generar() {
  const id = comunidadActiva.value?.id
  if (!id) return
  generando.value = true
  const { codigo: nuevo, error } = await generarCodigoAcceso(id)
  generando.value = false
  cambiando.value = false
  if (error || !nuevo) {
    toast.error(error ?? t('parts.generateFailed'))
    return
  }
  codigo.value = nuevo
  toast.success(t('parts.generated'))
}

async function copiar() {
  if (await copiarTexto(codigo.value ?? '')) toast.success(t('parts.copied'))
  else toast.error(t('parts.copyFailed'))
}

async function confirmarQuitar() {
  if (!quitando.value) return
  quitandoEnCurso.value = true
  const { error } = await quitarParticipante(quitando.value.id)
  quitandoEnCurso.value = false
  if (error) {
    toast.error(error)
    return
  }
  toast.success(t('parts.removed', { nombre: quitando.value.nombre }))
  quitando.value = null
  await cargar()
}

watch(() => comunidadActiva.value?.id, cargar, { immediate: true })
</script>
