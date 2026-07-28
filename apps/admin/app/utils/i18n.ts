// Conteos con plural correcto: para n=1 usa la clave `<key>One` ("1 educador"),
// para el resto `<key>` con {n} ("{n} educadores"). Ambas claves viven en messages.ts.
export function tCount(
  t: (key: string, vars?: Record<string, string | number>) => string,
  key: string,
  n: number,
): string {
  return n === 1 ? t(`${key}One`) : t(key, { n })
}
