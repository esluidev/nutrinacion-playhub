import { messages } from '~/i18n/messages'

export type Locale = 'es' | 'en'

// Idioma de UI actual. Lo fija useAuth desde perfiles.idioma al cargar la sesión.
export function useLocale() {
  return useState<Locale>('locale', () => 'es')
}

function resolve(obj: unknown, key: string): string | undefined {
  const val = key.split('.').reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]), obj)
  return typeof val === 'string' ? val : undefined
}

// Traductor: t('platform.orgs.title', { org: 'X' }). Fallback: locale actual → español → la clave.
export function useT() {
  const locale = useLocale()
  function t(key: string, vars?: Record<string, string | number>): string {
    let msg = resolve(messages[locale.value], key) ?? resolve(messages.es, key) ?? key
    if (vars) msg = msg.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
    return msg
  }
  return { t, locale }
}
