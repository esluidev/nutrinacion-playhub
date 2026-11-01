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

  // Rutas publicas: inicio, login, invitacion (registro por token, sin sesion) y restablecer
  // (llega con el token del enlace de recuperacion; si ya no vale, la pagina lo dice).
  const isPublicRoute
    = to.path === '/'
    || to.path === '/login'
    || to.path === '/restablecer'
    || to.path.startsWith('/invitacion/')

  if (!isAuthenticated && !isPublicRoute) {
    return navigateTo('/login')
  }

  if (!isAuthenticated) return

  const { rutaInicial, asegurarContexto, administraOrgActiva, recordarRuta } = useContexto()

  // Aterrizaje: el ultimo contexto del selector, si sigue valido; si no, por rol (superadmin →
  // Platform, admin o colaborador → su organizacion). Ver `rutaInicial`.
  // `/inicio` y `/dashboard` eran rutas de antes: los enlaces viejos aterrizan igual.
  if (to.path === '/login' || to.path === '/' || to.path === '/inicio' || to.path.startsWith('/dashboard')) {
    return navigateTo(rutaInicial())
  }

  // Si tienes alguna organizacion, que SIEMPRE haya una activa — tambien en paginas que no lo
  // exigen (como /invitaciones). Si no, el switcher aparece vacio y nadie entiende que pasa.
  const conOrg = asegurarContexto()

  // El contexto lo dicta la ruta (tipo = prefijo). Cada seccion valida su acceso:

  // /platform es solo para el superadmin.
  if (to.path.startsWith('/platform') && !isSuper) {
    return navigateTo(rutaInicial())
  }

  // /organizacion exige operar alguna (administrar o colaborar); sin ninguna, el destino util
  // es otro (Platform para el superadmin, sin acceso para el resto).
  if (to.path.startsWith('/organizacion') && !conOrg) {
    return navigateTo(rutaInicial())
  }

  // Colaboradores y administradores son de quien administra la organizacion: el colaborador
  // vuelve a su inicio (la RLS le negaria igual las escrituras).
  if ((to.path.startsWith('/organizacion/colaboradores') || to.path.startsWith('/organizacion/administradores'))
    && !administraOrgActiva.value) {
    return navigateTo('/organizacion')
  }

  // El selector recuerda donde quedaste para la proxima entrada.
  recordarRuta(to.path)
})
