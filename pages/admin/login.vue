<!-- pages/admin/login.vue -->
<template>
  <div class="min-h-screen bg-background flex items-center justify-center px-6">
    <div class="w-full max-w-sm">
      <div class="text-center mb-10">
        <p class="font-heading text-3xl text-primary">Administration</p>
        <p class="font-body text-sm text-primary/40 mt-2">{{ brand.config.value.name }}</p>
      </div>
      <form class="flex flex-col gap-4" @submit.prevent="submit">
        <input
          v-model="email"
          type="email"
          required
          autocomplete="username"
          placeholder="Email"
          class="border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary transition-colors"
        />
        <input
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          placeholder="Mot de passe"
          class="border border-accent/40 rounded-xl px-4 py-3 font-body text-sm bg-surface/50 outline-none focus:border-primary transition-colors"
        />
        <p v-if="error" class="text-red-400 text-xs font-body text-center">{{ error }}</p>
        <AppButton type="submit" variant="primary" :disabled="loading">
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </AppButton>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const brand = useBrand()
const { login, user, isAdmin } = useAuth()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

watch([user, isAdmin], ([u, admin]) => {
  if (u && admin) navigateTo('/admin/dashboard')
})

const submit = async () => {
  loading.value = true
  error.value = ''
  try {
    await login(email.value, password.value)
    // isAdmin will be resolved by onAuthStateChanged + getIdTokenResult.
    // Let the watcher handle the redirect when the claim arrives.
  } catch {
    // Generic message to avoid user enumeration. SYM-GR-0007 (A07).
    error.value = 'Email ou mot de passe incorrect.'
  } finally {
    loading.value = false
  }
}
</script>
