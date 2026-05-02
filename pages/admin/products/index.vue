<!-- pages/admin/products/index.vue -->
<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <h1 class="font-heading text-3xl text-primary">Produits</h1>
      <AppButton variant="primary" @click="navigateTo('/admin/products/new')"
        >+ Nouveau produit</AppButton
      >
    </div>

    <div class="divide-y divide-accent/20">
      <div v-for="p in products" :key="p.id" class="flex items-center gap-4 py-4">
        <NuxtImg
          v-if="p.images[0]"
          :src="p.images[0]"
          :alt="p.name"
          width="56"
          height="56"
          format="webp"
          fit="cover"
          loading="lazy"
          class="w-14 h-14 rounded-lg object-cover bg-surface"
        />
        <div v-else class="w-14 h-14 rounded-lg bg-surface" aria-hidden="true" />
        <div class="flex-1">
          <p class="font-body text-primary font-medium">{{ p.name }}</p>
          <p class="font-body text-sm text-primary/60">{{ p.category }} · {{ p.price }} €</p>
        </div>
        <span
          v-if="p.featured"
          class="text-xs font-body text-primary/60 border border-primary/30 rounded-full px-2 py-0.5"
        >
          Featured
        </span>
        <span :class="p.stock > 0 ? 'text-green-600' : 'text-red-500'" class="text-xs font-body">
          {{ p.stock > 0 ? `${p.stock} en stock` : 'Épuisé' }}
        </span>
        <AppButton variant="ghost" @click="navigateTo(`/admin/products/${p.id}`)">
          Modifier
        </AppButton>
        <button
          type="button"
          class="focus-ring rounded text-primary/50 hover:text-red-500 transition-colors font-body text-sm"
          :aria-label="`Supprimer ${p.name}`"
          @click="deleteProduct(p.id!)"
        >
          Supprimer
        </button>
      </div>
    </div>

    <p v-if="products.length === 0" class="text-center font-body text-primary/30 py-16">
      Aucun produit. Créez-en un !
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const { getAll, remove } = useProducts()
const products = ref<Awaited<ReturnType<typeof getAll>>>([])

onMounted(async () => {
  try {
    products.value = await getAll()
  } catch {
    products.value = []
  }
})

const deleteProduct = async (id: string) => {
  if (!confirm('Supprimer ce produit ?')) return
  try {
    await remove(id)
    products.value = products.value.filter((p) => p.id !== id)
  } catch {
    // swallow: Firestore rules enforce authz; UI doesn't need to expose details
  }
}
</script>
