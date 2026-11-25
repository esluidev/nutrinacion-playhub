// Comparar textos al buscar: sin acentos ni mayúsculas, así «maria» encuentra «María» y «nutricion», «Nutrición».
export function sinAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}
