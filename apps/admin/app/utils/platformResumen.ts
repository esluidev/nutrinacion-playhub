// Reglas de negocio del dashboard del operador (/platform): qué licencia está vigente,
// cómo se desglosa el parque de licencias y qué organizaciones NECESITAN ATENCIÓN.
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
  comunidades: { id: number, nombre: string, created_at: string }[]
  administradores: { id: number }[]
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
  tipo: 'org' | 'comunidad'
  nombre: string
  orgNombre?: string     // para comunidades
  orgId: number
  fecha: string
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
    if (vigente && o.comunidades.length >= vigente.max_comunidades) {
      items.push({ tipo: 'cupo_lleno', orgId: o.id, orgNombre: o.nombre, licenciaId: vigente.id })
    }
  }

  const severidad: Record<AtencionTipo, number> = {
    lic_vencida_activa: 0, sin_licencia: 1, lic_vence: 2, sin_admins: 3, cupo_lleno: 4,
  }
  return items.sort((a, b) =>
    severidad[a.tipo] - severidad[b.tipo] || (a.dias ?? 0) - (b.dias ?? 0))
}

// Pulso de adopción: altas recientes de organizaciones y comunidades, mezcladas.
export function construirActividad(orgs: OrgLigera[], limite = 6): ActividadItem[] {
  const items: ActividadItem[] = []
  for (const o of orgs) {
    items.push({ tipo: 'org', nombre: o.nombre, orgId: o.id, fecha: o.created_at })
    for (const c of o.comunidades) {
      items.push({ tipo: 'comunidad', nombre: c.nombre, orgNombre: o.nombre, orgId: o.id, fecha: c.created_at })
    }
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
