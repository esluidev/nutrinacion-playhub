// Contexto = dónde estás parado dentro de la app. Es UNO de tres tipos, EXCLUYENTES:
//
//   platform      — consola del operador (superadmin). Rutas /platform/*
//   organizacion  — administrar una org: sus comunidades y sus administradores. /organizacion/*
//   comunidad     — operar una comunidad (talleres, educadores…). El resto.
//
// LA RUTA MANDA: el tipo se deriva del prefijo de la URL — una sola fuente de verdad, sin
// estado híbrido. Se recuerda el último contexto del selector ({tipo, orgId, comunidadId}):
// al entrar se vuelve ahí. Cambiar de tipo no destruye la elección: pasar por /organizacion
// o /platform conserva la comunidad recordada para cuando vuelvas a operar.
//
// El sidebar es el ESPEJO del contexto activo: muestra solo la navegación del tipo actual.

import type { ComunidadConOrg } from '~/utils/types'

const CLAVE = 'nutrinacion.contexto'

export type TipoContexto = 'platform' | 'organizacion' | 'comunidad'

export interface ComunidadCtx {
  id: number
  nombre: string
  organizacionId: number
  esColaborador: boolean   // llego por `colaboradores`; si no, llego por administrar su org
}

export interface OrgCtx {
  id: number
  nombre: string
  esAdmin: boolean         // tengo fila en organizacion_administradores
  comunidades: ComunidadCtx[]
}

// Un destino = un lugar al que puedo entrar. Si hay uno solo, el selector es estático.
export interface Destino {
  tipo: TipoContexto
  ruta: string
  etiqueta: string
  contexto?: string        // "Nutrinación" para una comunidad
  orgId?: number
  comunidadId?: number
}

// Superficie demo (dev sin Supabase): deja ver y recorrer el chrome (switcher, sidebar,
// breadcrumb) sin sesión. Los datos de las páginas siguen siendo asunto de cada composable.
const DEMO_ORGS: OrgCtx[] = [
  {
    id: 1,
    nombre: 'Nutrinación',
    esAdmin: true,
    comunidades: [
      { id: 1, nombre: 'Comunidad Centro', organizacionId: 1, esColaborador: false },
      { id: 2, nombre: 'Comunidad Norte', organizacionId: 1, esColaborador: false },
    ],
  },
  {
    id: 2,
    nombre: 'Fundación Crecer',
    esAdmin: false,
    comunidades: [
      { id: 3, nombre: 'Sede Sur', organizacionId: 2, esColaborador: true },
    ],
  },
]

