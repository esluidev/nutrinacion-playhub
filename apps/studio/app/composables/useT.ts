import { fill, tr, type Localized } from '~/types/i18n'

// Traductor por escena (auto-importado). `strings` es la tabla `strings` del
// scene.config (clave → { es, en, … }); `locale` es un getter del idioma activo
// (normalmente `() => props.locale`). Si falta la clave devuelve la clave misma,
// para que un texto sin traducir SALTE a la vista en lugar de quedar vacío.
//
//   const t = useT(config.strings, () => props.locale)
//   t('cta')                        → string resuelto al idioma
//   t('matchVoice', { name })       → con {placeholders} rellenados
export function useT(
  strings: Record<string, Localized> | undefined,
  locale: () => string | undefined,
) {
  return (key: string, vars?: Record<string, string | number>): string => {
    const entry = strings?.[key]
    if (entry == null) return key
    return fill(tr(entry, locale() ?? 'es'), vars)
  }
}
