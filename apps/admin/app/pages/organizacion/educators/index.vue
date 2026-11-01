<template>
  <div>
    <UiPageHeader :title="t('educators.title')" :description="t('educators.desc')">
      <template #actions>
        <UiButton variant="outline" icon="plus" @click="navigateTo('/organizacion/educators/grupo-nuevo')">
          {{ t('educators.newGroup') }}
        </UiButton>
        <UiButton icon="user-plus" @click="navigateTo('/organizacion/educators/nuevo')">
          {{ t('educators.add') }}
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- Toolbar: selector de vista + búsqueda + filtros -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <UiTabs v-model="tabModel" :items="tabItems" fit />
      <div v-if="activeTab === 'educadores'" class="flex items-center gap-3">
        <UiSearchInput v-model="searchQuery" :placeholder="t('educators.searchPh')" max-width="xs" />
        <UiSelect v-model="filterEstado" variant="toolbar" :prefix="t('educators.state')" :options="estadoOptions" />
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
              {{ educator.estado === 'activo' ? t('educators.active') : t('educators.inactive') }}
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

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <!-- Etiquetas sin significado: neutras (un grupo en lima se leería como «Activo») -->
            <UiBadge v-if="educator.grupo" tone="neutral">{{ educator.grupo }}</UiBadge>
            <UiBadge tone="neutral">{{ tCount(t, 'orgHome.talleresCount', educator.talleres) }}</UiBadge>
            <!-- El acceso solo avisa lo que falta: activación pendiente (sol) o sin código (coral). -->
            <UiBadge v-if="educator.acceso !== 'pin'" :tone="educator.acceso === 'pendiente' ? 'sun' : 'coral'">
              {{ educator.acceso === 'pendiente' ? t('educators.notActivated') : t('educators.noAccess') }}
            </UiBadge>
          </div>

          <!-- Editar la ficha (y dar de baja, dentro); el acceso a Educators, el PIN y si está activo aquí -->
          <div class="mt-4 flex items-center justify-end gap-2 border-t border-line pt-4">
            <UiButton variant="outline" size="sm" icon="pencil" :to="`/organizacion/educators/${educator.id}/editar`">
              {{ t('common.edit') }}
            </UiButton>
            <UiButton variant="outline" size="sm" icon="key" @click="abrirCodigo(educator)">
              {{ t('educators.accessPin') }}
            </UiButton>
          </div>
        </article>
      </div>

      <div v-if="!filteredEducators.length" class="ui-panel">
        <UiEmptyState
          icon="users"
          :title="educators.length ? t('educators.noResults') : t('educators.empty')"
          :text="educators.length ? t('educators.noResultsText') : t('educators.emptyText')"
        >
          <UiButton v-if="educators.length" variant="outline" size="sm" @click="resetFilters">{{ t('common.clearFilters') }}</UiButton>
          <UiButton v-else icon="user-plus" @click="navigateTo('/organizacion/educators/nuevo')">{{ t('educators.add') }}</UiButton>
        </UiEmptyState>
      </div>
    </div>

    <!-- Código de activación de Educators: se ve una sola vez; con él, el educador elige su PIN. El PIN
         solo lo conoce él (la base guarda su hash): «cambiarlo» desde Admin es generar otro código. -->
    <UiDialog :open="!!educadorCodigo" :title="t('educators.accessPin')" @update:open="(v) => { if (!v) cerrarCodigo() }">
      <template v-if="educadorCodigo">
        <p class="ui-text">
          {{ t('educators.accessIntro', { nombre: educadorCodigo.nombre }) }} <strong class="text-ink">{{ educadorCodigo.email }}</strong> {{ t('educators.accessIntro2') }}
        </p>
        <div v-if="codigo" class="mt-5 rounded-control border border-line bg-canvas px-5 py-4 text-center">
          <p class="eyebrow mb-1">{{ t('educators.codeLabel') }}</p>
          <p class="ui-stat-value font-mono tracking-widest">{{ codigo }}</p>
          <p class="ui-caption mt-2">{{ t('educators.codeShare') }}</p>
        </div>
        <p v-else class="ui-caption mt-4">
          {{ educadorCodigo.acceso === 'pin'
            ? t('educators.hasPin')
            : educadorCodigo.acceso === 'pendiente'
              ? t('educators.pendingCode')
              : t('educators.noCode') }}
        </p>

        <!-- Activo en la organización: inactivo no recibe talleres y no entra en Educators -->
        <div class="mt-6 border-t border-line pt-5">
          <UiSwitch
            :model-value="educadorCodigo.activo"
            :disabled="cambiandoActivo"
            :label="t('educators.activeLabel')"
            @update:model-value="alternarActivo"
          />
          <p class="ui-caption mt-2">{{ t('educators.activeHelp') }}</p>
        </div>
      </template>
      <template #actions>
        <UiButton v-if="!codigo" :loading="generando" icon="key" @click="generar">{{ t('educators.generate') }}</UiButton>
        <UiButton v-else icon="copy" @click="copiar">{{ t('common.copy') }}</UiButton>
      </template>
    </UiDialog>

    <!-- GRUPOS TAB: cada tarjeta lleva a su detalle (miembros, edición y borrado) -->
    <div v-if="activeTab === 'grupos'">
      <div v-if="grupos.length" class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <NuxtLink
          v-for="grupo in grupos"
          :key="grupo.id"
          :to="`/organizacion/educators/grupos/${grupo.id}`"
          class="ui-panel ui-panel-interactive block p-6"
        >
          <div class="mb-3 flex items-start gap-3">
            <UiSymbol icon="users" size="md" :tone="uiToneFor(grupo.nombre)" />
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <h3 class="truncate text-body font-extrabold text-ink">{{ grupo.nombre }}</h3>
                <UiBadge :tone="grupo.estado === 'activo' ? 'lime' : 'neutral'" :dot="grupo.estado === 'activo'" class="shrink-0">
                  {{ grupo.estado === 'activo' ? t('educators.active') : t('educators.inactive') }}
                </UiBadge>
              </div>
              <p class="ui-caption mt-1 line-clamp-2">{{ grupo.descripcion || t('educators.noDescription') }}</p>
            </div>
          </div>
          <div class="flex items-center justify-between gap-2">
            <UiBadge tone="neutral">{{ tCount(t, 'educators.members', grupo.miembros) }}</UiBadge>
            <span class="ui-link text-caption" data-tone="sky">{{ t('educators.manage') }}<UiIcon name="chevron-right" class="size-3.5" /></span>
          </div>
        </NuxtLink>
      </div>

      <div v-else class="ui-panel">
        <UiEmptyState icon="users" :title="t('educators.noGroups')" :text="t('educators.noGroupsText')">
          <!-- La acción principal de la vista ya es «Agregar Educador»: esta va neutra -->
          <UiButton variant="outline" icon="plus" @click="navigateTo('/organizacion/educators/grupo-nuevo')">{{ t('educators.createGroup') }}</UiButton>
        </UiEmptyState>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { t } = useT()
