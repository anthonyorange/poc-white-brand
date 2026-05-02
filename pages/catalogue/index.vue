<!-- pages/catalogue/index.vue -->
<template>
  <div class="max-w-5xl mx-auto px-6 py-12">
    <RevealOnScroll>
      <h1 class="font-heading text-5xl text-primary text-center mb-4">Collection</h1>
      <p class="font-body text-primary/60 text-center mb-10">
        {{ products.length }} pièce{{ products.length > 1 ? 's' : '' }}
      </p>
    </RevealOnScroll>

    <div class="flex justify-center mb-10">
      <CategoryFilter v-model="activeCategory" />
    </div>

    <ProductGrid v-if="products.length" :products="products" />
    <p v-else class="text-center font-body text-primary/60 py-20">
      Aucun bijou dans cette catégorie pour le moment.
    </p>

    <div v-if="hasMore" class="flex justify-center mt-10">
      <AppButton variant="outline" :disabled="loadingMore" @click="loadMore">
        {{ loadingMore ? 'Chargement...' : 'Voir plus' }}
      </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProductCategory, Product } from '~/composables/useProducts'
import { PRODUCTS_PAGE_SIZE } from '~/composables/useProducts'

const { getAll, getByCategory } = useProducts()
const route = useRoute()
const router = useRouter()
const brand = useBrand()

const VALID_CATS: Array<ProductCategory | 'all'> = [
  'all',
  'bagues',
  'colliers',
  'bracelets',
  'boucles',
]

// Sanitize query param. SYM-GR-0003.
const parseCategory = (raw: unknown): ProductCategory | 'all' =>
  VALID_CATS.includes(raw as ProductCategory | 'all') ? (raw as ProductCategory | 'all') : 'all'

const activeCategory = ref<ProductCategory | 'all'>(parseCategory(route.query.category))

// SSR first page so crawlers see a populated grid. The cursor we expose for
// pagination is the doc ID (string) rather than a QueryDocumentSnapshot,
// so the payload remains devalue-serializable across SSR → client.
const { data: firstPage } = await useAsyncData(
  `catalogue-${activeCategory.value}`,
  async () => {
    try {
      const r =
        activeCategory.value === 'all' ? await getAll() : await getByCategory(activeCategory.value)
      return { items: r.items, lastDocId: r.lastDocId }
    } catch {
      return { items: [] as Product[], lastDocId: null as string | null }
    }
  },
  { default: () => ({ items: [] as Product[], lastDocId: null as string | null }) },
)

const products = ref<Product[]>(firstPage.value.items)
const loadingMore = ref(false)
const lastDocId = ref<string | null>(firstPage.value.lastDocId)
const hasMore = ref(firstPage.value.items.length === PRODUCTS_PAGE_SIZE)

const fetchPage = async (reset: boolean) => {
  const cursor = reset ? undefined : (lastDocId.value ?? undefined)
  try {
    const result =
      activeCategory.value === 'all'
        ? await getAll(cursor)
        : await getByCategory(activeCategory.value, cursor)
    if (reset) products.value = result.items
    else products.value.push(...result.items)
    lastDocId.value = result.lastDocId
    hasMore.value = result.items.length === PRODUCTS_PAGE_SIZE
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

// Re-fetch on category switch (client-side only — SSR already did page 1 for
// the initial category). Updates the URL query param.
watch(activeCategory, async (cat) => {
  router.replace({ query: cat !== 'all' ? { category: cat } : {} })
  lastDocId.value = null
  hasMore.value = false
  await fetchPage(true)
})

useSeoMeta({
  title: 'Collection',
  description: () => `Découvrez tous les bijoux faits main de ${brand.config.value.name}.`,
})
</script>
