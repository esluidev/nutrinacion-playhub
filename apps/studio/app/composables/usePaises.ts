// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de países — capa de datos (mock). Espejo de la semilla de `paises` en
// Supabase (docs/backend.md). Cuando la BD esté conectada, este composable pasa a
// consultar Supabase; los consumidores (multiselect de disponibilidad, etc.) no
// cambian. La UI de Studio es solo español, por eso `nombre` va en español.
// Regla 6 de CLAUDE.md: todo acceso a datos pasa por un composable.
// ─────────────────────────────────────────────────────────────────────────────

export interface Pais {
  codigo: string // ISO alpha-2 (PK en la BD), ej. 'SV'
  nombre: string // nombre en español para la UI de Studio
  bandera: string // emoji de bandera
  region: string // agrupación simple, ej. 'Centroamérica'
}

const PAISES_DATA: Pais[] = [
  { codigo: 'GT', nombre: 'Guatemala', bandera: '🇬🇹', region: 'Centroamérica' },
  { codigo: 'BZ', nombre: 'Belice', bandera: '🇧🇿', region: 'Centroamérica' },
  { codigo: 'SV', nombre: 'El Salvador', bandera: '🇸🇻', region: 'Centroamérica' },
  { codigo: 'HN', nombre: 'Honduras', bandera: '🇭🇳', region: 'Centroamérica' },
  { codigo: 'NI', nombre: 'Nicaragua', bandera: '🇳🇮', region: 'Centroamérica' },
  { codigo: 'CR', nombre: 'Costa Rica', bandera: '🇨🇷', region: 'Centroamérica' },
  { codigo: 'PA', nombre: 'Panamá', bandera: '🇵🇦', region: 'Centroamérica' },
  { codigo: 'MX', nombre: 'México', bandera: '🇲🇽', region: 'Norteamérica' },
  { codigo: 'US', nombre: 'Estados Unidos', bandera: '🇺🇸', region: 'Norteamérica' },
]

export function usePaises() {
  // Al conectar Supabase: reemplazar por useAsyncData/useState con la consulta real.
  const paises = useState<Pais[]>('paises', () => [...PAISES_DATA])

  const byCodigo = computed(() => new Map(paises.value.map(p => [p.codigo, p])))

  function getPais(codigo: string): Pais | undefined {
    return byCodigo.value.get(codigo)
  }

  function paisLabel(codigo: string): string {
    return byCodigo.value.get(codigo)?.nombre ?? codigo
  }

  return { paises, getPais, paisLabel }
}
