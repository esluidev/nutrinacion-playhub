<template>
  <!-- El inicio de la organización, para quien la opera (administrador o colaborador): sus datos,
       su contrato, los países donde opera, las cifras de la operación, los próximos talleres y los
       accesos rápidos. Sin educadores ni talleres, los primeros pasos. Editar datos y licencia
       siguen siendo del operador (Platform). -->
  <div>
    <UiPageHeader :title="greeting" :description="headerDesc">
      <template #actions>
        <UiButton icon="plus" @click="navigateTo('/organizacion/workshops/new')">
          {{ t('orgHome.newWorkshop') }}
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- Primeros pasos: sin equipo ni talleres todavía, el camino en orden -->
    <section v-if="!cargando && primerosPasos" class="ui-panel mb-6 overflow-hidden">
      <div class="ui-panel-header">
        <div>
          <h2 class="ui-title">{{ t('orgHome.firstStepsTitle') }}</h2>
          <p class="ui-caption mt-0.5">{{ t('orgHome.firstStepsText') }}</p>
        </div>
      </div>
      <div class="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <NuxtLink
          v-for="(paso, i) in pasos"
          :key="paso.to"
          :to="paso.to"
          class="flex items-start gap-3 px-6 py-5 transition-colors hover:bg-canvas"
        >
          <span :data-tone="paso.hecho ? 'lime' : 'night'" class="ui-dot size-8 shrink-0 text-caption">
            <UiIcon v-if="paso.hecho" name="check" class="size-4" />
            <span v-else>{{ i + 1 }}</span>
          </span>
          <span class="min-w-0">
            <span class="block text-body font-extrabold text-ink">{{ paso.titulo }}</span>
            <span class="ui-caption mt-0.5 block">{{ paso.texto }}</span>
          </span>
        </NuxtLink>
      </div>
    </section>

    <!-- Cifras: cada símbolo lleva el tono de lo que mide (próximos en cielo; en curso en sol; el resto, neutro) -->
    <div class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div v-for="stat in stats" :key="stat.label" class="ui-panel ui-stat">
        <UiSymbol size="md" :icon="stat.icon" :tone="stat.tone" />
        <div class="min-w-0">
          <p class="flex items-baseline gap-1.5">
            <span class="ui-stat-value">{{ stat.value }}</span>
            <span v-if="stat.sub" class="ui-caption">{{ stat.sub }}</span>
          </p>
          <p class="ui-stat-label">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <!-- Columna principal (2/3) -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Próximos talleres: el día y la hora llevan el tono de la sesión (hoy en sol, próxima en cielo) -->
        <section class="ui-panel overflow-hidden">
          <header class="ui-panel-header">
            <h3 class="ui-title">{{ t('orgHome.upcomingList') }}</h3>
            <NuxtLink to="/organizacion/planner" class="ui-link text-body" data-tone="sky">
              {{ t('orgHome.openPlanner') }}
              <UiIcon name="chevron-right" class="size-3.5" />
            </NuxtLink>
          </header>

          <div class="divide-y divide-line">
            <div
              v-for="workshop in programados"
              :key="workshop.id"
              :data-tone="workshop.tone"
              class="flex cursor-pointer items-center gap-4 px-6 py-4 transition-colors hover:bg-canvas"
              @click="navigateTo('/organizacion/workshops/' + workshop.id)"
            >
              <span class="ui-time w-14">
                <span>{{ dowShort(workshop.date) }}</span>
                <strong>{{ domNum(workshop.date) }}</strong>
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-body font-extrabold text-ink">{{ workshop.title }}</p>
                <p class="ui-caption mt-0.5 truncate">
                  <span class="font-extrabold tabular-nums text-(--tone-strong)">{{ workshop.time }}</span> · {{ workshop.location }}<template v-if="workshop.jornada"> · {{ workshop.jornada.nombre }}</template>
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-2.5">
                <UiAvatar :name="workshop.educator" :initials="workshop.initials" size="sm" />
                <span class="hidden text-caption font-semibold text-muted sm:block">{{ workshop.educator }}</span>
              </div>
            </div>
          </div>
          <p v-if="!programados.length" class="ui-caption px-6 py-8 text-center">
            {{ t('orgHome.noUpcoming') }}
          </p>
        </section>

        <!-- Licencia: el contrato (estado y vigencia; sin cupos, decisión 011) y los países donde opera -->
        <section class="ui-panel overflow-hidden">
          <div class="ui-panel-header">
            <h2 class="ui-title">{{ t('orgHome.license') }}</h2>
            <UiBadge v-if="lic" :tone="licenciaTone(lic.estado)" dot>{{ t('state.' + lic.estado) }}</UiBadge>
          </div>
          <div v-if="lic" class="flex flex-wrap items-center gap-7 px-6 py-4">
            <div class="flex items-center gap-2 text-caption font-semibold text-muted">
              <UiIcon name="calendar" class="size-3.5 text-subtle" />
              {{ t('orgHome.validity') }}: <span class="font-extrabold text-ink">{{ fechaCorta(lic.fecha_inicio, locale) }} – {{ lic.fecha_fin ? fechaCorta(lic.fecha_fin, locale) : t('orgHome.noEnd') }}</span>
              <!-- Ya vencida → coral; vence en 30 días o menos → sol; si falta más, sin tono -->
              <span
                v-if="venceEn !== null"
                :data-tone="venceEn < 0 ? 'coral' : venceEn <= 30 ? 'sun' : undefined"
                :class="['font-extrabold', venceEn <= 30 ? 'text-(--tone-strong)' : 'text-subtle']"
              >· {{ venceLabel }}</span>
            </div>
          </div>
          <!-- Sin licencia: le falta lo necesario para operar (coral) -->
          <p v-else class="px-6 py-4 text-body font-bold text-(--tone-strong)" data-tone="coral">{{ t('orgHome.noLicense') }}</p>
          <div class="flex flex-wrap items-center gap-2 border-t border-line px-6 py-3.5">
            <span class="text-caption font-semibold text-muted">{{ t('orgHome.countries') }}:</span>
            <UiBadge v-for="p in org?.paises ?? []" :key="p" tone="neutral">{{ etiquetaPais(p) }}</UiBadge>
          </div>
          <p v-if="lic?.notas" class="ui-text border-t border-line px-6 py-3.5">{{ lic.notas }}</p>
        </section>
      </div>

      <!-- Columna lateral (1/3) -->
      <div class="space-y-6">
        <!-- Accesos rápidos: cada acceso con el tono de lo que abre, no todos en lima -->
        <section>
          <h3 class="ui-title mb-3">{{ t('orgHome.quickActions') }}</h3>
          <div class="space-y-3">
            <button
              v-for="action in quickActions"
              :key="action.label"
              type="button"
              class="ui-panel ui-panel-interactive flex w-full items-center gap-3 p-4 text-left"
              @click="navigateTo(action.to)"
            >
              <UiSymbol size="md" :icon="action.icon" :tone="action.tone" />
              <span class="min-w-0 flex-1">
                <span class="block text-body font-extrabold leading-tight text-ink">{{ action.label }}</span>
                <span class="ui-caption mt-0.5 block">{{ action.sub }}</span>
              </span>
              <UiIcon name="chevron-right" class="size-4 text-subtle" />
            </button>
          </div>
        </section>

        <!-- La organización: datos y, si administras, sus administradores -->
        <section class="ui-panel px-6 py-5">
          <div class="mb-4 flex items-center gap-3">
            <UiSymbol size="sm" :tone="uiToneFor(org?.nombre ?? '?')">{{ (org?.nombre ?? '?').charAt(0).toUpperCase() }}</UiSymbol>
            <div class="min-w-0">
              <p class="truncate text-body font-extrabold text-ink">{{ org?.nombre }}</p>
              <p class="ui-caption truncate">{{ tipoLabel ?? t('orgHome.noType') }}</p>
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <div v-if="org?.correo" class="flex items-center gap-2.5 text-body font-semibold text-muted">
              <UiIcon name="mail" class="size-4 shrink-0 text-subtle" />
              <span class="truncate">{{ org.correo }}</span>
            </div>
            <div v-if="org?.telefono" class="flex items-center gap-2.5 text-body font-semibold text-muted">
              <UiIcon name="phone" class="size-4 shrink-0 text-subtle" />
              {{ org.telefono }}
            </div>
            <div v-if="org?.website" class="flex min-w-0 items-center gap-2.5 text-body">
              <UiIcon name="globe" class="size-4 shrink-0 text-subtle" />
              <a :href="websiteHref(org.website)" target="_blank" rel="noopener noreferrer" class="ui-link min-w-0" data-tone="sky">
                <span class="min-w-0 truncate">{{ org.website }}</span>
              </a>
            </div>
            <div class="my-0.5 h-px bg-line" />
            <div class="flex items-center justify-between text-caption">
              <span class="font-semibold text-muted">{{ t('orgHome.owner') }}</span>
              <span v-if="titular" class="max-w-40 truncate font-extrabold text-ink">{{ nombreAdmin(titular) }}</span>
              <!-- Sin titular: pendiente de designarlo (sol) -->
              <span v-else class="font-bold text-(--tone-strong)" data-tone="sun">{{ t('orgHome.noOwner') }}</span>
            </div>
            <div class="flex items-center justify-between text-caption">
              <span class="font-semibold text-muted">{{ t('orgHome.admins') }}</span>
              <span class="font-extrabold text-ink">{{ org?.administradores.length ?? 0 }}</span>
            </div>
          </div>
          <NuxtLink v-if="administraOrgActiva" to="/organizacion/administradores" class="ui-link mt-4 text-caption" data-tone="sky">
            {{ t('admins.viewAll') }}
            <UiIcon name="chevron-right" class="size-3.5" />
          </NuxtLink>
        </section>

        <!-- Equipo -->
        <section class="ui-panel p-6">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="ui-title">{{ t('orgHome.team') }}</h3>
            <NuxtLink to="/organizacion/educators" class="ui-link text-body" data-tone="sky">
              {{ t('orgHome.viewAll') }}
            </NuxtLink>
          </div>
          <div v-if="teamMembers.length" class="space-y-3.5">
            <div
              v-for="edu in teamMembers"
              :key="edu.id"
              class="flex items-center gap-3"
            >
              <UiAvatar :name="edu.nombre" :initials="edu.initials" />
              <div class="min-w-0">
                <p class="truncate text-body font-extrabold text-ink">{{ edu.nombre }}</p>
                <p class="ui-caption">{{ edu.profesion }}</p>
              </div>
            </div>
          </div>
          <p v-else class="ui-caption">{{ t('orgHome.noTeam') }}</p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UiTone } from '@playhub/ui/app/utils/ui-tones'
