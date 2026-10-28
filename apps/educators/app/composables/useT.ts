import { messages } from '~/i18n/messages'
import type { Locale } from '~/i18n/messages'

const STORAGE = 'playhub-educadores-idioma'

// Idioma de la interfaz de Educators (español o inglés), recordado en este dispositivo.
export function useT() {
  const locale = useState<Locale>('locale', () => {
    if (import.meta.client) {
      try {
        const saved = localStorage.getItem(STORAGE)
        if (saved === 'es' || saved === 'en') return saved
      }
      catch { /* sin almacenamiento */ }
    }
    return 'es'
  })

  function t(key: string, vars?: Record<string, string | number>): string {
    const msg = messages[locale.value][key] ?? messages.es[key] ?? key
    return vars ? msg.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? '')) : msg
  }

  function setLocale(value: Locale) {
    locale.value = value
    try { localStorage.setItem(STORAGE, value) }
    catch { /* sin almacenamiento */ }
    useHead({ htmlAttrs: { lang: value } })
  }

  return { t, locale, setLocale }
}