export function useContexto() {
  const { user } = useAuth()
  const demo = !isSupabaseConfigured()
  const rutaActual = useRouter().currentRoute

  const orgId = useState<number | null>('ctx-org', () => (demo ? 1 : null))
  const comunidadId = useState<number | null>('ctx-comunidad', () => (demo ? 1 : null))

  const esSuperadmin = computed(() => demo || user.value?.perfil.superadmin === true)

  // El tipo NO se elige ni se guarda: lo dice la ruta donde estás parado.
  const tipo = computed<TipoContexto>(() => {
    const p = rutaActual.value.path
    if (p.startsWith('/platform')) return 'platform'
    if (p.startsWith('/organizacion')) return 'organizacion'
    return 'comunidad'
  })

  // ── Árbol de acceso: organizaciones → sus comunidades ──────────────────────
  // Dos fuentes: las orgs que administro (aunque NO tengan comunidades todavía) y las orgs
  // de mis comunidades (que pueden ser orgs que no administro: solo colaboro).
  const orgs = computed<OrgCtx[]>(() => {
    if (demo) return DEMO_ORGS
    const u = user.value
    if (!u) return []

    const mapa = new Map<number, OrgCtx>()

    for (const o of u.organizaciones) {
      mapa.set(o.id, { id: o.id, nombre: o.nombre, esAdmin: true, comunidades: [] })
    }

    for (const c of u.comunidades as ComunidadConOrg[]) {
      if (!mapa.has(c.organizacion_id)) {
        mapa.set(c.organizacion_id, {
          id: c.organizacion_id,
          nombre: c.organizaciones?.nombre ?? '—',
          esAdmin: false,
          comunidades: [],
        })
      }
      mapa.get(c.organizacion_id)!.comunidades.push({
        id: c.id,
        nombre: c.nombre,
        organizacionId: c.organizacion_id,
        esColaborador: u.colaboraEn.includes(c.id),
      })
    }

    const lista = [...mapa.values()]
    for (const o of lista) o.comunidades.sort((a, b) => a.nombre.localeCompare(b.nombre))
    return lista.sort((a, b) => a.nombre.localeCompare(b.nombre))
  })

  const orgActiva = computed(() => orgs.value.find(o => o.id === orgId.value) ?? null)
  const comunidadActiva = computed(() =>
    orgActiva.value?.comunidades.find(c => c.id === comunidadId.value) ?? null)
  // Solo el admin de la org activa tiene el contexto organización.
  const administraOrgActiva = computed(() => orgActiva.value?.esAdmin === true)
  // El titular de la org activa es el único que invita co-admins (la RLS de 0006 lo exige
  // también en la base; esto solo gatea la UI).
  const esTitularOrgActiva = computed(() => {
    if (!orgActiva.value) return false
    if (demo) return true
    return (user.value?.titularDe ?? []).includes(orgActiva.value.id)
  })

  // ── Destinos ───────────────────────────────────────────────────────────────
  const destinos = computed<Destino[]>(() => {
    const lista: Destino[] = []

    if (esSuperadmin.value) {
      lista.push({ tipo: 'platform', ruta: '/platform', etiqueta: 'Platform' })
    }

    for (const o of orgs.value) {
      for (const c of o.comunidades) {
        lista.push({
          tipo: 'comunidad',
          ruta: '/dashboard',
          etiqueta: c.nombre,
          contexto: o.nombre,
          orgId: o.id,
          comunidadId: c.id,
        })
      }
      // La org que administras SIEMPRE es destino: el nivel organización es un contexto
      // de primera (detalle + comunidades + administradores), tenga o no comunidades.
      if (o.esAdmin) {
        lista.push({
          tipo: 'organizacion',
          ruta: '/organizacion',
          etiqueta: o.nombre,
          orgId: o.id,
        })
      }
    }

    return lista
  })

  // ── Persistencia ───────────────────────────────────────────────────────────
  // El tipo guardado es el de la última ruta de contexto visitada (`recordarRuta`).
  function guardar(tipoGuardado: TipoContexto | null = leer()?.tipo ?? null) {
    if (import.meta.client) {
      try {
        localStorage.setItem(CLAVE, JSON.stringify({ tipo: tipoGuardado, orgId: orgId.value, comunidadId: comunidadId.value }))
      }
      catch { /* sin almacenamiento: se aterriza por rol */ }
    }
  }

  function leer(): { tipo?: TipoContexto | null, orgId: number | null, comunidadId: number | null } | null {
    if (!import.meta.client) return null
    try {
      const raw = localStorage.getItem(CLAVE)
      return raw ? JSON.parse(raw) : null
    }
    catch { return null }
  }

  function setContexto(nuevaOrg: number | null, nuevaComunidad: number | null = null) {
    orgId.value = nuevaOrg
    comunidadId.value = nuevaComunidad
    guardar()
  }

  // Elegir la org como contexto: conserva la comunidad recordada si es de ESA org (cambiar
  // de tipo no destruye estado); viniendo de otra org no hay nada que recordar.
  function setOrg(nuevaOrg: number) {
    const conserva = orgs.value.find(o => o.id === nuevaOrg)
      ?.comunidades.some(c => c.id === comunidadId.value)
    setContexto(nuevaOrg, conserva ? comunidadId.value : null)
  }

  // Lo llama el middleware al entrar en una ruta de contexto: así el selector recuerda dónde
  // quedaste (Platform, la organización o la comunidad) para la próxima vez.
  // «Mi perfil» cuelga de /dashboard pero no es de ninguna comunidad: no cuenta.
  function recordarRuta(path: string) {
    if (path.startsWith('/dashboard/perfil')) return
    const t: TipoContexto | null = path.startsWith('/platform')
      ? 'platform'
      : path.startsWith('/organizacion')
        ? 'organizacion'
        : path.startsWith('/dashboard') ? 'comunidad' : null
    if (t) guardar(t)
  }

  // ── Aterrizaje ─────────────────────────────────────────────────────────────
  // Manda el selector: se vuelve al último contexto si sigue siendo accesible (te pueden haber
  // sacado de esa comunidad u organización). Sin nada recordado, por rol:
  //   superadmin           → Platform
  //   admin de una org     → su organización
  //   colaborador          → su comunidad
  //   ningún acceso        → sin acceso
  function rutaInicial(): string {
    if (!user.value) return '/login'
    if (!destinos.value.length) return '/sin-acceso'

    const g = leer()
    const administradas = orgs.value.filter(o => o.esAdmin)
    const conComunidad = (cid: number | null | undefined) =>
      orgs.value.find(o => o.comunidades.some(c => c.id === cid)) ?? null

    // 1. El último contexto del selector.
    if (g?.tipo === 'platform' && esSuperadmin.value) return '/platform'
    if (g?.tipo === 'organizacion') {
      const org = administradas.find(o => o.id === g.orgId)
      if (org) {
        setContexto(org.id, org.comunidades.some(c => c.id === g.comunidadId) ? g.comunidadId : null)
        return '/organizacion'
      }
    }
    if (g?.tipo === 'comunidad') {
      const org = conComunidad(g.comunidadId)
      if (org) {
        setContexto(org.id, g.comunidadId)
        return '/dashboard'
      }
    }

    // 2. Por rol.
    if (esSuperadmin.value) return '/platform'
    if (administradas.length) {
      const org = administradas.find(o => o.id === g?.orgId) ?? administradas[0]!
      setContexto(org.id, org.comunidades.some(c => c.id === g?.comunidadId) ? g!.comunidadId : null)
      return '/organizacion'
    }
    const org = conComunidad(g?.comunidadId) ?? orgs.value.find(o => o.comunidades.length)
    if (org) {
      const comunidad = org.comunidades.find(c => c.id === g?.comunidadId) ?? org.comunidades[0]!
      setContexto(org.id, comunidad.id)
      return '/dashboard'
    }
    return '/sin-acceso'
  }

  // Asegura que SIEMPRE haya una org activa si la persona tiene algún acceso. Corre en cada
  // navegación autenticada: sin esto, quedarse sin contexto (p. ej. justo después de aceptar
  // una invitación) dejaba el switcher vacío. Prefiere lo guardado; si ya no existe, cae al
  // primer destino real.
  function asegurarContexto(): boolean {
    if (orgActiva.value) return true
    const g = leer()
    const reales = destinos.value.filter(x => x.tipo !== 'platform')
    const d = reales.find(x => x.orgId === g?.orgId && (x.comunidadId ?? null) === (g?.comunidadId ?? null))
      ?? reales.find(x => x.orgId === g?.orgId)
      ?? reales[0]
    if (!d) return false
    setContexto(d.orgId ?? null, d.comunidadId ?? null)
    return true
  }

  // Garantiza una comunidad activa cuando la ruta la exige (/dashboard/*): la recordada ya
  // la valida `comunidadActiva`; si no hay, cae a la primera de la org activa.
  function asegurarComunidad(): boolean {
    if (comunidadActiva.value) return true
    const primera = orgActiva.value?.comunidades[0]
    if (!primera) return false
    setContexto(orgActiva.value!.id, primera.id)
    return true
  }

  return {
    orgs,
    destinos,
    tipo,
    esSuperadmin,
    orgActiva,
    comunidadActiva,
    administraOrgActiva,
    esTitularOrgActiva,
    setContexto,
    setOrg,
    recordarRuta,
    rutaInicial,
    asegurarContexto,
    asegurarComunidad,
  }
}
