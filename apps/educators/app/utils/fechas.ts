// Fecha legible en el idioma de la interfaz: «martes, 14 de octubre».
export function fechaLarga(iso: string, locale: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, m! - 1, d!).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
}
