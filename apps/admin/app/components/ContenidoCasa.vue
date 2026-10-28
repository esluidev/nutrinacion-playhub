<template>
  <div>
    <UiPageHeader :title="t('casa.title')" :description="ambito === 'organizacion' ? t('casa.descOrg') : t('casa.descCom')">
      <template #actions>
        <UiButton variant="outline" icon="layers" @click="abrirTemario(null)">{{ t('casa.newTemario') }}</UiButton>
        <UiButton icon="send" @click="abrirPublicar(null)">{{ t('casa.publish') }}</UiButton>
      </template>
    </UiPageHeader>

    <!-- Lo que la página ponga antes (el perfil público de la organización) -->
    <slot />

    <p class="ui-text mb-6">{{ t('casa.intro') }}</p>

    <!-- Publicado: lo que ya ven (o verán desde su fecha) los participantes -->
    <section class="ui-panel mb-6">
      <div class="ui-panel-header">
        <h2 class="ui-title">{{ t('casa.published') }}</h2>
      </div>
      <div v-if="cargando" class="ui-panel-body ui-text">…</div>
      <p v-else-if="!publicaciones.length" class="ui-panel-body ui-text">{{ t('casa.publishedEmpty') }}</p>
      <ul v-else class="divide-y divide-line">
        <li v-for="p in publicaciones" :key="p.id" class="flex flex-wrap items-center gap-3 px-6 py-4">
          <UiSymbol :icon="p.temario ? 'layers' : 'book'" size="sm" tone="neutral" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-body font-extrabold text-ink">{{ p.temario ? loc(p.temario.titulo) : loc(p.storyboard?.titulo) }}</p>
            <p class="ui-caption">
              {{ p.temario ? t('casa.kindTemario') : t('casa.kindStoryboard') }} ·
              {{ p.comunidad ? p.comunidad.nombre : t('casa.wholeOrg') }} ·
              {{ t('casa.fromDate', { fecha: fechaCorta(p.disponible_desde, locale) }) }}
            </p>
          </div>
          <!-- Programado a futuro: información de lo próximo (cielo) -->
          <UiBadge v-if="new Date(p.disponible_desde) > new Date()" tone="sky">{{ fechaCorta(p.disponible_desde, locale) }}</UiBadge>
          <UiButton v-if="puedeGestionar(p.comunidad_id)" variant="outline" size="sm" @click="retirando = p">{{ t('casa.retire') }}</UiButton>
        </li>
      </ul>
    </section>

    <!-- Temarios: storyboards agrupados bajo un tema -->
    <section>
      <p class="eyebrow mb-3">{{ t('casa.temarios') }}</p>
      <div v-if="!cargando && !temarios.length" class="ui-panel">
        <UiEmptyState icon="layers" :title="t('casa.temarios')" :text="t('casa.temariosEmpty')">
          <UiButton size="sm" variant="outline" @click="abrirTemario(null)">{{ t('casa.newTemario') }}</UiButton>
        </UiEmptyState>
      </div>
      <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="tm in temarios" :key="tm.id" class="ui-panel flex flex-col p-6">
          <div class="mb-2 flex items-start gap-2">
            <h3 class="min-w-0 flex-1 text-body font-extrabold text-ink">{{ loc(tm.titulo) }}</h3>
            <UiBadge tone="neutral">{{ tm.comunidad ? tm.comunidad.nombre : t('casa.wholeOrg') }}</UiBadge>
          </div>
          <p v-if="tm.descripcion" class="ui-caption mb-3">{{ loc(tm.descripcion) }}</p>
          <ol class="mb-4 space-y-1">
            <li v-for="item in tm.storyboards" :key="item.orden" class="text-caption font-semibold text-muted">
              {{ item.orden }}. {{ loc(item.storyboard?.titulo) }}
            </li>
          </ol>
          <div v-if="puedeGestionar(tm.comunidad_id)" class="mt-auto flex items-center gap-2">
            <UiButton size="sm" variant="outline" icon="send" @click="abrirPublicar(tm.id)">{{ t('casa.publish') }}</UiButton>
            <UiButton size="sm" variant="outline" icon="pencil" icon-only :label="t('common.edit')" @click="abrirTemario(tm)" />
            <UiButton size="sm" variant="outline" icon="trash" icon-only :label="t('casa.deleteTemario')" @click="borrandoTemario = tm" />
          </div>
          <p v-else class="ui-caption mt-auto">{{ t('casa.readOnly') }}</p>
        </article>
      </div>
    </section>

    <!-- Temario: título, descripción y storyboards en orden -->
    <UiDialog :open="editorAbierto" :title="temarioEditando ? t('casa.editTemario') : t('casa.newTemario')" @update:open="(v) => editorAbierto = v">
      <div class="space-y-4">
        <UiInput v-model="formTemario.tituloEs" :label="t('casa.fTitleEs')" />
        <UiInput v-model="formTemario.tituloEn" :label="t('casa.fTitleEn')" />
        <UiTextarea v-model="formTemario.descripcion" :label="t('casa.fDescription')" :rows="2" />
        <div>
          <p class="field-label">{{ t('casa.fStoryboards') }}</p>
          <p class="field-help mb-2 mt-0">{{ t('casa.fStoryboardsHelp') }}</p>
          <div class="flex flex-wrap gap-2" role="group" :aria-label="t('casa.fStoryboards')">
            <button
              v-for="sb in elegibles"
              :key="sb.id"
              type="button"
              class="filter filter-sm"
              :aria-pressed="formTemario.storyboardIds.includes(sb.id)"
              @click="alternar(sb.id)"
            >
              <template v-if="formTemario.storyboardIds.includes(sb.id)">{{ formTemario.storyboardIds.indexOf(sb.id) + 1 }}.</template>
              {{ loc(sb.titulo) }}
            </button>
          </div>
        </div>
        <p v-if="errorEditor" class="field-error">{{ errorEditor }}</p>
      </div>
      <template #actions>
        <UiButton :loading="guardando" icon="check" @click="guardarTemario">{{ t('common.save') }}</UiButton>
      </template>
    </UiDialog>

    <!-- Publicar: un storyboard o un temario, para quién y desde cuándo -->
    <UiDialog :open="publicarAbierto" :title="t('casa.publish')" @update:open="(v) => publicarAbierto = v">
      <div class="space-y-4">
        <UiSelect v-model="formPublicar.tipo" :options="tipoOpciones" :label="t('casa.fKind')" />
        <UiSelect v-model="formPublicar.itemId" :options="itemOpciones" :label="t('casa.fItem')" />
        <UiSelect v-model="formPublicar.comunidadId" :options="paraOpciones" :label="t('casa.fFor')" />
        <div>
          <UiInput v-model="formPublicar.desde" type="date" :label="t('casa.fFrom')" :min="hoy" />
          <p class="field-help">{{ t('casa.fFromHelp') }}</p>
        </div>
        <p v-if="errorPublicar" class="field-error">{{ errorPublicar }}</p>
      </div>
      <template #actions>
        <UiButton :loading="guardando" icon="send" @click="confirmarPublicar">{{ t('casa.publish') }}</UiButton>
      </template>
    </UiDialog>

    <UiConfirmDialog
      :open="!!retirando"
      :title="t('casa.retire')"
      :confirm-label="t('casa.retire')"
      :loading="guardando"
      @update:open="(v) => { if (!v) retirando = null }"
      @confirm="confirmarRetirar"
    >
      <p>{{ retirando?.temario ? loc(retirando.temario.titulo) : loc(retirando?.storyboard?.titulo) }}</p>
    </UiConfirmDialog>

    <UiConfirmDialog
      :open="!!borrandoTemario"
      :title="t('casa.deleteTemario')"
      :confirm-label="t('common.delete')"
      :loading="guardando"
      @update:open="(v) => { if (!v) borrandoTemario = null }"
      @confirm="confirmarBorrarTemario"
    >
      <p>{{ t('casa.deleteTemarioWarn', { nombre: loc(borrandoTemario?.titulo) }) }}</p>
    </UiConfirmDialog>
  </div>
