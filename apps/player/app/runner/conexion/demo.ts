import type { CanalSesion, MensajeSesion } from './mensajes'

// La sesión de demostración: entre pestañas del mismo navegador (BroadcastChannel), sin conexión del
// taller. Sirve para probar el panel y un dispositivo en desarrollo (?mode=device en otra pestaña).
export function canalDemostracion(): CanalSesion | null {
  if (typeof BroadcastChannel === 'undefined') return null
  const bc = new BroadcastChannel('playhub-taller-demo')
  const canal: CanalSesion = {
    onmessage: null,
    postMessage: (m: MensajeSesion) => bc.postMessage(m),
    close: () => bc.close(),
  }
  bc.onmessage = event => canal.onmessage?.({ data: event.data })
  return canal
}
