import { moverRango } from '~/utils/calendario'
import type { VistaCalendario } from '~/utils/calendario'
import { isoDia } from '~/utils/talleres'

// La vista de «Mis talleres» (Día, Semana o Mes; Día es la de entrada) y la semana o el mes que mira el educador. Se
// conserva al ir y volver de un taller.
export function useCalendario() {
  const fecha = useState('calendario-fecha', () => isoDia(new Date()))
  const vista = useState<VistaCalendario>('calendario-vista', () => 'dia')

  return {
    fecha,
    vista,
    anterior: () => (fecha.value = moverRango(fecha.value, vista.value, -1)),
    siguiente: () => (fecha.value = moverRango(fecha.value, vista.value, 1)),
    hoy: () => (fecha.value = isoDia(new Date())),
    irA: (iso: string) => (fecha.value = iso),
  }
}
