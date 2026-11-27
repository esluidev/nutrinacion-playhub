// El código de la conexión de un taller (tarea 013): seis letras y números sin los que se confunden. Lo escribe quien se
// une (la página para unirse de Player o `/code` de la app del hogar) y lo ve el educador en su pantalla. Sin dibujo ni
// Vue; las pruebas, en apps/player/tests/conexion.test.ts.

/** El alfabeto del código: sin 0/O ni 1/I/L (el check de workshop_conexiones). */
export const CODIGO_TALLER = /^[A-HJKMNP-Z2-9]{6}$/

/** El código como se escribió («k7m 2qx», «K7M·2QX») en su forma: mayúsculas y sin separadores. */
export function normalizarCodigo(texto: string): string {
  return texto.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function codigoValido(codigo: string): boolean {
  return CODIGO_TALLER.test(codigo)
}

/**
 * El código para leerlo en voz alta o en la pantalla: «K7M-2QX». Con guion y no con espacio (Luis, 2026-11-26): un
 * espacio hace dudar si hay que escribirlo. Al escribirlo da igual: `normalizarCodigo` quita guiones y espacios.
 */
export function codigoLegible(codigo: string): string {
  return codigo.length === 6 ? `${codigo.slice(0, 3)}-${codigo.slice(3)}` : codigo
}

/** Lo que se ve mientras se escribe el código: en mayúsculas, solo letras y números, y el guion tras los tres primeros. */
export function codigoAlEscribir(texto: string): string {
  const codigo = normalizarCodigo(texto).slice(0, 6)
  return codigo.length > 3 ? `${codigo.slice(0, 3)}-${codigo.slice(3)}` : codigo
}
