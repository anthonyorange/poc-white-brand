<!-- pages/catalogue/[slug].vue -->
<template>
  <div v-if="product" class="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-16 items-start">
    <ImageGallery :images="product.images" :alt="product.name" />

    <div class="sticky top-24">
      <p class="font-body text-xs tracking-widest text-primary/60 uppercase mb-2">
        {{ categoryLabel[product.category] }}
      </p>
      <h1 class="font-heading text-4xl text-primary mb-4">{{ product.name }}</h1>
      <p class="font-heading text-2xl text-primary mb-6">{{ product.price }} €</p>
      <p class="font-body text-primary/70 leading-relaxed mb-8 whitespace-pre-line">
        {{ product.description }}
      </p>

      <div v-if="product.stock > 0">
        <AppButton variant="primary" class="w-full" @click="addToCart">
          Ajouter au panier
        </AppButton>
        <p class="text-center font-body text-xs text-primary/60 mt-3">
          {{ product.stock }} en stock
        </p>
      </div>
      <p
        v-else
        class="text-center font-body text-primary/70 py-4 border border-primary/20 rounded-full"
      >
        Épuisé
      </p>
    </div>
  </div>
  <div v-else class="text-center py-32 font-body text-primary/60">Produit introuvable.</div>
</template>

<script setup lang="ts">
const route = useRoute()
const { getBySlug } = useProducts()
const { add } = useCart()

// Sanitize slug. Product doc ID == slug; must match the slug regex.
// SYM-GR-0003.
const rawSlug = String(route.params.slug ?? '')
const slug = /^[a-z0-9-]{1,120}$/.test(rawSlug) ? rawSlug : ''

// useAsyncData: runs on the server first (producing indexable HTML), is
// serialized to the client payload, and can be re-run on client navigation.
// If the SSR fetch fails (e.g. rules blocked it during build), we return null
// and render the "Produit introuvable" state.
const { data: product } = await useAsyncData(`product-${slug}`, async () => {
  if (!slug) return null
  try {
    return await getBySlug(slug)
  } catch {
    return null
  }
})

// Return 404 when the slug doesn't resolve, so bots get a proper status code
// and search engines don't index empty pages.
if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: 'Produit introuvable' })
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

// SEO: set meta from the server-fetched product so HTML served to crawlers
// already contains the right title/description/og:image.
useSeoMeta({
  title: () => product.value?.name ?? '',
  description: () => product.value?.description ?? '',
  ogType: 'product',
  ogTitle: () => product.value?.name ?? '',
  ogDescription: () => product.value?.description ?? '',
  ogImage: () => product.value?.images[0],
  twitterCard: 'summary_large_image',
})
</script>
