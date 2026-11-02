// Todo Educators pide sesión de educador, salvo la entrada y el enlace de acceso (/acceso/<token>,
// 0013), que se abre con o sin sesión. Al cargar la app se comprueba el token guardado
// (educador_sesion): si ya no vale, se olvida y se vuelve a «Entrar».
export default defineNuxtRouteMiddleware(async (to) => {
  const { token, comprobar } = useSesion()
  await comprobar()
  if (to.path.startsWith('/acceso/')) return
  if (to.path === '/entrar') {
    if (token.value) return navigateTo('/')
    return
  }
  if (!token.value) return navigateTo('/entrar')
})
