// La gestión de Player es solo para el superadmin. El runner (`/play/**`) queda público: lo
// incrustan Educators y la app del hogar, y lo abren los dispositivos (docs/runner.md).
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/play/')) return

  const { usuario, cargar } = useSesion()
  await cargar()

  if (to.path === '/entrar') return usuario.value ? navigateTo('/') : undefined
  if (!usuario.value) return navigateTo('/entrar')
})
