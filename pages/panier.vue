<!-- pages/panier.vue -->
<template>
  <div class="max-w-2xl mx-auto px-6 py-24">
    <h1 class="font-heading text-5xl text-primary mb-12 text-center">Panier</h1>

    <div v-if="cart.items.value.length === 0" class="text-center py-20">
      <p class="font-body text-primary/40 mb-6">Votre panier est vide.</p>
      <AppButton variant="outline" @click="navigateTo('/catalogue')">Voir la collection</AppButton>
    </div>

    <div v-else>
      <div
        v-for="item in cart.items.value"
        :key="item.productId"
        class="flex items-center gap-4 py-4 border-b border-accent/20"
      >
        <img
          :src="item.image"
          :alt="item.name"
          class="w-16 h-16 rounded-xl object-cover bg-surface"
        />
        <div class="flex-1">
          <p class="font-body text-primary font-medium">{{ item.name }}</p>
          <p class="font-body text-primary/50 text-sm">{{ item.price }} €</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="w-7 h-7 rounded-full border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
            @click="cart.updateQuantity(item.productId, item.quantity - 1)"
          >
            −
          </button>
          <span class="font-body text-sm w-4 text-center">{{ item.quantity }}</span>
          <button
            type="button"
            class="w-7 h-7 rounded-full border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
            @click="cart.updateQuantity(item.productId, item.quantity + 1)"
          >
            +
          </button>
        </div>
        <button
          type="button"
          class="text-primary/30 hover:text-primary/70 text-lg ml-2"
          @click="cart.remove(item.productId)"
        >
          ×
        </button>
      </div>

      <div class="flex justify-between items-center mt-8 pt-4">
        <p class="font-body text-primary/50">Total</p>
        <p class="font-heading text-2xl text-primary">{{ cart.total.value }} €</p>
      </div>

      <AppButton variant="primary" class="w-full mt-6" disabled>
        Passer commande (bientôt disponible)
      </AppButton>
      <p class="text-center font-body text-xs text-primary/30 mt-3">
        Paiement Stripe disponible prochainement
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const cart = useCart()
</script>