</template>

<script setup lang="ts">
// «Para casa»: lo que una organización (o una de sus comunidades) ofrece a sus participantes en la
// app del hogar. En la comunidad, lo de toda la organización se ve pero lo gestionan sus admins.
import type { PublicacionFila, StoryboardElegible, TemarioFila } from '~/composables/usePublicaciones'
import type { Localized } from '~/utils/types'

const props = defineProps<{ ambito: 'organizacion' | 'comunidad' }>()

const { t, locale } = useT()
const { toast } = useToast()
const { orgActiva, comunidadActiva, administraOrgActiva } = useContexto()
const { listar, storyboardsElegibles, guardarTemario: guardar, eliminarTemario, publicar, retirar } = usePublicaciones()
const { listPorOrg } = useComunidades()

const temarios = ref<TemarioFila[]>([])
const publicaciones = ref<PublicacionFila[]>([])
const elegibles = ref<StoryboardElegible[]>([])
const comunidades = ref<{ id: number, nombre: string }[]>([])
const cargando = ref(true)
const guardando = ref(false)
const hoy = new Date().toLocaleDateString('en-CA')

const organizacionId = computed(() =>
  props.ambito === 'organizacion' ? orgActiva.value?.id ?? null : comunidadActiva.value?.organizacionId ?? null)