import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'
import type { AdminDeOrg, OrgDetalle } from '~/composables/useOrganizacion'
import type { JornadaFila } from '~/composables/useJornadas'
import { fechaEnJornada } from '~/utils/jornadas'

definePageMeta({ layout: 'dashboard', titleKey: 'nav.dashboard' })

const { t, locale } = useT()
const { orgActiva, administraOrgActiva } = useContexto()
const { getOrganizacion } = useOrganizacion()
const { workshops, loading: cargandoTalleres } = useWorkshops()
const { activeEducators, educators, loading: cargandoEducadores } = useEducators()
const { etiqueta: etiquetaPais, cargar: cargarPaises } = usePaises()

const org = ref<OrgDetalle | null>(null)
const jornadas = ref<JornadaFila[]>([])
const cargando = computed(() => cargandoTalleres.value || cargandoEducadores.value)

// Saludo por hora del día + nombre del usuario.
const nombre = computed(() => (isSupabaseConfigured() ? useAuth().user.value?.perfil?.nombre || '' : ''))
const greeting = computed(() => {
  const h = new Date().getHours()
  const saludo = h < 12 ? t('orgHome.morning') : h < 19 ? t('orgHome.afternoon') : t('orgHome.evening')
  return nombre.value ? `${saludo}, ${nombre.value}` : saludo
})
const headerDesc = computed(() => t('orgHome.desc', { org: orgActiva.value?.nombre ?? t('common.myOrg') }))

