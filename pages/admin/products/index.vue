<!-- pages/admin/products/index.vue -->
<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <h1 class="font-heading text-3xl text-primary">Produits</h1>
      <AppButton variant="primary" @click="navigateTo('/admin/products/new')">
        + Nouveau produit
      </AppButton>
    </div>

    <ul class="divide-y divide-accent/20 list-none p-0">
      <li v-for="p in products" :key="p.id" class="flex items-center gap-4 py-4">
        <!-- Native <img> for Firebase Storage URLs. NuxtImg would route the
             request through IPX which fails on Firebase download URLs
             (query-string + token). Since we control image size at upload,
             re-encoding on the server isn't needed. -->
        <img
          v-if="p.images[0]"
          :src="p.images[0]"
          :alt="p.name"
          width="56"
          height="56"
          loading="lazy"
          decoding="async"
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
      </li>
    </ul>

    <p v-if="products.length === 0 && !loading" class="text-center font-body text-primary/60 py-16">
      Aucun produit. Créez-en un !
    </p>

    <div v-if="hasMore" class="flex justify-center mt-6">
      <AppButton variant="outline" :disabled="loadingMore" @click="loadMore">
        {{ loadingMore ? 'Chargement...' : 'Charger plus' }}
      </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/composables/useProducts'
import { PRODUCTS_PAGE_SIZE } from '~/composables/useProducts'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const { getAll, remove } = useProducts()

const products = ref<Product[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const lastDocId = ref<string | null>(null)
const hasMore = ref(false)

const fetchPage = async (reset: boolean) => {
  const cursor = reset ? undefined : (lastDocId.value ?? undefined)
  try {
    const r = await getAll(cursor)
    if (reset) products.value = r.items
    else products.value.push(...r.items)
    lastDocId.value = r.lastDocId
    hasMore.value = r.items.length === PRODUCTS_PAGE_SIZE
  } catch {
    if (reset) products.value = []
  }
}

const loadMore = async () => {
  if (!hasMore.value || loadingMore.value) return
  loadingMore.value = true
  await fetchPage(false)
  loadingMore.value = false
}

onMounted(async () => {
  await fetchPage(true)
  loading.value = false
})

const deleteProduct = async (id: string) => {
  if (!confirm('Supprimer ce produit et ses images ?')) return
  try {
    await remove(id)
    products.value = products.value.filter((p) => p.id !== id)
  } catch {
    // swallow: Firestore rules enforce authz; UI doesn't need to expose details
  }
}
</script>
