// El catálogo de países (`paises`, lo leen todas las sesiones de Admin): código, nombre por idioma
// y bandera. Se carga una vez por sesión y lo comparten Platform (alta y detalle de la
// organización) y el inicio de la organización (los países donde opera, con su bandera).

export interface Pais {
  codigo: string
  nombre: Record<string, string>
  bandera: string | null
}

const DEMO_PAISES: Pais[] = [
  { codigo: 'GT', nombre: { es: 'Guatemala', en: 'Guatemala' }, bandera: '🇬🇹' },
  { codigo: 'MX', nombre: { es: 'México', en: 'Mexico' }, bandera: '🇲🇽' },
  { codigo: 'SV', nombre: { es: 'El Salvador', en: 'El Salvador' }, bandera: '🇸🇻' },
]

export function usePaises() {
  const { locale } = useT()
  const state = useState<{ paises: Pais[], cargado: boolean }>('paises-catalogo', () => ({ paises: [], cargado: false }))

  async function cargar() {
    if (state.value.cargado) return state.value.paises
    if (!isSupabaseConfigured()) {
      state.value = { paises: DEMO_PAISES, cargado: true }
      return DEMO_PAISES
    }
    const { data } = await useSupabaseClient()
      .from('paises').select('codigo, nombre, bandera').eq('activo', true).order('codigo')
    state.value = { paises: (data as Pais[] | null) ?? [], cargado: true }
    return state.value.paises
  }

  const paises = computed(() => state.value.paises)
  const porCodigo = computed(() => new Map(paises.value.map(p => [p.codigo, p])))

  // «🇬🇹 Guatemala» en el idioma de la UI; si el catálogo aún no llegó, el código.
  function etiqueta(codigo: string): string {
    const p = porCodigo.value.get(codigo)
    if (!p) return codigo
    const nombre = p.nombre?.[locale.value] ?? p.nombre?.es ?? codigo
    return p.bandera ? `${p.bandera} ${nombre}` : nombre
  }

  function bandera(codigo: string): string {
    return porCodigo.value.get(codigo)?.bandera ?? ''
  }

  return { paises, cargar, etiqueta, bandera }
}
