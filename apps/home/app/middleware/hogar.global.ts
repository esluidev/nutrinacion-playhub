// El orden de la primera vez (tarea 025): el país, después el primer perfil (o entrar con la cuenta, que los trae); y
// para jugar, alguien que juegue. Ajustes siempre se puede abrir.
// Unirse a un taller (`/code`) no pide nada: se puede entrar con un QR sin haber configurado la app.
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server || to.path === '/ajustes' || to.path === '/code' || to.path.startsWith('/code/')) return
  const { pais, perfiles, actual } = useHogar()
  if (!pais.value) return to.path === '/pais' ? undefined : navigateTo('/pais')
  const sinPerfil = ['/perfiles/nuevo', '/pais', '/cuenta']
  if (!perfiles.value.length) return sinPerfil.some(ruta => to.path.startsWith(ruta)) ? undefined : navigateTo('/perfiles/nuevo')
  const conPerfil = ['/inicio', '/explorar', '/unidades', '/jugar']
  if (conPerfil.some(ruta => to.path.startsWith(ruta)) && !actual.value) return navigateTo('/')
})
