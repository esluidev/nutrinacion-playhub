// La gestión de Player es solo para el superadmin. El runner (`/play/**`) queda público: lo
// incrustan Educators y la app del hogar, y lo abren los dispositivos (docs/runner.md).
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/play/')) return

  // La sesión (y con ella el cliente de Supabase) se carga solo aquí, fuera del runner: importada arriba, viajaría
  // en el arranque de toda la app y el runner la descargaría sin usarla.
  const sesion = await import('~/composables/useSesion')
  const { usuario, cargar } = sesion.useSesion()
  await cargar()

  if (to.path === '/entrar') return usuario.value ? navigateTo('/') : undefined
  if (!usuario.value) return navigateTo('/entrar')
})
