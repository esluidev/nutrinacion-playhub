// Qué rutas de Studio se ven SIN sesión.
//
// La crítica es `/play/**`: el runner lo abre la app de educadores dentro de un webview, que
// no tiene ni puede tener sesión de Studio. Si el guard lo protegiera, el juego dejaría de
// funcionar fuera de Studio — por eso la regla vive acá, aislada y con test propio, en vez de
// ser un `if` suelto en el middleware que se borre por descuido.
//
// El resto de Studio (gestión) sí exige sesión de superadmin: ver `composables/useAuth.ts`.

const PREFIJOS_PUBLICOS = ['/play/'] as const
const EXACTAS_PUBLICAS = ['/login'] as const

export function esRutaPublica(path: string): boolean {
  if (EXACTAS_PUBLICAS.includes(path as typeof EXACTAS_PUBLICAS[number])) return true
  return PREFIJOS_PUBLICOS.some(prefijo => path.startsWith(prefijo))
}
