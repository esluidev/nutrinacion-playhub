import type { AuthUser } from '~/types/auth'

// Demo credentials: admin@nutrinacion.com / studio
const DEMO_USER: AuthUser = {
  id: 'demo-studio-user',
  email: 'admin@nutrinacion.com',
  name: 'Admin Studio',
}

const DEMO_PASSWORD = 'studio'
const STORAGE_KEY = 'studio-auth-user'

export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const loading = useState('auth-loading', () => true)

  async function fetchUser() {
    if (import.meta.client) {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          user.value = JSON.parse(stored) as AuthUser
        }
        catch {
          user.value = null
        }
      }
    }
    loading.value = false
  }

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    if (email === DEMO_USER.email && password === DEMO_PASSWORD) {
      user.value = DEMO_USER
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_USER))
      }
      return { error: null }
    }
    return { error: 'Credenciales incorrectas' }
  }

  async function signOut() {
    user.value = null
    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEY)
    }
    await navigateTo('/login')
  }

  return { user, loading, fetchUser, signIn, signOut }
}
