// composables/useAuth.ts
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth'

export const useAuth = () => {
  const user = useState<User | null>('auth-user', () => null)
  const loading = useState<boolean>('auth-loading', () => true)
  // Admin flag driven by Firebase custom claim "admin" — defense in depth
  // alongside Firestore rules. SYM-GR-0004 (least privilege).
  const isAdminClaim = useState<boolean>('auth-admin-claim', () => false)

  const init = () => {
    const auth = useFirebaseAuth()
    onAuthStateChanged(auth, async (u) => {
      user.value = u
      if (u) {
        try {
          const token = await u.getIdTokenResult()
          isAdminClaim.value = token.claims.admin === true
        } catch {
          isAdminClaim.value = false
        }
      } else {
        isAdminClaim.value = false
      }
      loading.value = false
    })
  }

  const login = async (email: string, password: string) => {
    const auth = useFirebaseAuth()
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    const auth = useFirebaseAuth()
    await signOut(auth)
    await navigateTo('/admin/login')
  }

  // Authenticated user is considered admin only if the custom claim is set.
  // Firestore rules are the source of truth; this flag gates UI only.
  const isAdmin = computed(() => !!user.value && isAdminClaim.value)

  return { user, loading, isAdmin, init, login, logout }
}
