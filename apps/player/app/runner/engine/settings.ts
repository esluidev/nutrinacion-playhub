// ---- Ajustes del motor para probarlo en un dispositivo. Los cambia el medidor (`meter.ts`) y duran lo que la pestaña:
// sirven para comparar con y sin cada cosa en la misma tableta, no son preferencias del taller. ----

const KEY = 'playhub:motor'

export const settings = {
  /** Vibración corta al agarrar y al soltar sobre una zona (solo donde el dispositivo la tiene). */
  haptics: true,
}

export type Setting = keyof typeof settings

try {
  Object.assign(settings, JSON.parse(sessionStorage.getItem(KEY) ?? '{}'))
}
catch { /* sin almacenamiento: los valores de fábrica */ }

export function setSetting(name: Setting, value: boolean) {
  settings[name] = value
  try { sessionStorage.setItem(KEY, JSON.stringify(settings)) }
  catch { /* sin almacenamiento: vale hasta recargar */ }
}
