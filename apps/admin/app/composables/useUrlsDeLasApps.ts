import { urlEnEsteEquipo } from '@playhub/ui/app/utils/equipo-local'
import { urlsDeLasApps } from '@playhub/ui/app/utils/urls-de-las-apps'
import type { AppPlayHub } from '@playhub/ui/app/utils/urls-de-las-apps'

// Dónde está cada app: en la base (`configuraciones`, sus `*_url`), nunca fija en el código. Admin abre con la de
// Player su runner («Vista previa», «Probar», «Editar en Player») y con la de Educators el enlace de acceso del
// educador. Compartida por la red, `localhost` pasa a ser el nombre de este equipo (equipo-local). Sin base (el modo
// demo) o sin esa dirección, no hay a dónde ir.
export async function urlDeApp(app: AppPlayHub): Promise<string | null> {
  if (!isSupabaseConfigured()) return null
  const { data } = await useSupabaseClient().from('configuraciones').select('clave, valor')
  const url = urlsDeLasApps(data)[app]
  return url ? urlEnEsteEquipo(url) : null
}
