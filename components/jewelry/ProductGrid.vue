<!-- components/jewelry/ProductGrid.vue -->
<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    <RevealOnScroll v-for="product in products" :key="product.id">
      <ProductCard :product="product" />
    </RevealOnScroll>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/composables/useProducts'
defineProps<{ products: Product[] }>()
</script>
