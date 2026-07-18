// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de organizaciones — capa de datos (mock). Espejo de la tabla
// `organizaciones` en Supabase (docs/backend.md): titular del contrato, dueña de
// los storyboards personalizados (storyboards.organizacion_id). Cuando la BD esté
// conectada, este composable consulta Supabase; los consumidores no cambian.
// El `id` es string aquí (en la BD es bigint); se usa tal cual como valor guardado.
// Regla 6 de CLAUDE.md: todo acceso a datos pasa por un composable.
// ─────────────────────────────────────────────────────────────────────────────

export interface Organizacion {
  id: string // organizaciones.id (bigint en BD, string en el mock)
  nombre: string
  tipo: string // etiqueta legible del tipo_id (ONG, GUBERNAMENTAL, ...)
}

const ORGANIZACIONES_DATA: Organizacion[] = [
  { id: '2', nombre: 'UNICEF', tipo: 'ONG' },
  { id: '3', nombre: 'Ministerio de Educación (SV)', tipo: 'Gubernamental' },
  { id: '4', nombre: 'Fundación Sagrera', tipo: 'Fundación' },
  { id: '5', nombre: 'Colegio Highlands', tipo: 'Centro educativo' },
]

export function useOrganizaciones() {
  // Al conectar Supabase: reemplazar por la consulta real (solo organizaciones
  // que pueden ser dueñas de contenido personalizado).
  const organizaciones = useState<Organizacion[]>('organizaciones', () => [...ORGANIZACIONES_DATA])

  const byId = computed(() => new Map(organizaciones.value.map(o => [o.id, o])))

  function getOrganizacion(id: string): Organizacion | undefined {
    return byId.value.get(id)
  }

  function organizacionLabel(id: string): string {
    return byId.value.get(id)?.nombre ?? id
  }

  return { organizaciones, getOrganizacion, organizacionLabel }
}