const comunidadId = computed(() => (props.ambito === 'comunidad' ? comunidadActiva.value?.id ?? null : null))

function loc(valor: Localized | null | undefined): string {
  if (!valor) return '—'
  return valor[locale.value] ?? valor.es ?? Object.values(valor).find(v => !!v) ?? '—'
}


// Lo de una comunidad lo gestiona quien la opera; lo de toda la organización, sus admins.
function puedeGestionar(comunidad: number | null) {
  return comunidad !== null || administraOrgActiva.value
}

async function cargar() {
  if (!organizacionId.value) return
  cargando.value = true
  const [contenido, sbs, coms] = await Promise.all([
    listar(organizacionId.value, comunidadId.value),
    storyboardsElegibles(organizacionId.value),
    props.ambito === 'organizacion' ? listPorOrg(organizacionId.value) : Promise.resolve([]),
  ])
  temarios.value = contenido.temarios
  publicaciones.value = contenido.publicaciones
  elegibles.value = sbs
  comunidades.value = coms.map(c => ({ id: c.id, nombre: c.nombre }))
  cargando.value = false
}

watch(organizacionId, cargar, { immediate: true })

// ── Temario ───────────────────────────────────────────────────────────────────
const editorAbierto = ref(false)
const temarioEditando = ref<TemarioFila | null>(null)
const errorEditor = ref('')
const formTemario = reactive({ tituloEs: '', tituloEn: '', descripcion: '', storyboardIds: [] as number[] })

function abrirTemario(tm: TemarioFila | null) {
  temarioEditando.value = tm
  errorEditor.value = ''
  formTemario.tituloEs = tm?.titulo.es ?? ''
  formTemario.tituloEn = tm?.titulo.en ?? ''
  formTemario.descripcion = tm?.descripcion?.es ?? ''
  formTemario.storyboardIds = tm ? tm.storyboards.map(i => i.storyboard?.id).filter((id): id is number => !!id) : []
  editorAbierto.value = true
}

function alternar(id: number) {
  formTemario.storyboardIds = formTemario.storyboardIds.includes(id)
    ? formTemario.storyboardIds.filter(x => x !== id)
    : [...formTemario.storyboardIds, id]
}

async function guardarTemario() {
  errorEditor.value = ''
  if (!formTemario.tituloEs.trim()) { errorEditor.value = t('casa.titleRequired'); return }
  if (!formTemario.storyboardIds.length) { errorEditor.value = t('casa.storyboardsRequired'); return }
  if (!organizacionId.value) return
  const titulo: Localized = { es: formTemario.tituloEs.trim() }
  if (formTemario.tituloEn.trim()) titulo.en = formTemario.tituloEn.trim()
  guardando.value = true
  const { error } = await guardar(organizacionId.value, {
    titulo,
    descripcion: formTemario.descripcion.trim() ? { es: formTemario.descripcion.trim() } : null,
    comunidadId: temarioEditando.value ? temarioEditando.value.comunidad_id : comunidadId.value,
    storyboardIds: formTemario.storyboardIds,
  }, temarioEditando.value?.id ?? null)
  guardando.value = false
  if (error) { errorEditor.value = error; return }
  editorAbierto.value = false
  toast.success(t('casa.temarioSaved'))
  await cargar()
}

