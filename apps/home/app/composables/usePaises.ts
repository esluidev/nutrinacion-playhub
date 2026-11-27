// Los países (nombre por idioma y bandera), que se leen sin cuenta: para preguntar dónde está la familia.
export interface Pais { codigo: string, nombre: Record<string, string>, bandera: string | null }

export function usePaises() {
  const paises = useState<Pais[] | null>('hogar-paises', () => null)
  const error = ref(false)

  async function cargar() {
    error.value = false
    const { data, error: fallo } = await useSupabaseClient().from('paises').select('codigo, nombre, bandera').order('codigo')
    if (fallo) error.value = true
    else paises.value = (data ?? []) as unknown as Pais[]
  }

  if (import.meta.client && !paises.value) void cargar()
  return { paises, error, cargar }
}
