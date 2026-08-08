import { esRutaPublica } from '~/utils/rutasPublicas'

export default defineNuxtRouteMiddleware(async (to) => {
  // Qué es público vive en `utils/rutasPublicas.ts`, con tests. Lo crítico: `/play/**` es el
  // runner y lo abre el webview de educadores SIN sesión — nunca protegerlo desde acá.
  if (esRutaPublica(to.path)) return

  const { user, fetchUser, loading } = useAuth()

  if (loading.value) {
    await fetchUser()
  }

  // La gestión es solo para superadmin: `useAuth` deja `user` en null si el perfil no lo es,
  // aunque las credenciales de Supabase sean válidas.
  if (!user.value) {
    return navigateTo('/login')
  }
})
