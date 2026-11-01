// Contexto = dónde estás parado dentro de la app. Es UNO de dos tipos, EXCLUYENTES (decisión 011):
//
//   platform      — consola del operador (superadmin). Rutas /platform/*
//   organizacion  — operar o administrar una organización: talleres, planificador, educadores,
//                   colaboradores, storyboards y administradores. Rutas /organizacion/*
//
// LA RUTA MANDA: el tipo se deriva del prefijo de la URL — una sola fuente de verdad, sin
// estado híbrido. Se recuerda el último contexto del selector ({tipo, orgId}): al entrar se
// vuelve ahí. Pasar por /platform no destruye la organización elegida.
//
// El sidebar es el ESPEJO del contexto activo: muestra solo la navegación del tipo actual, y
// dentro de la organización, solo lo que el rol puede tocar (useSidebar).

const CLAVE = 'nutrinacion.contexto'

export type TipoContexto = 'platform' | 'organizacion'

export interface OrgCtx {
  id: number
  nombre: string
  esAdmin: boolean         // tengo fila en organizacion_administradores
  esColaborador: boolean   // tengo fila activa en organizacion_colaboradores
}

// Un destino = un lugar al que puedo entrar. Si hay uno solo, el selector es estático.
export interface Destino {
  tipo: TipoContexto
  ruta: string
  etiqueta: string
  orgId?: number
}

// Superficie demo (dev sin Supabase): deja ver y recorrer el chrome (switcher, sidebar,
// breadcrumb) sin sesión. Los datos de las páginas siguen siendo asunto de cada composable.
const DEMO_ORGS: OrgCtx[] = [
  { id: 1, nombre: 'Nutrinación', esAdmin: true, esColaborador: false },
  { id: 2, nombre: 'Fundación Crecer', esAdmin: false, esColaborador: true },
]

export function useContexto() {
  const { user } = useAuth()
  const demo = !isSupabaseConfigured()
  const rutaActual = useRouter().currentRoute

  const orgId = useState<number | null>('ctx-org', () => (demo ? 1 : null))

  const esSuperadmin = computed(() => demo || user.value?.perfil.superadmin === true)

  // El tipo NO se elige ni se guarda: lo dice la ruta donde estás parado.
  const tipo = computed<TipoContexto>(() => (rutaActual.value.path.startsWith('/platform') ? 'platform' : 'organizacion'))

  // ── Árbol de acceso: las organizaciones que opero ─────────────────────────
  // Dos fuentes: las que administro y aquellas donde colaboro. Una persona puede ser ambas cosas
  // en organizaciones distintas; en la misma, administrar manda.
  const orgs = computed<OrgCtx[]>(() => {
    if (demo) return DEMO_ORGS
    const u = user.value
    if (!u) return []

    const mapa = new Map<number, OrgCtx>()
    for (const o of u.organizaciones) {
      mapa.set(o.id, { id: o.id, nombre: o.nombre, esAdmin: true, esColaborador: false })
    }
    for (const o of u.colaboraEn) {
      const previa = mapa.get(o.id)
      if (previa) previa.esColaborador = true
      else mapa.set(o.id, { id: o.id, nombre: o.nombre, esAdmin: false, esColaborador: true })
    }
    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre))
  })

  const orgActiva = computed(() => orgs.value.find(o => o.id === orgId.value) ?? null)
  // Administrar la organización activa abre la licencia, los administradores y los colaboradores;
  // el colaborador solo ve la operación (la RLS lo exige igual en la base).
  const administraOrgActiva = computed(() => orgActiva.value?.esAdmin === true)
  // El titular de la org activa es el único que invita co-admins (la RLS de 0005 lo exige
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
      lista.push({ tipo: 'organizacion', ruta: '/organizacion', etiqueta: o.nombre, orgId: o.id })
    }
    return lista
  })

  // ── Persistencia ───────────────────────────────────────────────────────────
  // El tipo guardado es el de la última ruta de contexto visitada (`recordarRuta`).
  function guardar(tipoGuardado: TipoContexto | null = leer()?.tipo ?? null) {
    if (import.meta.client) {
      try {
        localStorage.setItem(CLAVE, JSON.stringify({ tipo: tipoGuardado, orgId: orgId.value }))
      }
      catch { /* sin almacenamiento: se aterriza por rol */ }
    }
  }

  function leer(): { tipo?: TipoContexto | null, orgId: number | null } | null {
    if (!import.meta.client) return null
    try {
      const raw = localStorage.getItem(CLAVE)
      return raw ? JSON.parse(raw) : null
    }
    catch { return null }
  }

  // Elegir la organización como contexto.
  function setOrg(nuevaOrg: number | null) {
    orgId.value = nuevaOrg
    guardar()
  }

  // Lo llama el middleware al entrar en una ruta de contexto: así el selector recuerda dónde
  // quedaste (Platform o la organización) para la próxima vez. Lo global (perfil, bandeja de
  // invitaciones) no es de ningún contexto: no cuenta.
  function recordarRuta(path: string) {
    const t: TipoContexto | null = path.startsWith('/platform')
      ? 'platform'
      : path.startsWith('/organizacion') ? 'organizacion' : null
    if (t) guardar(t)
  }

  // ── Aterrizaje ─────────────────────────────────────────────────────────────
  // Manda el selector: se vuelve al último contexto si sigue siendo accesible (te pueden haber
  // sacado de esa organización). Sin nada recordado, por rol:
  //   superadmin                → Platform
  //   admin o colaborador       → su organización (la recordada si sigue, si no la primera)
  //   ningún acceso             → sin acceso
  function rutaInicial(): string {
    if (!user.value) return '/login'
    if (!destinos.value.length) return '/sin-acceso'

    const g = leer()
    const recordada = orgs.value.find(o => o.id === g?.orgId) ?? null

    // 1. El último contexto del selector.
    if (g?.tipo === 'platform' && esSuperadmin.value) return '/platform'
    if (g?.tipo === 'organizacion' && recordada) {
      setOrg(recordada.id)
      return '/organizacion'
    }

    // 2. Por rol.
    if (esSuperadmin.value) return '/platform'
    const org = recordada ?? orgs.value[0]
    if (org) {
      setOrg(org.id)
      return '/organizacion'
    }
    return '/sin-acceso'
  }

  // Asegura que SIEMPRE haya una org activa si la persona tiene alguna. Corre en cada navegación
  // autenticada: sin esto, quedarse sin contexto (p. ej. justo después de aceptar una invitación)
  // dejaba el switcher vacío. Prefiere lo guardado; si ya no existe, cae a la primera.
  function asegurarContexto(): boolean {
    if (orgActiva.value) return true
    const g = leer()
    const org = orgs.value.find(o => o.id === g?.orgId) ?? orgs.value[0]
    if (!org) return false
    setOrg(org.id)
    return true
  }

  return {
    orgs,
    destinos,
    tipo,
    esSuperadmin,
    orgActiva,
    administraOrgActiva,
    esTitularOrgActiva,
    setOrg,
    recordarRuta,
    rutaInicial,
    asegurarContexto,
  }
}
