<template>
  <div>
    <UiPageHeader title="Educadores" description="Tu equipo y sus grupos de trabajo">
      <template #actions>
        <UiButton variant="outline" icon="plus" @click="navigateTo('/dashboard/educators/grupo-nuevo')">
          Nuevo Grupo
        </UiButton>
        <UiButton icon="user-plus" @click="navigateTo('/dashboard/educators/nuevo')">
          Agregar Educador
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- Toolbar: selector de vista + búsqueda + filtros -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <UiTabs v-model="tabModel" :items="tabItems" fit />
      <div v-if="activeTab === 'educadores'" class="flex items-center gap-3">
        <UiSearchInput v-model="searchQuery" placeholder="Buscar educador…" max-width="xs" />
        <UiSelect v-model="filterEstado" variant="toolbar" prefix="Estado" :options="estadoOptions" />
      </div>
    </div>

    <!-- EDUCADORES TAB -->
    <div v-if="activeTab === 'educadores'">
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="educator in filteredEducators"
          :key="educator.id"
          class="ui-panel p-6"
        >
          <div class="mb-5 flex items-center gap-3">
            <UiAvatar :name="educator.nombre" :initials="educator.initials" size="lg" />
            <div class="min-w-0 flex-1">
              <h3 class="truncate text-body font-extrabold text-ink">{{ educator.nombre }}</h3>
              <p class="mt-0.5 text-caption font-semibold text-muted">{{ educator.profesion }}</p>
            </div>
            <UiBadge :tone="educator.estado === 'activo' ? 'lime' : 'neutral'" :dot="educator.estado === 'activo'" class="shrink-0">
              {{ educator.estado === 'activo' ? 'Activo' : 'Inactivo' }}
            </UiBadge>
          </div>

          <div class="flex flex-col gap-2 rounded-control-sm border border-line bg-canvas p-3.5">
            <div class="flex items-center gap-2.5 text-caption font-semibold text-muted">
              <UiIcon name="mail" class="size-3.5 shrink-0 text-subtle" />
              <span class="truncate">{{ educator.email }}</span>
            </div>
            <div class="flex items-center gap-2.5 text-caption font-semibold text-muted">
              <UiIcon name="phone" class="size-3.5 shrink-0 text-subtle" />
              {{ educator.telefono }}
            </div>
          </div>

          <div class="mt-4 flex items-center gap-2">
            <!-- Etiquetas sin significado: neutras (un grupo en lima se leería como «Activo») -->
            <UiBadge v-if="educator.grupo" tone="neutral">{{ educator.grupo }}</UiBadge>
            <UiBadge tone="neutral">{{ educator.talleres }} talleres</UiBadge>
            <!-- El acceso solo avisa lo que falta: activación pendiente (sol) o sin código (coral). -->
            <UiBadge v-if="educator.acceso !== 'pin'" :tone="educator.acceso === 'pendiente' ? 'sun' : 'coral'">
              {{ educator.acceso === 'pendiente' ? 'Sin activar' : 'Sin acceso' }}
            </UiBadge>
            <UiButton class="ml-auto" variant="outline" size="sm" icon="key" @click="abrirCodigo(educator)">
              Acceso
            </UiButton>
          </div>
        </article>
      </div>

      <div v-if="!filteredEducators.length" class="ui-panel">
        <UiEmptyState icon="search" title="No se encontraron educadores" text="Intenta ajustar los filtros de búsqueda">
          <UiButton variant="outline" size="sm" @click="resetFilters">Limpiar filtros</UiButton>
        </UiEmptyState>
      </div>
    </div>

    <!-- Código de activación de Educators: se ve una sola vez; con él, el educador elige su PIN. -->
    <UiDialog :open="!!educadorCodigo" title="Acceso a Educators" @update:open="(v) => { if (!v) cerrarCodigo() }">
      <template v-if="educadorCodigo">
        <p class="ui-text">
          {{ educadorCodigo.nombre }} entra en Educators con <strong class="text-ink">{{ educadorCodigo.email }}</strong> y un PIN de
          6 dígitos que elige la primera vez, con el código de activación que generas aquí.
        </p>
        <div v-if="codigo" class="mt-5 rounded-control border border-line bg-canvas px-5 py-4 text-center">
          <p class="eyebrow mb-1">Código de activación</p>
          <p class="ui-stat-value font-mono tracking-widest">{{ codigo }}</p>
          <p class="ui-caption mt-2">Compártelo ahora: después solo se puede generar otro.</p>
        </div>
        <p v-else class="ui-caption mt-4">
          {{ educadorCodigo.acceso === 'pin'
            ? 'Ya eligió su PIN. Si lo olvidó, genera un código nuevo: su PIN deja de valer y se cierran sus sesiones.'
            : 'Aún no tiene PIN. Si ya tenía un código, el nuevo lo sustituye.' }}
        </p>

        <!-- Su vínculo con esta comunidad: inactivo no recibe talleres nuevos -->
        <div class="mt-6 border-t border-line pt-5">
          <UiSwitch
            :model-value="educadorCodigo.activo"
            :disabled="cambiandoActivo"
            :label="`Activo en ${comunidadNombre}`"
            @update:model-value="alternarActivo"
          />
          <p class="ui-caption mt-2">
            Inactivo: no se le asignan talleres nuevos y esta comunidad deja de aparecer en su Educators. Los talleres que ya tiene
            asignados los sigue viendo.
          </p>
        </div>
      </template>
      <template #actions>
        <UiButton v-if="!codigo" :loading="generando" icon="key" @click="generar">Generar código de activación</UiButton>
        <UiButton v-else icon="copy" @click="copiar">Copiar</UiButton>
      </template>
    </UiDialog>

    <!-- GRUPOS TAB -->
    <div v-if="activeTab === 'grupos'">
      <div v-if="grupos.length" class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="grupo in grupos"
          :key="grupo.id"
          class="ui-panel p-6"
        >
          <div class="mb-3 flex items-start gap-3">
            <UiSymbol icon="users" size="md" :tone="uiToneFor(grupo.nombre)" />
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <h3 class="truncate text-body font-extrabold text-ink">{{ grupo.nombre }}</h3>
                <UiBadge :tone="grupo.estado === 'activo' ? 'lime' : 'neutral'" :dot="grupo.estado === 'activo'" class="shrink-0">
                  {{ grupo.estado === 'activo' ? 'Activo' : 'Inactivo' }}
                </UiBadge>
              </div>
              <p class="ui-caption mt-1 line-clamp-2">{{ grupo.descripcion }}</p>
            </div>
          </div>
          <UiBadge tone="neutral">{{ grupo.miembros }} miembros</UiBadge>
        </article>
      </div>

      <div v-else class="ui-panel">
        <UiEmptyState icon="users" title="No hay grupos" text="Crea un grupo para organizar a los educadores por zona o especialidad.">
          <!-- La acción principal de la vista ya es «Agregar Educador»: esta va neutra -->
          <UiButton variant="outline" icon="plus" @click="navigateTo('/dashboard/educators/grupo-nuevo')">Crear Grupo</UiButton>
        </UiEmptyState>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const activeTab = ref<'educadores' | 'grupos'>('educadores')
