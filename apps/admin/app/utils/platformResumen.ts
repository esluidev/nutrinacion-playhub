// Reglas de negocio del dashboard del operador (/platform): la administración de las
// organizaciones. Qué licencia está vigente, en qué punto está cada organización (operando, en
// alta, sin licencia), cómo se desglosa el parque de licencias, qué organizaciones NECESITAN
// ATENCIÓN y la actividad de las organizaciones. La operación de cada una (comunidades,
// educadores, talleres) no es asunto de Platform.
// Funciones puras (la fecha entra como parámetro): usePlatform las alimenta con datos
// de Supabase y los tests las ejercitan directo.

export interface LicenciaLigera {
  id: number
  estado: string
  fecha_inicio: string
  fecha_fin: string | null
  max_comunidades: number
  organizacion_id: number
  created_at: string
}

export interface OrgLigera {
  id: number
  nombre: string
  created_at: string
  comunidades: number       // cuántas usa de su licencia (solo para el cupo)
  administradores: { id: number, created_at: string, nombre: string }[]
}

// Orden = severidad: primero lo roto, luego lo urgente, luego el onboarding y la venta.
export type AtencionTipo = 'lic_vencida_activa' | 'sin_licencia' | 'lic_vence' | 'sin_admins' | 'cupo_lleno'

export interface AtencionItem {
  tipo: AtencionTipo
  orgId: number
  orgNombre: string
  dias?: number          // para lic_vence
  licenciaId?: number
}

export interface ActividadItem {
  tipo: 'org' | 'licencia' | 'renovacion' | 'admin'
  orgNombre: string
  orgId: number
  fecha: string
  persona?: string       // para 'admin'
  licenciaId?: number    // para 'licencia' y 'renovacion'
}

// Vigente = ACTIVA o TRIAL, ya iniciada, sin fin o con fin no pasado (criterio del trigger 0007).
export function esVigente(l: LicenciaLigera, hoy: string): boolean {
  return (l.estado === 'ACTIVA' || l.estado === 'TRIAL')
    && l.fecha_inicio.slice(0, 10) <= hoy
    && (!l.fecha_fin || l.fecha_fin.slice(0, 10) >= hoy)
}

export function licenciaVigenteDe(licencias: LicenciaLigera[], orgId: number, hoy: string): LicenciaLigera | null {
  return licencias
    .filter(l => l.organizacion_id === orgId && esVigente(l, hoy))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0] ?? null
}

export function resumenLicencias(licencias: LicenciaLigera[], hoy: string) {
  const en30 = fechaMas(hoy, 30)
  const vigentes = licencias.filter(l => esVigente(l, hoy))
  return {
    vigentes: vigentes.length,
    trials: vigentes.filter(l => l.estado === 'TRIAL').length,
    porVencer: vigentes.filter(l => l.fecha_fin && l.fecha_fin.slice(0, 10) <= en30).length,
    vencidas: licencias.filter(l =>
      l.estado === 'VENCIDA' || (!!l.fecha_fin && l.fecha_fin.slice(0, 10) < hoy)).length,
  }
}

// En qué punto está cada organización. Operando = licencia vigente y al menos un administrador;
// en alta = sin administradores todavía; sin licencia = sin una vigente (no abre comunidades).
export function resumenOrganizaciones(orgs: OrgLigera[], licencias: LicenciaLigera[], hoy: string) {
  const hace30 = fechaMas(hoy, -30)
  const conVigente = orgs.filter(o => licenciaVigenteDe(licencias, o.id, hoy))
  return {
    total: orgs.length,
    nuevas: orgs.filter(o => o.created_at.slice(0, 10) >= hace30).length,
    operando: conVigente.filter(o => o.administradores.length > 0).length,
    enAlta: orgs.filter(o => !o.administradores.length).length,
    sinLicencia: orgs.length - conVigente.length,
  }
}

export function construirAtencion(orgs: OrgLigera[], licencias: LicenciaLigera[], hoy: string): AtencionItem[] {
  const items: AtencionItem[] = []

  for (const o of orgs) {
    const deLaOrg = licencias.filter(l => l.organizacion_id === o.id)
    const vigente = licenciaVigenteDe(licencias, o.id, hoy)

    // Venció por fecha pero nadie actualizó el estado: dato inconsistente, primero en la lista.
    const vencidaActiva = deLaOrg.find(l =>
      (l.estado === 'ACTIVA' || l.estado === 'TRIAL') && !!l.fecha_fin && l.fecha_fin.slice(0, 10) < hoy)
    if (vencidaActiva) {
      items.push({ tipo: 'lic_vencida_activa', orgId: o.id, orgNombre: o.nombre, licenciaId: vencidaActiva.id })
    }
    else if (!vigente) {
      items.push({ tipo: 'sin_licencia', orgId: o.id, orgNombre: o.nombre })
    }

    if (vigente?.fecha_fin) {
      const dias = diasEntre(hoy, vigente.fecha_fin.slice(0, 10))
      if (dias <= 30) items.push({ tipo: 'lic_vence', orgId: o.id, orgNombre: o.nombre, dias, licenciaId: vigente.id })
    }

    if (!o.administradores.length) {
      items.push({ tipo: 'sin_admins', orgId: o.id, orgNombre: o.nombre })
    }

    // Cupo lleno no es un problema: es una señal de ampliación. Va al final.
    if (vigente && o.comunidades >= vigente.max_comunidades) {
      items.push({ tipo: 'cupo_lleno', orgId: o.id, orgNombre: o.nombre, licenciaId: vigente.id })
    }
  }

  const severidad: Record<AtencionTipo, number> = {
    lic_vencida_activa: 0, sin_licencia: 1, lic_vence: 2, sin_admins: 3, cupo_lleno: 4,
  }
  return items.sort((a, b) =>
    severidad[a.tipo] - severidad[b.tipo] || (a.dias ?? 0) - (b.dias ?? 0))
}

// Actividad de las organizaciones: altas, licencias emitidas o renovadas y administradores que se
// incorporan, de la más reciente a la más antigua.
export function construirActividad(orgs: OrgLigera[], licencias: LicenciaLigera[], limite = 6): ActividadItem[] {
  const items: ActividadItem[] = []
  const nombre = new Map(orgs.map(o => [o.id, o.nombre]))
  for (const o of orgs) {
    items.push({ tipo: 'org', orgNombre: o.nombre, orgId: o.id, fecha: o.created_at })
    for (const a of o.administradores) {
      items.push({ tipo: 'admin', orgNombre: o.nombre, orgId: o.id, fecha: a.created_at, persona: a.nombre })
    }
  }
  const porOrg = [...licencias].sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
  const vistas = new Set<number>()
  for (const l of porOrg) {
    const orgNombre = nombre.get(l.organizacion_id)
    if (!orgNombre) continue
    items.push({
      tipo: vistas.has(l.organizacion_id) ? 'renovacion' : 'licencia',
      orgNombre,
      orgId: l.organizacion_id,
      fecha: l.created_at,
      licenciaId: l.id,
    })
    vistas.add(l.organizacion_id)
  }
  return items.sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, limite)
}

function fechaMas(hoy: string, dias: number): string {
  const d = new Date(`${hoy}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

function diasEntre(desde: string, hasta: string): number {
  return Math.round((new Date(`${hasta}T00:00:00Z`).getTime() - new Date(`${desde}T00:00:00Z`).getTime()) / 86_400_000)
}
