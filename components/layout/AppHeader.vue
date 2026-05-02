<!-- components/layout/AppHeader.vue -->
<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-background/80 border-b border-accent/20"
  >
    <NuxtLink to="/" class="font-heading text-xl text-primary tracking-widest">
      {{ brand.config.value.name }}
    </NuxtLink>

    <nav class="hidden md:flex gap-8 font-body text-sm text-primary/70">
      <NuxtLink to="/catalogue" class="hover:text-primary transition-colors">Collection</NuxtLink>
      <NuxtLink to="/creatrice" class="hover:text-primary transition-colors">La Créatrice</NuxtLink>
      <NuxtLink to="/contact" class="hover:text-primary transition-colors">Contact</NuxtLink>
    </nav>

    <NuxtLink to="/panier" class="relative">
      <span class="text-primary text-sm font-body">Panier</span>
      <span
        v-if="cart.count.value > 0"
        class="absolute -top-2 -right-4 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
        >{{ cart.count.value }}</span
      >
    </NuxtLink>
  </header>
</template>

<script setup lang="ts">
const brand = useBrand()
const cart = useCart()
</script>