// Puente tipado: UiTabs habla en string; la pestaña es una unión cerrada.
const tabModel = computed({
  get: () => activeTab.value as string,
  set: v => (activeTab.value = v as 'educadores' | 'grupos'),
})
const searchQuery = ref('')
const filterEstado = ref('')

const estadoOptions = [
  { value: '', label: 'Todos' },
  { value: 'activo', label: 'Activos' },
  { value: 'inactivo', label: 'Inactivos' },
]

const { educators, groups: grupos, generarCodigo, cambiarActivo, refresh } = useEducators()
const { toast } = useToast()
const { comunidadActiva } = useContexto()
const comunidadNombre = computed(() => comunidadActiva.value?.nombre ?? 'esta comunidad')

// ── Código de acceso ──────────────────────────────────────────────────────────
const educadorCodigo = ref<{ id: number, nombre: string, email: string, acceso: string, activo: boolean } | null>(null)
const codigo = ref('')
const generando = ref(false)
const cambiandoActivo = ref(false)

function abrirCodigo(educator: { id: number, nombre: string, email: string, acceso: string, estado: string }) {
  educadorCodigo.value = { id: educator.id, nombre: educator.nombre, email: educator.email, acceso: educator.acceso, activo: educator.estado === 'activo' }
  codigo.value = ''
}

async function alternarActivo(activo: boolean) {
  const e = educadorCodigo.value
  if (!e) return
  cambiandoActivo.value = true
  const { error } = await cambiarActivo(e.id, activo)
  cambiandoActivo.value = false
  if (error) {
    toast.error(error)
    return
  }
  e.activo = activo
  toast.success(activo ? `${e.nombre} está activo en ${comunidadNombre.value}.` : `${e.nombre} queda inactivo en ${comunidadNombre.value}.`)
}

function cerrarCodigo() {
  educadorCodigo.value = null
  codigo.value = ''
}

async function generar() {
  if (!educadorCodigo.value) return
  generando.value = true
  const { codigo: nuevo, error } = await generarCodigo(educadorCodigo.value.id)
  generando.value = false
  if (error || !nuevo) {
    toast.error(error ?? 'No se pudo generar el código.')
    return
  }
  codigo.value = nuevo
  refresh()
}

async function copiar() {
  if (await copiarTexto(codigo.value)) toast.success('Código copiado.')
  else toast.error('No se pudo copiar: anótalo a mano.')
}

const tabItems = computed(() => [
  { value: 'educadores', label: `Educadores · ${educators.value.length}` },
  { value: 'grupos', label: `Grupos · ${grupos.value.length}` },
])

function resetFilters() {
  searchQuery.value = ''
  filterEstado.value = ''
}

const filteredEducators = computed(() => {
  return educators.value.filter((educator) => {
    const matchesSearch = searchQuery.value === ''
      || educator.nombre.toLowerCase().includes(searchQuery.value.toLowerCase())
      || educator.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesEstado = filterEstado.value === '' || educator.estado === filterEstado.value
    return matchesSearch && matchesEstado
  })
})
</script>
