import { urlEnEsteEquipo } from '@playhub/ui/app/utils/equipo-local'
import { urlsDeLasApps } from '@playhub/ui/app/utils/urls-de-las-apps'

// La dirección de Player, de la base (`configuraciones`), nunca fija en el código: con ella se abre el runner.
export function useUrlDePlayer() {
  const url = useState<string | null | undefined>('hogar-player-url', () => undefined)
  if (import.meta.client && url.value === undefined) {
    void useSupabaseClient().from('configuraciones').select('clave, valor').then(({ data }) => {
      const player = urlsDeLasApps(data).player
      url.value = player ? urlEnEsteEquipo(player) : null
    })
  }
  return url
}