// ── Publicar ──────────────────────────────────────────────────────────────────
const publicarAbierto = ref(false)
const errorPublicar = ref('')
const formPublicar = reactive<{ tipo: 'temario' | 'storyboard', itemId: number | '', comunidadId: number | '', desde: string }>({
  tipo: 'temario', itemId: '', comunidadId: '', desde: hoy,
})

const tipoOpciones = computed(() => [
  { value: 'temario', label: t('casa.kindTemario') },
  { value: 'storyboard', label: t('casa.kindStoryboard') },
])
const itemOpciones = computed(() => formPublicar.tipo === 'temario'
  ? temarios.value.filter(tm => puedeGestionar(tm.comunidad_id)).map(tm => ({ value: tm.id, label: loc(tm.titulo) }))
  : elegibles.value.map(sb => ({ value: sb.id, label: loc(sb.titulo) })))
// En la comunidad se publica para ella (o para toda la org si administra la organización).
const paraOpciones = computed(() => {
  if (props.ambito === 'comunidad') {
    const propia = comunidadActiva.value ? [{ value: comunidadActiva.value.id, label: comunidadActiva.value.nombre }] : []
    return administraOrgActiva.value ? [...propia, { value: '', label: t('casa.wholeOrg') }] : propia
  }
  return [{ value: '', label: t('casa.wholeOrg') }, ...comunidades.value.map(c => ({ value: c.id, label: c.nombre }))]
})
watch(() => formPublicar.tipo, () => { formPublicar.itemId = '' })

function abrirPublicar(temarioId: number | null) {
  errorPublicar.value = ''
  formPublicar.tipo = temarioId || temarios.value.length ? 'temario' : 'storyboard'
  formPublicar.itemId = temarioId ?? ''
  formPublicar.comunidadId = props.ambito === 'comunidad' ? comunidadActiva.value?.id ?? '' : ''
  formPublicar.desde = hoy
  publicarAbierto.value = true
}

async function confirmarPublicar() {
  errorPublicar.value = ''
  if (!formPublicar.itemId) { errorPublicar.value = t('casa.itemRequired'); return }
  if (!organizacionId.value) return
  guardando.value = true
  const { error } = await publicar(organizacionId.value, {
    comunidadId: formPublicar.comunidadId || null,
    storyboardId: formPublicar.tipo === 'storyboard' ? Number(formPublicar.itemId) : null,
    temarioId: formPublicar.tipo === 'temario' ? Number(formPublicar.itemId) : null,
    disponibleDesde: formPublicar.desde,
  })
  guardando.value = false
  if (error) { errorPublicar.value = error; return }
  publicarAbierto.value = false
  toast.success(t('casa.publishedOk'))
  await cargar()
}

// ── Retirar y borrar ──────────────────────────────────────────────────────────
const retirando = ref<PublicacionFila | null>(null)
const borrandoTemario = ref<TemarioFila | null>(null)

async function confirmarRetirar() {
  if (!retirando.value) return
  guardando.value = true
  const { error } = await retirar(retirando.value.id)
  guardando.value = false
  if (error) { toast.error(error); return }
  retirando.value = null
  toast.success(t('casa.retired'))
  await cargar()
}

async function confirmarBorrarTemario() {
  if (!borrandoTemario.value) return
  guardando.value = true
  const { error } = await eliminarTemario(borrandoTemario.value.id)
  guardando.value = false
  if (error) { toast.error(error); return }
  borrandoTemario.value = null
  toast.success(t('casa.temarioDeleted'))
  await cargar()
}
</script>
