<!-- pages/admin/products/[id].vue -->
<template>
  <div v-if="product">
    <h1 class="font-heading text-3xl text-primary mb-8">Modifier — {{ product.name }}</h1>
    <ProductForm :initial="product" submit-label="Enregistrer" :loading="loading" @submit="save" />
    <p v-if="error" class="font-body text-sm text-red-400 mt-4">{{ error }}</p>
  </div>
  <div v-else class="font-body text-primary/40 py-20 text-center">Produit introuvable.</div>
</template>

<script setup lang="ts">
import type { Product } from '~/composables/useProducts'
import { doc, getDoc } from 'firebase/firestore'
definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const db = useFirestore()
const { update } = useProducts()

const loading = ref(false)
const error = ref('')
const product = ref<Product | null>(null)

// Validate id shape (Firestore doc IDs are alphanumeric; keep a sane bound).
// SYM-GR-0003.
const rawId = String(route.params.id ?? '')
const id = /^[A-Za-z0-9_-]{1,128}$/.test(rawId) ? rawId : ''

onMounted(async () => {
  if (!id) return
  try {
    const snap = await getDoc(doc(db, 'products', id))
    if (snap.exists()) {
      product.value = { id: snap.id, ...snap.data() } as Product
    }
  } catch {
    product.value = null
  }
})

const save = async (data: Omit<Product, 'id'>) => {
  if (!id) return
  loading.value = true
  error.value = ''
  try {
    await update(id, data)
    await navigateTo('/admin/products')
  } catch {
    error.value = "Impossible d'enregistrer les modifications."
  } finally {
    loading.value = false
  }
}
</script>
