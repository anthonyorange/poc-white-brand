// middleware/auth.ts
// Defense in depth: UI guard. The real authz is enforced by Firestore/Storage rules.
// SYM-GR-0004 (least privilege).
//
// Flow:
// 1. If we're entering /admin/** (except /admin/login), we need to know the
//    auth state before deciding. Kick off init() if not started, then wait
//    until loading settles.
// 2. Redirect to /admin/login if user is null OR missing the admin custom claim.
export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) return
  if (to.path === '/admin/login') return

  // Only run client-side: Firebase Auth isn't available on SSR and we don't
  // want to block navigation when crawlers hit these routes (Firestore rules
  // still protect everything).
  if (!import.meta.client) return

  const { user, loading, isAdmin, init } = useAuth()

  // Ensure init() has been kicked off. Idempotent: Firebase onAuthStateChanged
  // tolerates multiple listeners and our lazy SDK is memoized.
  if (loading.value) init()

  // Wait at most 3 seconds for the initial auth state to resolve, then fall
  // through. If it doesn't resolve, user is treated as anonymous and redirected.
  await new Promise<void>((resolve) => {
    if (!loading.value) return resolve()
    const unwatch = watch(loading, (l) => {
      if (!l) {
        unwatch()
        resolve()
      }
    })
    setTimeout(() => {
      unwatch()
      resolve()
    }, 3000)
  })

  if (!user.value) return navigateTo('/admin/login')
  if (!isAdmin.value) return navigateTo('/admin/login')
})
