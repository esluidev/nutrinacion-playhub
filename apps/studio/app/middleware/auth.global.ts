export default defineNuxtRouteMiddleware(async (to) => {
  // /play/** routes are public — they are loaded by Educators WebView without a session
  if (to.path.startsWith('/play/')) return
  if (to.path === '/login') return

  const { user, fetchUser, loading } = useAuth()

  if (loading.value) {
    await fetchUser()
  }

  const isAuthenticated = !!user.value

  if (!isAuthenticated) {
    return navigateTo('/login')
  }

  // Redirect authenticated users away from login
  if (isAuthenticated && to.path === '/login') {
    return navigateTo('/')
  }
})
