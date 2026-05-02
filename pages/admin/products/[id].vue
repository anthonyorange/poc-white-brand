<!-- pages/admin/products/[id].vue -->
<template>
  <div v-if="product">
    <h1 class="font-heading text-3xl text-primary mb-8">Modifier — {{ product.name }}</h1>
    <ProductForm :initial="product" submit-label="Enregistrer" :loading="loading" @submit="save" />
    <p v-if="error" role="alert" aria-live="assertive" class="font-body text-sm text-red-500 mt-4">
      {{ error }}
    </p>
  </div>
  <div v-else-if="!fetching" class="font-body text-primary/60 py-20 text-center">
    Produit introuvable.
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/composables/useProducts'
definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const { getBySlug, update } = useProducts()

const fetching = ref(true)
const loading = ref(false)
const error = ref('')
const product = ref<Product | null>(null)

// Validate id shape. Since slug == doc ID, it must match the slug regex.
// SYM-GR-0003.
const rawId = String(route.params.id ?? '')
const id = /^[a-z0-9-]{1,120}$/.test(rawId) ? rawId : ''

onMounted(async () => {
  if (!id) {
    fetching.value = false
    return
  }
  try {
    product.value = await getBySlug(id)
  } catch {
    product.value = null
  } finally {
    fetching.value = false
  }
})

const save = async (data: Omit<Product, 'id'>) => {
  if (!id) return
  loading.value = true
  error.value = ''
  try {
    await update(id, data)
    await navigateTo('/admin/products')
  } catch (e) {
    error.value =
      e instanceof Error ? e.message : "Impossible d'enregistrer les modifications."
  } finally {
    loading.value = false
  }
}
</script>
