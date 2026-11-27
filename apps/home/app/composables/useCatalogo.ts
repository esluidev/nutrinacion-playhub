import { CATALOGO_VACIO, delPerfil } from '~/utils/catalogo'
import type { CatalogoHogar } from '~/utils/catalogo'
import { edadDe, edicionDe } from '~/utils/perfiles'

// El catálogo del hogar del país del dispositivo (`hogar_catalogo`, sin cuenta), y lo que le toca al perfil que juega
// por su edad. Se pide una vez por país y se guarda mientras la app esté abierta.
export function useCatalogo() {
  const { pais, actual } = useHogar()
  const catalogo = useState<CatalogoHogar | null>('hogar-catalogo', () => null)
  const deQuePais = useState<string | null>('hogar-catalogo-pais', () => null)
  const cargando = ref(false)
  const error = ref(false)

  async function cargar() {
    if (!pais.value) return
    cargando.value = true
    error.value = false
    const { data, error: fallo } = await useSupabaseClient().rpc('hogar_catalogo', { p_pais: pais.value })
    cargando.value = false
    if (fallo) {
      error.value = true
      return
    }
    catalogo.value = (data as unknown as CatalogoHogar | null) ?? CATALOGO_VACIO
    deQuePais.value = pais.value
  }

  if (import.meta.client && (!catalogo.value || deQuePais.value !== pais.value)) void cargar()

  const delQueJuega = computed<CatalogoHogar>(() => {
    if (!catalogo.value || !actual.value) return CATALOGO_VACIO
    return delPerfil(catalogo.value, edicionDe(edadDe(actual.value)))
  })

  return { catalogo: delQueJuega, cargando: computed(() => cargando.value || (!catalogo.value && !error.value)), error, cargar }
}
