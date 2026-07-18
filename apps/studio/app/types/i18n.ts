// ─────────────────────────────────────────────────────────────────────────────
// i18n del CONTENIDO de los juegos (no del UI de Studio, que es español fijo).
// Un campo traducible es un mapa por idioma: { es: '…', en: '…' }. Un string
// plano también es válido y se resuelve a sí mismo, para poder localizar de a
// poco sin romper nada.
// ─────────────────────────────────────────────────────────────────────────────

/** Texto disponible por idioma, p. ej. { es: 'Hola', en: 'Hi' }. */
export type Localized<T = string> = Record<string, T>

/** Campo que puede ser un mapa localizado o un string plano (el string se
 *  resuelve a sí mismo — permite migrar idioma por idioma). */
export type I18nText = string | Localized

/** Resuelve un valor localizado a un idioma. Cae a `fallback`, y luego al
 *  primer valor disponible. Los valores planos pasan sin cambios. */
export function tr<T = string>(value: Localized<T> | T, locale: string, fallback = 'es'): T {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const map = value as Record<string, T>
    return (map[locale] ?? map[fallback] ?? Object.values(map)[0]) as T
  }
  return value as T
}

/** Reemplaza {placeholders} en una plantilla. Los placeholders desconocidos
 *  se dejan intactos. */
export function fill(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
}