const tipoLabel = computed(() => {
  const n = org.value?.tipo?.nombre
  return n ? (n[locale.value] ?? n.es ?? null) : null
})

// Se muestra la licencia más reciente; su historial vive en Platform.
const lic = computed(() => [...(org.value?.licencias ?? [])].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0] ?? null)
const venceEn = computed(() => (lic.value?.fecha_fin ? diasHasta(lic.value.fecha_fin) : null))
const venceLabel = computed(() => {
  if (venceEn.value === null) return ''
  return venceEn.value < 0 ? t('orgHome.expiredAgo', { n: -venceEn.value }) : t('orgHome.expiresIn', { n: venceEn.value })
})

const titular = computed(() => org.value?.administradores.find(a => a.titular) ?? null)
function nombreAdmin(a: AdminDeOrg) {
  const p = a.perfil
  return (p ? `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim() : '') || p?.email || '—'
}
function websiteHref(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

// Fechas en el idioma de la UI.
const idioma = computed(() => (locale.value === 'en' ? 'en-US' : 'es-ES'))
const dowShort = (f: string) => (f ? aFecha(f).toLocaleDateString(idioma.value, { weekday: 'short' }).replace('.', '').toUpperCase() : '—')
const domNum = (f: string) => (f ? String(aFecha(f).getDate()) : '—')

const hoy = hoyLocal()
const programados = computed(() =>
  workshops.value
    .filter(w => w.status === 'programado' && w.date >= hoy)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5),
)
const proximos = computed(() => workshops.value.filter(w => w.status === 'programado' && w.date >= hoy).length)
// Las que pasan por hoy (sol: ahora).
const jornadasDeHoy = computed(() => jornadas.value.filter(j => fechaEnJornada(j, hoy)).length)
const vivos = computed(() => workshops.value.filter(w => w.status !== 'archivado'))

const teamMembers = computed(() => activeEducators.value.slice(0, 4))

// Sin educadores ni talleres: los primeros pasos, en orden.
const primerosPasos = computed(() => !educators.value.length || !vivos.value.length)
const pasos = computed(() => [
  { to: '/organizacion/educators/nuevo', titulo: t('orgHome.step1'), texto: t('orgHome.step1Text'), hecho: educators.value.length > 0 },
  { to: '/organizacion/storyboards', titulo: t('orgHome.step2'), texto: t('orgHome.step2Text'), hecho: vivos.value.length > 0 },
  { to: '/organizacion/workshops/new', titulo: t('orgHome.step3'), texto: t('orgHome.step3Text'), hecho: vivos.value.length > 0 },
])

// Cifras: el símbolo lleva el tono de lo que mide. Próximos → cielo; jornadas en curso → sol (ahora);
// educadores y talleres totales no miden un estado: neutro.
interface Stat { label: string, value: number, sub: string, icon: UiIconName, tone: UiTone }
const stats = computed<Stat[]>(() => [
  { label: t('orgHome.educators'), value: activeEducators.value.length, sub: t('orgHome.actives'), icon: 'users', tone: 'neutral' },
  { label: t('orgHome.upcoming'), value: proximos.value, sub: '', icon: 'calendar', tone: 'sky' },
  { label: t('orgHome.jornadasActive'), value: jornadasDeHoy.value, sub: tCount(t, 'orgHome.jornadasTotal', jornadas.value.length), icon: 'layers', tone: jornadasDeHoy.value ? 'sun' : 'neutral' },
  { label: t('orgHome.workshops'), value: vivos.value.length, sub: t('orgHome.total'), icon: 'clapperboard', tone: 'neutral' },
])

// Accesos rápidos: el tono dice qué abren. Nuevo taller → cielo (una sesión programada); agregar
// educador → uva (alguien nuevo). La jornada se crea o se elige al programar un taller.
interface QuickAction { label: string, sub: string, to: string, icon: UiIconName, tone: UiTone }
const quickActions = computed<QuickAction[]>(() => [
  { label: t('orgHome.newWorkshop'), sub: t('orgHome.newWorkshopSub'), to: '/organizacion/workshops/new', icon: 'plus', tone: 'sky' },
  { label: t('orgHome.addEducator'), sub: t('orgHome.addEducatorSub'), to: '/organizacion/educators/nuevo', icon: 'user-plus', tone: 'grape' },
])

async function cargar() {
  const oid = orgActiva.value?.id
  const [detalle, lista] = await Promise.all([getOrganizacion(), oid ? useJornadas().listar(oid) : Promise.resolve([])])
  org.value = detalle
  jornadas.value = lista
}

onMounted(async () => {
  cargarPaises()
  await cargar()
})
watch(() => orgActiva.value?.id, cargar)
</script>
