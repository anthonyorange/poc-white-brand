<!-- pages/index.vue -->
<template>
  <div>
    <!-- HERO -->
    <section class="relative min-h-screen flex items-center justify-center overflow-hidden">
      <BlobBackground />
      <div class="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <RevealOnScroll>
          <p class="font-body text-sm tracking-widest text-primary/50 uppercase mb-4">
            {{ brand.config.value.slogan }}
          </p>
          <h1 class="font-heading text-5xl md:text-7xl text-primary leading-tight mb-6">
            {{ brand.config.value.texts.heroTitle }}
          </h1>
          <p class="font-body text-lg text-primary/60 mb-10">
            {{ brand.config.value.texts.heroSubtitle }}
          </p>
          <AppButton variant="primary" @click="navigateTo('/catalogue')"
            >Découvrir la collection</AppButton
          >
        </RevealOnScroll>
      </div>
    </section>

    <!-- STORYTELLING -->
    <section class="py-24 px-6 max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
      <ParallaxSection :speed="-10">
        <div class="aspect-square rounded-3xl bg-surface overflow-hidden">
          <img
            v-if="heroImage"
            :src="heroImage"
            alt="La créatrice"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full bg-gradient-to-br from-accent/40 to-secondary/30" />
        </div>
      </ParallaxSection>
      <RevealOnScroll>
        <p class="font-body text-xs tracking-widest text-primary/40 uppercase mb-3">La créatrice</p>
        <h2 class="font-heading text-4xl text-primary mb-6">
          Une histoire de mains et de matières
        </h2>
        <p class="font-body text-primary/60 leading-relaxed mb-8">
          {{ brand.config.value.texts.aboutSummary }}
        </p>
        <AppButton variant="outline" @click="navigateTo('/creatrice')">En savoir plus</AppButton>
      </RevealOnScroll>
    </section>

    <!-- MOSAÏQUE PRODUITS FEATURED -->
    <section class="py-16 px-6 max-w-5xl mx-auto">
      <RevealOnScroll>
        <h2 class="font-heading text-3xl text-primary text-center mb-12">Pièces du moment</h2>
      </RevealOnScroll>
      <div v-if="featured.length" class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <RevealOnScroll
          v-for="(product, i) in featured"
          :key="product.id"
          :class="{ 'md:col-span-2 md:row-span-2': i === 0 }"
        >
          <ProductCard :product="product" class="h-full" />
        </RevealOnScroll>
      </div>
      <div class="text-center mt-12">
        <AppButton variant="ghost" @click="navigateTo('/catalogue')"
          >Voir toute la collection →</AppButton
        >
      </div>
    </section>

    <!-- CATÉGORIES -->
    <section class="py-16 px-6 bg-surface/50">
      <div class="max-w-5xl mx-auto">
        <RevealOnScroll>
          <h2 class="font-heading text-3xl text-primary text-center mb-12">Collections</h2>
        </RevealOnScroll>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <RevealOnScroll v-for="cat in categories" :key="cat.slug">
            <NuxtLink
              :to="`/catalogue?category=${cat.slug}`"
              class="group relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br cursor-pointer"
              :class="cat.gradient"
            >
              <div
                class="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center"
              >
                <span class="text-3xl">{{ cat.icon }}</span>
                <span class="font-heading text-lg text-primary">{{ cat.name }}</span>
              </div>
            </NuxtLink>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const brand = useBrand()
const { getFeatured } = useProducts()
const heroImage = ref('')

const categories = [
  { name: 'Bagues', slug: 'bagues', icon: '💍', gradient: 'from-accent/30 to-surface' },
  { name: 'Colliers', slug: 'colliers', icon: '📿', gradient: 'from-secondary/30 to-surface' },
  { name: 'Bracelets', slug: 'bracelets', icon: '✨', gradient: 'from-primary/10 to-surface' },
  { name: 'Boucles', slug: 'boucles', icon: '⭐', gradient: 'from-accent/20 to-secondary/20' },
]

// SSR-ready: useAsyncData runs on the server first (producing indexable HTML),
// hydrates the client, and dedupes across navigations.
// SYM-GR-0010: silent fallback to [] prevents leaking backend errors.
const { data: featured } = await useAsyncData(
  'home-featured',
  async () => {
    try {
      return await getFeatured()
    } catch {
      return []
    }
  },
  { default: () => [] },
)

useSeoMeta({
  title: () => brand.config.value.texts.heroTitle,
  description: () => brand.config.value.texts.heroSubtitle,
  ogTitle: () => `${brand.config.value.name} — ${brand.config.value.slogan}`,
  ogDescription: () => brand.config.value.texts.heroSubtitle,
})
</script>
