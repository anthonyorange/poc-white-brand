<!-- pages/admin/dashboard.vue -->
<template>
  <div>
    <h1 class="font-heading text-3xl text-primary mb-8">Dashboard</h1>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
      <StatsCard label="Produits" :value="stats.products" />
      <StatsCard label="Dont featured" :value="stats.featured" />
      <StatsCard label="Messages" :value="stats.messages" sub="non lus" />
      <StatsCard label="Commandes" value="—" sub="phase 2" />
    </div>
    <div class="flex gap-3">
      <AppButton variant="outline" @click="navigateTo('/admin/products/new')">+ Nouveau produit</AppButton>
      <AppButton variant="ghost" @click="navigateTo('/admin/messages')">Voir les messages</AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getDocs, collection, query, where } from 'firebase/firestore'
definePageMeta({ layout: 'admin', middleware: 'auth' })

const db = useFirestore()
const stats = reactive({ products: 0, featured: 0, messages: 0 })

onMounted(async () => {
  try {
    const [allProducts, featuredProducts, unreadMessages] = await Promise.all([
      getDocs(collection(db, 'products')),
      getDocs(query(collection(db, 'products'), where('featured', '==', true))),
      getDocs(query(collection(db, 'messages'), where('read', '==', false))),
    ])
    stats.products = allProducts.size
    stats.featured = featuredProducts.size
    stats.messages = unreadMessages.size
  } catch {
    // Firestore rules will block non-admins; keep UI quiet on failure.
  }
})
</script>
