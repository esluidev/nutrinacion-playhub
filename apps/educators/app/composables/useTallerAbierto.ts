// El taller cuya ventana de acciones está abierta (una por pantalla): lo abre la tarjeta o el mes.
export function useTallerAbierto() {
  const abierto = useState<string | null>('taller-abierto', () => null)
  return {
    abierto,
    abrir: (id: string) => (abierto.value = id),
    cerrar: () => (abierto.value = null),
  }
}
