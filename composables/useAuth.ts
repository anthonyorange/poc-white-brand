// composables/useAuth.ts
// All firebase/auth imports are dynamic so the SDK is only downloaded when
// the admin flow runs (login / init after navigation into /admin).
// SYM-GR-0019 (minimum baseline: don't ship admin SDKs to public pages).
import type { User } from 'firebase/auth'

export const useAuth = () => {
  const user = useState<User | null>('auth-user', () => null)
  const loading = useState<boolean>('auth-loading', () => true)
  // Admin flag driven by Firebase custom claim "admin" — defense in depth
  // alongside Firestore rules. SYM-GR-0004 (least privilege).
  const isAdminClaim = useState<boolean>('auth-admin-claim', () => false)

  const init = async () => {
    const [auth, { onAuthStateChanged }] = await Promise.all([
      useFirebaseAuth(),
      import('firebase/auth'),
    ])
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
    const [auth, { signInWithEmailAndPassword }] = await Promise.all([
      useFirebaseAuth(),
      import('firebase/auth'),
    ])
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    const [auth, { signOut }] = await Promise.all([useFirebaseAuth(), import('firebase/auth')])
    await signOut(auth)
    await navigateTo('/admin/login')
  }

  // Authenticated user is considered admin only if the custom claim is set.
  // Firestore rules are the source of truth; this flag gates UI only.
  const isAdmin = computed(() => !!user.value && isAdminClaim.value)

  return { user, loading, isAdmin, init, login, logout }
}
