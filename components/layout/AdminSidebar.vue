<!-- components/layout/AdminSidebar.vue -->
<template>
  <aside class="w-56 min-h-screen bg-surface border-r border-accent/20 flex flex-col py-8 px-4 gap-2">
    <p class="font-heading text-primary text-lg mb-6 px-2">Admin</p>
    <NuxtLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      class="px-3 py-2 rounded-lg font-body text-sm text-primary/70 hover:bg-accent/20 hover:text-primary transition-colors"
      active-class="bg-accent/30 text-primary font-medium"
    >{{ link.label }}</NuxtLink>
    <div class="flex-1" />
    <button
      type="button"
      class="px-3 py-2 text-sm font-body text-primary/40 hover:text-primary transition-colors text-left"
      @click="auth.logout()"
    >
      Déconnexion
    </button>
  </aside>
</template>

<script setup lang="ts">
const auth = useAuth()
const links = [
  { to: '/admin/dashboard',  label: 'Dashboard' },
  { to: '/admin/products',   label: 'Produits' },
  { to: '/admin/messages',   label: 'Messages' },
  { to: '/admin/settings',   label: 'Paramètres' },
]
</script>
