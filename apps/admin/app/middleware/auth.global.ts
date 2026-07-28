export default defineNuxtRouteMiddleware(async (to) => {
  // Sin Supabase configurado corre en modo demo (datos estaticos): no se protege nada.
  if (!isSupabaseConfigured()) return

  const { user, fetchUser, loading } = useAuth()

  if (loading.value) {
    await fetchUser()
  }

  const u = user.value
  const isAuthenticated = !!u
  const isSuper = u?.perfil.superadmin === true

  // Rutas publicas: inicio, login e invitacion (registro por token, sin sesion).
  const isPublicRoute
    = to.path === '/'
    || to.path === '/login'
    || to.path.startsWith('/invitacion/')

  if (!isAuthenticated && !isPublicRoute) {
    return navigateTo('/login')
  }

  if (!isAuthenticated) return

  const { rutaInicial, asegurarContexto, asegurarComunidad, administraOrgActiva, destinos } = useContexto()

  // Aterrizaje: no hay reglas por tipo de usuario. Se resuelve por la SUPERFICIE DE ACCESO —
  // contexto guardado y aun valido → ahi; una sola comunidad → ahi; un solo destino → ahi;
  // varios → hub; ninguno → sin acceso.
  if (to.path === '/login' || to.path === '/') {
    return navigateTo(rutaInicial())
  }

  // Si tienes algun contexto, que SIEMPRE haya uno activo — tambien en paginas que no lo
  // exigen (como /invitaciones). Si no, el switcher aparece vacio y nadie entiende que pasa.
  asegurarContexto()

  // El contexto lo dicta la ruta (tipo = prefijo). Cada seccion valida su acceso:

  // /platform es solo para el superadmin.
  if (to.path.startsWith('/platform') && !isSuper) {
    return navigateTo(rutaInicial())
  }

  // El nivel organizacion solo existe si administras la org activa.
  if (to.path.startsWith('/organizacion') && !administraOrgActiva.value) {
    return navigateTo(rutaInicial())
  }

  // El dashboard opera SOBRE una comunidad: si el contexto no la tiene, se recupera la
  // recordada o la primera de la org activa; sin ninguna, el destino util es otro.
  if (to.path.startsWith('/dashboard') && !asegurarComunidad()) {
    if (!destinos.value.length) return navigateTo('/sin-acceso')
    // Admin sin comunidades todavia: al home de su org (ahi vive el CTA de crear la primera).
    if (administraOrgActiva.value) return navigateTo('/organizacion')
    return navigateTo('/inicio')
  }
})
