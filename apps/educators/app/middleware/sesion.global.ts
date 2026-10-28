// Todo Educators pide sesión de educador, salvo la entrada. Al cargar la app se comprueba el token
// guardado (educador_sesion): si ya no vale, se olvida y se vuelve a «Entrar».
export default defineNuxtRouteMiddleware(async (to) => {
  const { token, comprobar } = useSesion()
  await comprobar()
  if (to.path === '/entrar') {
    if (token.value) return navigateTo('/')
    return
  }
  if (!token.value) return navigateTo('/entrar')
})
