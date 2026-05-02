<!-- pages/catalogue/[slug].vue -->
<template>
  <div v-if="product" class="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-16 items-start">
    <ImageGallery :images="product.images" :alt="product.name" />

    <div class="sticky top-24">
      <p class="font-body text-xs tracking-widest text-primary/40 uppercase mb-2">{{ categoryLabel[product.category] }}</p>
      <h1 class="font-heading text-4xl text-primary mb-4">{{ product.name }}</h1>
      <p class="font-heading text-2xl text-primary mb-6">{{ product.price }} €</p>
      <p class="font-body text-primary/60 leading-relaxed mb-8">{{ product.description }}</p>

      <div v-if="product.stock > 0">
        <AppButton variant="primary" class="w-full" @click="addToCart">Ajouter au panier</AppButton>
        <p class="text-center font-body text-xs text-primary/40 mt-3">{{ product.stock }} en stock</p>
      </div>
      <p v-else class="text-center font-body text-primary/40 py-4 border border-primary/20 rounded-full">Épuisé</p>
    </div>
  </div>
  <div v-else class="text-center py-32 font-body text-primary/40">Produit introuvable.</div>
</template>

<script setup lang="ts">
import type { Product } from '~/composables/useProducts'

const route = useRoute()
const { getBySlug } = useProducts()
const { add } = useCart()
const brand = useBrand()

// Sanitize slug: [a-z0-9-] only to avoid any query injection shenanigans.
// SYM-GR-0003.
const rawSlug = String(route.params.slug ?? '')
const slug = /^[a-z0-9-]{1,80}$/.test(rawSlug) ? rawSlug : ''

const product = ref<Product | null>(null)

if (slug) {
  try {
    product.value = await getBySlug(slug)
  } catch {
    product.value = null
  }
}

const categoryLabel: Record<string, string> = {
  bagues: 'Bagues',
  colliers: 'Colliers',
  bracelets: 'Bracelets',
  boucles: "Boucles d'oreilles",
}

const addToCart = () => {
  const p = product.value
  if (!p) return
  add({ productId: p.id!, name: p.name, price: p.price, image: p.images[0] ?? '' })
}

watchEffect(() => {
  if (product.value) {
    useSeoMeta({
      title: `${product.value.name} — ${brand.config.value.name}`,
      description: product.value.description,
      ogImage: product.value.images[0],
    })
  }
})
</script>
