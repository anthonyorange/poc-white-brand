<!-- pages/admin/products/new.vue -->
<template>
  <div>
    <h1 class="font-heading text-3xl text-primary mb-8">Nouveau produit</h1>
    <ProductForm submit-label="Créer le produit" :loading="loading" @submit="create" />
    <p v-if="error" role="alert" aria-live="assertive" class="font-body text-sm text-red-500 mt-4">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/composables/useProducts'
definePageMeta({ layout: 'admin', middleware: 'auth' })

const { create: createProduct } = useProducts()
const loading = ref(false)
const error = ref('')

const create = async (data: Omit<Product, 'id'>) => {
  loading.value = true
  error.value = ''
  try {
    await createProduct(data)
    await navigateTo('/admin/products')
  } catch (e) {
    // Surface the message from useProducts.create (slug already taken, etc.)
    // so the admin knows what to fix. Safe because messages are curated.
    error.value = e instanceof Error ? e.message : 'Impossible de créer le produit.'
  } finally {
    loading.value = false
  }
}
</script>
