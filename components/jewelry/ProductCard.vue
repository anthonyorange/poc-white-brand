<!-- components/jewelry/ProductCard.vue -->
<template>
  <NuxtLink :to="`/catalogue/${product.slug}`" class="group block">
    <FloatWrapper>
      <div class="relative overflow-hidden rounded-2xl bg-surface aspect-square mb-3">
        <img
          v-if="product.images[0]"
          :src="product.images[0]"
          :alt="product.name"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div v-else class="w-full h-full flex items-center justify-center text-primary/20 text-4xl">
          ◇
        </div>
        <span
          v-if="product.stock === 0"
          class="absolute top-3 right-3 bg-white/90 text-primary/60 text-xs px-2 py-1 rounded-full font-body"
          >Épuisé</span
        >
      </div>
    </FloatWrapper>
    <h3 class="font-heading text-primary text-lg leading-tight">{{ product.name }}</h3>
    <p class="font-body text-primary/60 text-sm mt-1">{{ product.price }} €</p>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Product } from '~/composables/useProducts'
defineProps<{ product: Product }>()
</script>
