// middleware/auth.ts
// Defense in depth: UI guard. The real authz is enforced by Firestore/Storage rules.
// SYM-GR-0004 (least privilege).
export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/admin')) return
  if (to.path === '/admin/login') return

  const { user, loading, isAdmin } = useAuth()

  if (import.meta.client && !loading.value) {
    if (!user.value) return navigateTo('/admin/login')
    if (!isAdmin.value) {
      // Signed in but not admin — don't reveal anything.
      return navigateTo('/admin/login')
    }
  }
})
