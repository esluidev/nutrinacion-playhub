// Copiar al portapapeles. `navigator.clipboard` solo existe en contextos seguros (HTTPS o
// localhost): con la app compartida por Tailscale en http no está, y se usa el método antiguo.
export async function copiarTexto(texto: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(texto)
      return true
    }
    catch { /* sin permiso: se prueba el método antiguo */ }
  }
  const area = document.createElement('textarea')
  area.value = texto
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  }
  catch { ok = false }
  area.remove()
  return ok
}
