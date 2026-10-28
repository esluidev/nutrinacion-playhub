// Paginación en servidor de las listas de Platform: un solo tamaño de página para toda la app.
export const PAGE_SIZE = 20

/** Rango [desde, hasta] (inclusivo) de una página, para `.range()` de Supabase. */
export function rangoDePagina(page: number): [number, number] {
  const from = (page - 1) * PAGE_SIZE
  return [from, from + PAGE_SIZE - 1]
}