const activeTab = ref<'educadores' | 'grupos'>('educadores')
// Puente tipado: UiTabs habla en string; la pestaña es una unión cerrada.
const tabModel = computed({
  get: () => activeTab.value as string,
  set: v => (activeTab.value = v as 'educadores' | 'grupos'),
})
const searchQuery = ref('')
const filterEstado = ref('')

const estadoOptions = computed(() => [
  { value: '', label: t('common.all') },
  { value: 'activo', label: t('educators.actives') },
  { value: 'inactivo', label: t('educators.inactives') },
])

const { educators, groups: grupos, generarCodigo, cambiarActivo, refresh } = useEducators()
const { toast } = useToast()

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
  toast.success(activo ? t('educators.activeOn', { nombre: e.nombre }) : t('educators.activeOff', { nombre: e.nombre }))
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
    toast.error(error ?? t('educators.generateFailed'))
    return
  }
  codigo.value = nuevo
  refresh()
}

async function copiar() {
  if (await copiarTexto(codigo.value)) toast.success(t('educators.codeCopied'))
  else toast.error(t('educators.copyFailed'))
}

const tabItems = computed(() => [
  { value: 'educadores', label: `${t('educators.title')} · ${educators.value.length}` },
  { value: 'grupos', label: `${t('educators.groups')} · ${grupos.value.length}` },
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
