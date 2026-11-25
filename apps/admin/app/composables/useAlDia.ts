import type { Lectura } from '~/utils/alDia'
import { hayQueLeer } from '~/utils/alDia'

/** Mantiene al día una lista de la organización (ver `utils/alDia.ts`): la lee al entrar a la página que la usa y al
 *  volver a la pestaña o a la ventana, si hace falta. */
export function useAlDia(lectura: Lectura, orgGuardada: () => number | null, refresh: () => Promise<void>) {
  if (!import.meta.client) return
  const { orgActiva } = useContexto()
  const revisar = () => {
    if (hayQueLeer(lectura, orgActiva.value?.id, orgGuardada())) void refresh()
  }
  revisar()
  useAlVolver(revisar)
}
