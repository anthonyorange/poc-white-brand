<!-- components/layout/AppHeader.vue -->
<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-background/80 border-b border-accent/20"
  >
    <NuxtLink
      to="/"
      class="font-heading text-xl text-primary tracking-widest focus-ring rounded-sm"
      :aria-label="`${brand.config.value.name} — accueil`"
    >
      {{ brand.config.value.name }}
    </NuxtLink>

    <nav class="hidden md:flex gap-8 font-body text-sm text-primary/70" aria-label="Navigation principale">
      <NuxtLink to="/catalogue" class="focus-ring rounded-sm hover:text-primary transition-colors">
        Collection
      </NuxtLink>
      <NuxtLink to="/creatrice" class="focus-ring rounded-sm hover:text-primary transition-colors">
        La Créatrice
      </NuxtLink>
      <NuxtLink to="/contact" class="focus-ring rounded-sm hover:text-primary transition-colors">
        Contact
      </NuxtLink>
    </nav>

    <NuxtLink
      to="/panier"
      class="relative focus-ring rounded-sm"
      :aria-label="cartAriaLabel"
    >
      <span class="text-primary text-sm font-body">Panier</span>
      <span
        v-if="cart.count.value > 0"
        aria-hidden="true"
        class="absolute -top-2 -right-4 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
      >{{ cart.count.value }}</span>
    </NuxtLink>
  </header>
</template>

<script setup lang="ts">
const brand = useBrand()
const cart = useCart()

const cartAriaLabel = computed(() =>
  cart.count.value > 0
    ? `Panier (${cart.count.value} article${cart.count.value > 1 ? 's' : ''})`
    : 'Panier (vide)',
)
</script>
